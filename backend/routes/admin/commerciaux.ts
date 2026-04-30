import express from "express";
import { db } from "@/lib/db";
import { getSession } from "../../lib/auth";
import type mysql from "mysql2/promise";

const router = express.Router();
const pool   = db as import("mysql2/promise").Pool;

// ─── Migration — appelée au démarrage du backend ─────────────────────────────
export async function ensureCommerciauxTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS commerciaux (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      nom             VARCHAR(100)  NOT NULL,
      email           VARCHAR(100)  NOT NULL,
      telephone       VARCHAR(20)   NULL,
      taux_commission DECIMAL(5,2)  NOT NULL DEFAULT 5.00,
      actif           TINYINT(1)    NOT NULL DEFAULT 1,
      created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS commercial_produits (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      commercial_id INT NOT NULL,
      produit_id    INT NOT NULL,
      UNIQUE KEY uq_cp (commercial_id, produit_id),
      FOREIGN KEY (commercial_id) REFERENCES commerciaux(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS commissions (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      commercial_id INT           NOT NULL,
      facture_id    INT           NULL,
      montant       DECIMAL(10,2) NOT NULL DEFAULT 0,
      statut        ENUM('en_attente','paye') NOT NULL DEFAULT 'en_attente',
      note          TEXT          NULL,
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at       DATETIME      NULL,
      FOREIGN KEY (commercial_id) REFERENCES commerciaux(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// ─── GET /api/admin/commerciaux ──────────────────────────────────────────────
router.get("/api/admin/commerciaux", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        c.*,
        COUNT(DISTINCT cp.produit_id)                                                  AS nb_produits,
        COUNT(DISTINCT cm.id)                                                          AS nb_ventes,
        COALESCE(SUM(cm.montant), 0)                                                   AS total_commissions,
        COALESCE(SUM(CASE WHEN cm.statut = 'en_attente' THEN cm.montant ELSE 0 END),0) AS commissions_en_attente
      FROM commerciaux c
      LEFT JOIN commercial_produits cp ON cp.commercial_id = c.id
      LEFT JOIN commissions          cm ON cm.commercial_id = c.id
      GROUP BY c.id
      ORDER BY c.nom ASC
    `);
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── GET /api/admin/commerciaux/stats ────────────────────────────────────────
router.get("/api/admin/commerciaux/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [[stats]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(DISTINCT CASE WHEN c.actif = 1 THEN c.id END)                            AS commerciaux_actifs,
        COUNT(DISTINCT cm.id)                                                           AS ventes_total,
        COALESCE(SUM(cm.montant), 0)                                                   AS commissions_total,
        COALESCE(SUM(CASE WHEN cm.statut = 'paye'       THEN cm.montant ELSE 0 END),0) AS commissions_payees,
        COALESCE(SUM(CASE WHEN cm.statut = 'en_attente' THEN cm.montant ELSE 0 END),0) AS commissions_en_attente
      FROM commerciaux c
      LEFT JOIN commissions cm ON cm.commercial_id = c.id
    `);
    res.json(stats ?? {});
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── POST /api/admin/commerciaux ─────────────────────────────────────────────
router.post("/api/admin/commerciaux", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, email, telephone, taux_commission } = req.body as Record<string, string>;
  if (!nom?.trim() || !email?.trim()) return res.status(400).json({ error: "Nom et email requis." });
  try {
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      "INSERT INTO commerciaux (nom, email, telephone, taux_commission) VALUES (?, ?, ?, ?)",
      [nom.trim(), email.trim().toLowerCase(), telephone ?? null, parseFloat(taux_commission ?? "5")]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── PATCH /api/admin/commerciaux/:id ────────────────────────────────────────
router.patch("/api/admin/commerciaux/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, email, telephone, taux_commission, actif } = req.body as Record<string, unknown>;
  try {
    await pool.execute(
      "UPDATE commerciaux SET nom=?, email=?, telephone=?, taux_commission=?, actif=? WHERE id=?",
      [nom, email, telephone ?? null, taux_commission ?? 5, actif ?? 1, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── GET /api/admin/commerciaux/commissions ───────────────────────────────────
router.get("/api/admin/commerciaux/commissions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT cm.*, c.nom AS commercial_nom, c.email AS commercial_email
      FROM commissions cm
      JOIN commerciaux c ON c.id = cm.commercial_id
      ORDER BY cm.created_at DESC
    `);
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── PATCH /api/admin/commerciaux/commissions/:id ────────────────────────────
router.patch("/api/admin/commerciaux/commissions/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await pool.execute(
      "UPDATE commissions SET statut='paye', paid_at=NOW() WHERE id=?",
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── GET /api/admin/commerciaux/:id/produits ─────────────────────────────────
router.get("/api/admin/commerciaux/:id/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT p.id, p.nom
      FROM commercial_produits cp
      JOIN produits p ON p.id = cp.produit_id
      WHERE cp.commercial_id = ?
      ORDER BY p.nom ASC
    `, [req.params.id]);
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

// ─── PUT /api/admin/commerciaux/:id/produits ─────────────────────────────────
router.put("/api/admin/commerciaux/:id/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { produit_ids } = req.body as { produit_ids: number[] };
  try {
    await pool.execute("DELETE FROM commercial_produits WHERE commercial_id = ?", [req.params.id]);
    if (Array.isArray(produit_ids) && produit_ids.length > 0) {
      const values = produit_ids.map(pid => [Number(req.params.id), Number(pid)]);
      await pool.query("INSERT INTO commercial_produits (commercial_id, produit_id) VALUES ?", [values]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
