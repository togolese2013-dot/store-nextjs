import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

/** Ensure the product_variants table exists and has all columns */
let _variantsReady = false;
async function ensureTable() {
  if (_variantsReady) return;
  await (db as mysql.Pool).execute(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      produit_id      INT NOT NULL,
      nom             VARCHAR(255) NOT NULL DEFAULT '',
      options         JSON,
      prix            DECIMAL(10,2) NOT NULL DEFAULT 0,
      remise          DECIMAL(10,2) NOT NULL DEFAULT 0,
      stock           INT NOT NULL DEFAULT 0,
      stock_boutique  INT NOT NULL DEFAULT 0,
      reference_sku   VARCHAR(100),
      image_url       VARCHAR(500),
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_produit_id (produit_id)
    )
  `);
  // Migrate missing columns on existing tables
  for (const ddl of [
    "ALTER TABLE product_variants ADD COLUMN remise         DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE product_variants ADD COLUMN stock_boutique INT          NOT NULL DEFAULT 0",
  ]) {
    try { await (db as mysql.Pool).execute(ddl); }
    catch (err: unknown) { if ((err as { code?: string }).code !== "ER_DUP_FIELDNAME") throw err; }
  }
  _variantsReady = true;
}

// GET /api/admin/products/:productId/variants  (public — used by storefront too)
router.get("/api/admin/products/:productId/variants", async (req, res) => {
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
    const { nom, options, prix, remise, stock, stock_boutique, reference_sku, image_url } = req.body;
    const [result] = await (db as mysql.Pool).execute<mysql.ResultSetHeader>(
      `INSERT INTO product_variants (produit_id, nom, options, prix, remise, stock, stock_boutique, reference_sku, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.productId,
        nom || "",
        JSON.stringify(options || {}),
        Number(prix) || 0,
        Number(remise) || 0,
        Number(stock) || 0,
        Number(stock_boutique) || 0,
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
    const { nom, options, prix, remise, stock, stock_boutique, reference_sku, image_url } = req.body;
    await (db as mysql.Pool).execute(
      `UPDATE product_variants
       SET nom=?, options=?, prix=?, remise=?, stock=?, stock_boutique=?, reference_sku=?, image_url=?
       WHERE id=? AND produit_id=?`,
      [
        nom || "",
        JSON.stringify(options || {}),
        Number(prix) || 0,
        Number(remise) || 0,
        Number(stock) || 0,
        Number(stock_boutique) || 0,
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

// PATCH /api/admin/products/:productId/variants/:id/boutique-transfer
// Transfer qty from stock (magasin) → stock_boutique
router.patch("/api/admin/products/:productId/variants/:id/boutique-transfer", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const qty = Number(req.body.qty);
  if (!qty || qty <= 0) return res.status(400).json({ error: "qty requis > 0" });
  try {
    await ensureTable();
    const [[row]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT stock, stock_boutique FROM product_variants WHERE id = ? AND produit_id = ?",
      [req.params.id, req.params.productId]
    );
    if (!row) return res.status(404).json({ error: "Variante introuvable" });
    const available = Number(row.stock);
    if (available < qty) return res.status(400).json({ error: `Stock magasin insuffisant (dispo: ${available})` });
    await (db as mysql.Pool).execute(
      "UPDATE product_variants SET stock = stock - ?, stock_boutique = stock_boutique + ? WHERE id = ?",
      [qty, qty, req.params.id]
    );
    const [[updated]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT stock, stock_boutique FROM product_variants WHERE id = ?",
      [req.params.id]
    );
    res.json({ ok: true, stock: Number(updated?.stock ?? 0), stock_boutique: Number(updated?.stock_boutique ?? 0) });
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
