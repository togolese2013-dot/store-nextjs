import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import { getProducts, getProductCount, getProductStatusCounts, getCategories, db, produitCols, invalidateProduitColsCache } from "@/lib/db";
import { getStockStats } from "@/lib/admin-db";
import type mysql from "mysql2/promise";

const router = express.Router();

router.get("/api/admin/products/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [stockStats, statusCounts] = await Promise.all([
      getStockStats(),
      getProductStatusCounts(),
    ]);
    res.json({ stockStats, statusCounts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const q       = (req.query.q as string) || undefined;
  const catId   = req.query.category ? Number(req.query.category) : undefined;
  const brandId = req.query.brand    ? Number(req.query.brand)    : undefined;
  const statut  = (req.query.statut as string) || undefined;
  const page    = Math.max(1, Number(req.query.page) || 1);
  const limit   = Math.min(100, Number(req.query.limit) || 20);
  const offset  = req.query.offset !== undefined ? Number(req.query.offset) : (page - 1) * limit;
  const statutFilter = ["disponible","faible","epuise"].includes(statut ?? "")
    ? statut as "disponible" | "faible" | "epuise"
    : undefined;

  const [products, total] = await Promise.all([
    getProducts({ search: q, categoryId: catId, marqueId: brandId, limit, offset, statut: statutFilter, includeInactive: true }),
    getProductCount({ search: q, categoryId: catId, marqueId: brandId, statut: statutFilter, includeInactive: true }),
  ]);

  res.json({ products, total, page, limit });
});

router.post("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  try {
    const body = req.body;
    const { nom, description, categorie_id, marque_id, prix_unitaire,
            stock_magasin, stock_boutique, stock_minimum, remise, neuf, actif, image_url, images } = body;

    let reference = body.reference?.trim() || "";
    if (!reference) {
      const [refRows] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
        `SELECT reference FROM produits
         WHERE reference REGEXP '^PROD-[0-9]+$'
         ORDER BY CAST(SUBSTRING(reference, 6) AS UNSIGNED) DESC
         LIMIT 1`
      );
      const lastNum = refRows.length > 0
        ? parseInt((refRows[0].reference as string).replace("PROD-", ""), 10)
        : 0;
      reference = `PROD-${String(isNaN(lastNum) ? 1 : lastNum + 1).padStart(3, "0")}`;
    }

    if (!nom || !prix_unitaire) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    const cleanImages = Array.isArray(images) ? images.filter((u: unknown) => typeof u === "string" && u.trim() !== "") : [];
    const imagesJson  = cleanImages.length > 0 ? JSON.stringify(cleanImages) : null;
    const stockMagasin = Number(stock_magasin ?? 0);

    // Guarantee images_json column exists before INSERT (ALTER TABLE is no-op if already present)
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`); } catch { /* already exists */ }
    invalidateProduitColsCache();
    const cols = await produitCols();

    const columns: string[] = ["reference", "nom", "description", "categorie_id", "prix_unitaire"];
    const values: (string | number | boolean | null)[] = [
      reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire),
    ];

    if (cols.stock_magasin)  { columns.push("stock_magasin");  values.push(stockMagasin); }
    if (cols.stock_boutique) { columns.push("stock_boutique"); values.push(Number(stock_boutique ?? 0)); }
    if (cols.remise)         { columns.push("remise");         values.push(Number(remise ?? 0)); }
    if (cols.neuf)           { columns.push("neuf");           values.push(neuf ? 1 : 0); }
    if (cols.stock_minimum)  { columns.push("stock_minimum");  values.push(Number(stock_minimum ?? 5)); }
    columns.push("actif"); values.push(actif !== false ? 1 : 0);
    if (cols.image_url)      { columns.push("image_url");      values.push(image_url ?? null); }
    else if (cols.image)     { columns.push("image");          values.push(image_url ?? null); }
    if (cols.marque_id && marque_id) { columns.push("marque_id"); values.push(Number(marque_id)); }
    // images_json is guaranteed to exist at this point
    columns.push("images_json"); values.push(imagesJson);

    const placeholders = columns.map(() => "?").join(",");
    const [result] = await (db as import("mysql2/promise").Pool).execute<mysql.ResultSetHeader>(
      `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`, values
    );
    const newId = result.insertId;

    if (stockMagasin > 0) {
      try {
        await (db as import("mysql2/promise").Pool).execute(
          `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note)
           VALUES (?, 'entree', ?, ?, 'Stock initial à la création du produit')`,
          [newId, stockMagasin, stockMagasin]
        );
      } catch { /* non-fatal */ }
    }

    emitAdminEvent("produit");
    return res.json({ ok: true, id: newId });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.get("/api/admin/products/search", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const q     = (req.query.q as string) || "";
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const products = await getProducts({ search: q, limit, includeInactive: false });
  res.json({ products });
});

router.get("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [rows] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      "SELECT * FROM produits WHERE id = ? LIMIT 1", [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable." });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    // Guarantee optional columns exist before UPDATE
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN stock_minimum INT NULL DEFAULT 5`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`); } catch { /* already exists */ }
    invalidateProduitColsCache();
    const cols = await produitCols();
    const body = req.body;
    const sets: string[] = [];
    const vals: (string | number | boolean | null)[] = [];
    // Only include columns that exist in the DB schema
    const alwaysAllowed = ["nom","description","categorie_id","prix_unitaire","stock_magasin",
                           "stock_boutique","remise","neuf","actif","image_url","image","reference"];
    for (const key of alwaysAllowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (cols.stock_minimum && "stock_minimum" in body) { sets.push("stock_minimum = ?"); vals.push(body.stock_minimum); }
    if (cols.marque_id     && "marque_id"     in body) { sets.push("marque_id = ?");     vals.push(body.marque_id); }
    if (cols.images_json   && "images_json"   in body) { sets.push("images_json = ?");   vals.push(body.images_json); }
    if ("images" in body) {
      const rawImgs   = Array.isArray(body.images) ? body.images : [];
      const cleanImgs = rawImgs.filter((u: unknown) => typeof u === "string" && (u as string).trim() !== "");
      sets.push("images_json = ?");
      vals.push(cleanImgs.length > 0 ? JSON.stringify(cleanImgs) : null);
    }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    await (db as import("mysql2/promise").Pool).execute(
      `UPDATE produits SET ${sets.join(", ")} WHERE id = ?`, vals
    );
    emitAdminEvent("produit");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  await (db as import("mysql2/promise").Pool).execute(
    "UPDATE produits SET actif = 0 WHERE id = ?", [req.params.id]
  );
  emitAdminEvent("produit");
  res.json({ ok: true });
});

export default router;
