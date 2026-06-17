import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

let _tableReady = false;
async function ensureTable(): Promise<void> {
  if (_tableReady) return;
  const pool = db as mysql.Pool;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS variant_groups (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(150) NOT NULL,
      type       VARCHAR(50)  NOT NULL DEFAULT 'text',
      valeurs    JSON NULL,
      shop_id    INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Migrate: add shop_id if missing
  try { await pool.execute("ALTER TABLE variant_groups ADD COLUMN shop_id INT NULL"); }
  catch (e: unknown) { if ((e as { code?: string }).code !== "ER_DUP_FIELDNAME") throw e; }
  _tableReady = true;
}

// GET /api/admin/variant-groups — list all groups
router.get("/api/admin/variant-groups", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const pool = db as mysql.Pool;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, nom, type, valeurs, shop_id, created_at FROM variant_groups ORDER BY nom ASC"
    );
    const groups = rows.map(r => ({
      id:         Number(r.id),
      nom:        r.nom as string,
      type:       r.type as string,
      valeurs:    r.valeurs
        ? (typeof r.valeurs === "string" ? JSON.parse(r.valeurs) : r.valeurs)
        : [],
      shop_id:    r.shop_id ? Number(r.shop_id) : null,
      created_at: r.created_at,
    }));
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// POST /api/admin/variant-groups — create group
router.post("/api/admin/variant-groups", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const { nom, type = "text", valeurs, shop_id } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
    const pool = db as mysql.Pool;
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      "INSERT INTO variant_groups (nom, type, valeurs, shop_id) VALUES (?, ?, ?, ?)",
      [
        nom.trim(),
        type,
        Array.isArray(valeurs) ? JSON.stringify(valeurs) : null,
        shop_id ? Number(shop_id) : null,
      ]
    );
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// PATCH /api/admin/variant-groups/:id — update group
router.patch("/api/admin/variant-groups/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const { nom, type, valeurs } = req.body;
    const pool = db as mysql.Pool;
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if (nom !== undefined) { sets.push("nom = ?"); vals.push(String(nom).trim()); }
    if (type !== undefined) { sets.push("type = ?"); vals.push(String(type)); }
    if (valeurs !== undefined) {
      sets.push("valeurs = ?");
      vals.push(Array.isArray(valeurs) ? JSON.stringify(valeurs) : null);
    }
    if (!sets.length) return res.json({ ok: true });
    vals.push(Number(req.params.id));
    await pool.execute(`UPDATE variant_groups SET ${sets.join(", ")} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// DELETE /api/admin/variant-groups/:id — delete group
router.delete("/api/admin/variant-groups/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const pool = db as mysql.Pool;
    await pool.execute("DELETE FROM variant_groups WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
