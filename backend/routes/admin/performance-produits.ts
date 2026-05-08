import express from "express";
import { getSession } from "../../lib/auth";
import { db as pool } from "@/lib/db";
import mysql from "mysql2/promise";

const router = express.Router();

// Auto-migrate prix_achat column on produits table
async function ensurePrixAchat() {
  try {
    await pool.execute(`ALTER TABLE produits ADD COLUMN prix_achat DECIMAL(12,2) NULL DEFAULT NULL`);
  } catch { /* column already exists */ }
}
ensurePrixAchat().catch(console.error);

// ─── GET /api/admin/performance-produits ─────────────────────────────────────

router.get("/api/admin/performance-produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const dateDebut = (req.query.date_debut as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const dateFin   = (req.query.date_fin   as string) || new Date().toISOString().slice(0, 10);
  const top       = Math.min(50, Math.max(5, Number(req.query.top) || 10));

  try {
    // ── Top produits via JSON_TABLE ───────────────────────────────────────────
    let produits: {
      nom: string; reference: string; prix: number; prix_achat: number | null;
      quantite: number; ca: number; marge_brute: number; taux_marge: number; nb_ventes: number;
    }[] = [];

    try {
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           jt.nom,
           jt.ref       AS reference,
           COALESCE(p.prix_unitaire, jt.prix_u, 0) AS prix,
           p.prix_achat,
           SUM(jt.qty)  AS quantite,
           SUM(jt.total) AS ca,
           COUNT(DISTINCT f.id) AS nb_ventes
         FROM factures f,
         JSON_TABLE(
           f.items, '$[*]'
           COLUMNS (
             nom   VARCHAR(255)   PATH '$.nom',
             ref   VARCHAR(100)   PATH '$.reference',
             qty   INT            PATH '$.qty',
             prix_u DECIMAL(12,2) PATH '$.prix',
             total DECIMAL(12,2)  PATH '$.total'
           )
         ) AS jt
         LEFT JOIN produits p ON p.reference = jt.ref
         WHERE f.statut != 'annule'
           AND DATE(f.created_at) BETWEEN ? AND ?
           AND jt.nom IS NOT NULL
         GROUP BY jt.nom, jt.ref, p.prix_unitaire, p.prix_achat
         ORDER BY ca DESC
         LIMIT ${top}`,
        [dateDebut, dateFin]
      );

      produits = rows.map(r => {
        const ca        = Math.round(Number(r.ca ?? 0));
        const qty       = Number(r.quantite ?? 0);
        const prixAchat = r.prix_achat != null ? Number(r.prix_achat) : null;
        const coutTotal = prixAchat != null ? prixAchat * qty : 0;
        const margeBrute = prixAchat != null ? ca - coutTotal : ca;
        const tauxMarge  = ca > 0 ? Math.round((margeBrute / ca) * 1000) / 10 : 0;
        return {
          nom:        String(r.nom),
          reference:  String(r.reference ?? ""),
          prix:       Math.round(Number(r.prix ?? 0)),
          prix_achat: prixAchat,
          quantite:   qty,
          ca,
          marge_brute: Math.round(margeBrute),
          taux_marge:  tauxMarge,
          nb_ventes:   Number(r.nb_ventes ?? 0),
        };
      });
    } catch (e) {
      console.error("[performance-produits] JSON_TABLE error:", e);
    }

    // ── Stats globales ────────────────────────────────────────────────────────
    const stats = {
      nb_produits:      produits.length,
      ca:               produits.reduce((s, p) => s + p.ca, 0),
      marge_brute:      produits.reduce((s, p) => s + p.marge_brute, 0),
      quantite_vendue:  produits.reduce((s, p) => s + p.quantite, 0),
    };

    // ── Évolution quotidienne (quantité + CA) sur la période ─────────────────
    let evolution: { date: string; quantite: number; ca: number }[] = [];
    try {
      const [evRows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           DATE(f.created_at) AS date,
           SUM(jt.qty)        AS quantite,
           SUM(jt.total)      AS ca
         FROM factures f,
         JSON_TABLE(
           f.items, '$[*]'
           COLUMNS (
             qty   INT            PATH '$.qty',
             total DECIMAL(12,2)  PATH '$.total'
           )
         ) AS jt
         WHERE f.statut != 'annule'
           AND DATE(f.created_at) BETWEEN ? AND ?
         GROUP BY DATE(f.created_at)
         ORDER BY date`,
        [dateDebut, dateFin]
      );
      evolution = evRows.map(r => ({
        date:     String(r.date).slice(0, 10),
        quantite: Number(r.quantite ?? 0),
        ca:       Math.round(Number(r.ca ?? 0)),
      }));
    } catch { /* JSON_TABLE fallback */ }

    res.json({ stats, produits, evolution });
  } catch (err) {
    console.error("[performance-produits]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
