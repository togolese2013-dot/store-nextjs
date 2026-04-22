import express from "express";
import { getSession } from "../../lib/auth";
import {
  getStockBoutiqueStats, getStockBoutiqueList, getRecentBoutiqueMovements,
  createBoutiqueMouvement,
} from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

router.get("/api/admin/stock-boutique", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const q      = (req.query.q as string) || undefined;
    const filter = ((req.query.filter as string) || "all") as "all"|"faible"|"epuise"|"disponible";
    const limit  = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const [stats, { items, total }, movements] = await Promise.all([
      getStockBoutiqueStats(),
      getStockBoutiqueList({ search: q, filter, limit, offset }),
      getRecentBoutiqueMovements(20),
    ]);
    res.json({ stats, items, total, movements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message.includes("doesn't exist") || message.includes("ER_NO_SUCH_TABLE")) {
      return res.status(503).json({ error: "migration_needed" });
    }
    res.status(500).json({ error: message });
  }
});

router.post("/api/admin/stock-boutique/mouvement", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { produit_id, type, quantite, motif, ref_commande } = req.body;
    if (!produit_id || !type || !quantite) {
      return res.status(400).json({ error: "produit_id, type et quantite sont requis." });
    }
    if (!["entree","sortie","retrait","ajustement"].includes(type)) {
      return res.status(400).json({ error: "Type de mouvement invalide." });
    }
    if (Number(quantite) <= 0) {
      return res.status(400).json({ error: "La quantité doit être supérieure à 0." });
    }
    await createBoutiqueMouvement({
      produit_id:   Number(produit_id),
      type,
      quantite:     Number(quantite),
      motif:        motif  || undefined,
      ref_commande: ref_commande || undefined,
      admin_id:     session.id,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

router.get("/api/admin/stock-boutique/entrees", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const q      = (req.query.q as string) || "";
    const limit  = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const conditions = ["bm.type = 'entree'"];
    const params: (string | number)[] = [];
    if (q) { conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      `SELECT bm.id, bm.produit_id, p.nom AS nom_produit, p.reference,
              bm.quantite, bm.motif, bm.ref_commande, bm.created_at
       FROM boutique_mouvements bm
       JOIN produits p ON p.id = bm.produit_id
       ${where}
       ORDER BY bm.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
    );
    const [cnt] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM boutique_mouvements bm JOIN produits p ON p.id = bm.produit_id ${where}`,
      params
    );
    res.json({ items: rows, total: Number(cnt[0]?.cnt ?? 0) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
