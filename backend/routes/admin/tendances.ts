import express from "express";
import { getSession } from "../../lib/auth";
import pool from "@/lib/db";
import mysql from "mysql2/promise";

const router = express.Router();

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

router.get("/api/admin/tendances", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const periode = (req.query.periode as string) || "mensuelle";
  const annee   = Number(req.query.annee) || new Date().getFullYear();
  const prevAnnee = annee - 1;

  try {
    // ── Stats globales ────────────────────────────────────────────────────────
    const [[statsRow]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT
         COUNT(*) AS nb_ventes,
         COALESCE(SUM(total), 0) AS ca,
         COALESCE(AVG(total), 0) AS panier_moyen,
         COALESCE(SUM(montant_paye), 0) AS montant_paye_total
       FROM factures
       WHERE YEAR(created_at) = ? AND statut != 'annule'`,
      [annee]
    );
    const stats = {
      nb_ventes:    Number(statsRow?.nb_ventes ?? 0),
      ca:           Math.round(Number(statsRow?.ca ?? 0)),
      panier_moyen: Math.round(Number(statsRow?.panier_moyen ?? 0)),
      annee,
    };

    // ── Évolution (mensuelle / trimestrielle / annuelle) ──────────────────────
    let evolutionRows: mysql.RowDataPacket[] = [];
    if (periode === "mensuelle") {
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           MONTH(created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(total), 0) AS ca,
           COALESCE(AVG(total), 0) AS panier_moyen,
           COALESCE(SUM(montant_paye), 0) AS montant_paye
         FROM factures
         WHERE YEAR(created_at) = ? AND statut != 'annule'
         GROUP BY MONTH(created_at)
         ORDER BY mois`,
        [annee]
      );
      evolutionRows = rows;
    } else if (periode === "trimestrielle") {
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           QUARTER(created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(total), 0) AS ca,
           COALESCE(AVG(total), 0) AS panier_moyen,
           COALESCE(SUM(montant_paye), 0) AS montant_paye
         FROM factures
         WHERE YEAR(created_at) = ? AND statut != 'annule'
         GROUP BY QUARTER(created_at)
         ORDER BY mois`,
        [annee]
      );
      evolutionRows = rows;
    } else {
      // annuelle — 5 dernières années
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           YEAR(created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(total), 0) AS ca,
           COALESCE(AVG(total), 0) AS panier_moyen,
           COALESCE(SUM(montant_paye), 0) AS montant_paye
         FROM factures
         WHERE statut != 'annule'
         GROUP BY YEAR(created_at)
         ORDER BY mois`
      );
      evolutionRows = rows;
    }

    const evolution = evolutionRows.map(r => {
      let label: string;
      if (periode === "mensuelle")      label = `${MOIS_LABELS[Number(r.mois) - 1]} ${annee}`;
      else if (periode === "trimestrielle") label = `T${r.mois} ${annee}`;
      else                              label = String(r.mois);
      return {
        label,
        mois:         Number(r.mois),
        nb_ventes:    Number(r.nb_ventes),
        ca:           Math.round(Number(r.ca)),
        panier_moyen: Math.round(Number(r.panier_moyen)),
        montant_paye: Math.round(Number(r.montant_paye)),
      };
    });

    // ── Détails par période (même structure qu'évolution) ─────────────────────
    const details = evolution.map(e => ({
      periode:      e.label,
      nb_ventes:    e.nb_ventes,
      ca:           e.ca,
      panier_moyen: e.panier_moyen,
      montant_paye: e.montant_paye,
    }));

    // ── Top produits via JSON_TABLE ───────────────────────────────────────────
    let topProduits: { nom: string; quantite: number; ca: number; pourcentage: number }[] = [];
    try {
      const [prodRows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT
           jt.nom,
           SUM(jt.qty) AS quantite,
           SUM(jt.total) AS ca
         FROM factures f,
         JSON_TABLE(
           f.items, '$[*]'
           COLUMNS (
             nom   VARCHAR(255) PATH '$.nom',
             qty   INT          PATH '$.qty',
             total DECIMAL(12,2) PATH '$.total'
           )
         ) AS jt
         WHERE YEAR(f.created_at) = ? AND f.statut != 'annule' AND jt.nom IS NOT NULL
         GROUP BY jt.nom
         ORDER BY ca DESC
         LIMIT 10`,
        [annee]
      );
      const totalCA = prodRows.reduce((s, r) => s + Number(r.ca), 0) || 1;
      topProduits = prodRows.map(r => ({
        nom:        String(r.nom),
        quantite:   Number(r.quantite),
        ca:         Math.round(Number(r.ca)),
        pourcentage: Math.round((Number(r.ca) / totalCA) * 1000) / 10,
      }));
    } catch { /* JSON_TABLE non supporté — on renvoie vide */ }

    // ── Méthodes de paiement ──────────────────────────────────────────────────
    const [methRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT
         COALESCE(mode_paiement, 'especes') AS methode,
         COUNT(*) AS nb_ventes,
         COALESCE(SUM(montant_paye), 0) AS montant
       FROM factures
       WHERE YEAR(created_at) = ? AND statut != 'annule' AND statut_paiement != 'non_paye'
       GROUP BY mode_paiement
       ORDER BY montant DESC`,
      [annee]
    );
    const totalMeth = methRows.reduce((s, r) => s + Number(r.montant), 0) || 1;
    const METH_LABELS: Record<string, string> = {
      especes:          "Espèces",
      moov_money:       "Moov Money",
      tmoney:           "TMoney",
      virement_bancaire:"Virement bancaire",
      mix_by_yas:       "Mix by Yas",
    };
    const methodesPaiement = methRows.map(r => ({
      methode:    METH_LABELS[String(r.methode)] ?? String(r.methode),
      nb_ventes:  Number(r.nb_ventes),
      montant:    Math.round(Number(r.montant)),
      pourcentage: Math.round((Number(r.montant) / totalMeth) * 1000) / 10,
    }));

    // ── Comparaison année précédente ──────────────────────────────────────────
    const [compRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT YEAR(created_at) AS annee, MONTH(created_at) AS mois,
              COALESCE(SUM(total), 0) AS ca
       FROM factures
       WHERE YEAR(created_at) IN (?, ?) AND statut != 'annule'
       GROUP BY annee, mois
       ORDER BY annee, mois`,
      [prevAnnee, annee]
    );
    const caByYearMonth: Record<number, Record<number, number>> = {
      [prevAnnee]: {},
      [annee]:     {},
    };
    for (const r of compRows) {
      const y = Number(r.annee);
      const m = Number(r.mois);
      if (caByYearMonth[y]) caByYearMonth[y][m] = Math.round(Number(r.ca));
    }
    const comparaison = {
      labels:          MOIS_LABELS,
      annee_courante:  MOIS_LABELS.map((_, i) => caByYearMonth[annee]?.[i + 1]     ?? 0),
      annee_precedente: MOIS_LABELS.map((_, i) => caByYearMonth[prevAnnee]?.[i + 1] ?? 0),
    };

    res.json({ stats, evolution, details, top_produits: topProduits, methodes_paiement: methodesPaiement, comparaison });
  } catch (err) {
    console.error("[tendances]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
