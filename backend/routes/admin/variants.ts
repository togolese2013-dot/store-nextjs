import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

/** Ensure the product_variants table exists */
async function ensureTable() {
  await (db as mysql.Pool).execute(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      produit_id    INT NOT NULL,
      nom           VARCHAR(255) NOT NULL DEFAULT '',
      options       JSON,
      prix          DECIMAL(10,2) NOT NULL DEFAULT 0,
      stock         INT NOT NULL DEFAULT 0,
      reference_sku VARCHAR(100),
      image_url     VARCHAR(500),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_produit_id (produit_id)
    )
  `);
}

// GET /api/admin/products/:productId/variants
router.get("/api/admin/products/:productId/variants", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC",
      [req.params.productId]
    );
    const variants = rows.map(r => ({
      ...r,
      options: (() => {
        if (!r.options) return {};
        if (typeof r.options === "object") return r.options;
        try { return JSON.parse(r.options); } catch { return {}; }
      })(),
    }));
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// POST /api/admin/products/:productId/variants
router.post("/api/admin/products/:productId/variants", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const { nom, options, prix, stock, reference_sku, image_url } = req.body;
    const [result] = await (db as mysql.Pool).execute<mysql.ResultSetHeader>(
      `INSERT INTO product_variants (produit_id, nom, options, prix, stock, reference_sku, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.productId,
        nom || "",
        JSON.stringify(options || {}),
        Number(prix) || 0,
        Number(stock) || 0,
        reference_sku || null,
        image_url || null,
      ]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// PUT /api/admin/products/:productId/variants/:id
router.put("/api/admin/products/:productId/variants/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await ensureTable();
    const { nom, options, prix, stock, reference_sku, image_url } = req.body;
    await (db as mysql.Pool).execute(
      `UPDATE product_variants SET nom=?, options=?, prix=?, stock=?, reference_sku=?, image_url=?
       WHERE id=? AND produit_id=?`,
      [
        nom || "",
        JSON.stringify(options || {}),
        Number(prix) || 0,
        Number(stock) || 0,
        reference_sku || null,
        image_url || null,
        req.params.id,
        req.params.productId,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// DELETE /api/admin/products/:productId/variants/:id
router.delete("/api/admin/products/:productId/variants/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await (db as mysql.Pool).execute(
      "DELETE FROM product_variants WHERE id=? AND produit_id=?",
      [req.params.id, req.params.productId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
