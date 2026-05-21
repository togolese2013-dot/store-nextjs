import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import { hasPageAccess } from "@/lib/admin-permissions";
import { getProducts, getProductCount, getProductStatusCounts, getCategories, db, produitCols, invalidateProduitColsCache } from "@/lib/db";
import { getStockStats } from "@/lib/admin-db";
import type mysql from "mysql2/promise";

const router = express.Router();

function validateImageUrl(url: unknown): string | null {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  const u = url.trim();
  if (!u.startsWith("http")) return u; // relative path — OK
  if (u.includes("cloudinary.com")) return u;
  throw new Error(`Image externe non autorisée : ${u}. Utilisez uniquement Cloudinary.`);
}

function validateImages(imgs: unknown): string[] {
  if (!Array.isArray(imgs)) return [];
  return imgs.map(u => {
    const v = validateImageUrl(u);
    return v ?? "";
  }).filter(Boolean);
}

router.get("/api/admin/products/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const [stockStats, statusCounts, totalCount] = await Promise.all([
      getStockStats(),
      getProductStatusCounts(),
      (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM produits"),
    ]);
    stockStats.en_stock = Number((totalCount[0] as mysql.RowDataPacket[])[0]?.cnt ?? stockStats.en_stock);
    res.json({ stockStats, statusCounts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const q          = (req.query.q as string) || undefined;
  const catId      = req.query.category   ? Number(req.query.category)   : undefined;
  const brandId    = req.query.brand      ? Number(req.query.brand)      : undefined;
  const entrepotId = req.query.entrepot_id ? Number(req.query.entrepot_id) : undefined;
  const statut     = (req.query.statut as string) || undefined;
  const page    = Math.max(1, Number(req.query.page) || 1);
  const limit   = Math.min(500, Number(req.query.limit) || 20);
  const offset  = req.query.offset !== undefined ? Number(req.query.offset) : (page - 1) * limit;
  const statutFilter = ["disponible","faible","epuise"].includes(statut ?? "")
    ? statut as "disponible" | "faible" | "epuise"
    : undefined;

  const [products, total] = await Promise.all([
    getProducts({ search: q, categoryId: catId, marqueId: brandId, limit, offset, statut: statutFilter, includeInactive: true, entrepotId }),
    getProductCount({ search: q, categoryId: catId, marqueId: brandId, statut: statutFilter, includeInactive: true, entrepotId }),
  ]);

  res.json({ products, total, page, limit });
});

router.post("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "products")) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  try {
    const body = req.body;
    const { nom, description, description_longue, categorie_id, marque_id, prix_unitaire,
            stock_magasin, stock_boutique, stock_minimum, remise, neuf, actif, image_url, images } = body;

    const reference = body.reference?.trim() || "";
    const autoRef = !reference;

    const rawSlug = (body.slug as string | undefined)?.trim() || "";
    const autoSlug = rawSlug
      ? rawSlug.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
      : "";

    if (!nom || prix_unitaire == null) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    try {
      validateImageUrl(image_url);
      validateImages(images);
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Image invalide." });
    }

    const cleanImages = Array.isArray(images) ? images.filter((u: unknown) => typeof u === "string" && u.trim() !== "") : [];
    const imagesJson  = cleanImages.length > 0 ? JSON.stringify(cleanImages) : null;
    const stockMagasin = Number(stock_magasin ?? 0);

    // Guarantee optional columns exist before INSERT
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN description_longue TEXT NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN slug VARCHAR(255) NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_slug (slug)`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`); } catch { /* already exists */ }
    invalidateProduitColsCache();
    const cols = await produitCols();

    const columns: string[] = ["reference", "nom", "description", "categorie_id", "prix_unitaire"];
    const values: (string | number | boolean | null)[] = [
      autoRef ? "PROD-TMP" : reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire),
    ];
    // Optional description_longue
    columns.push("description_longue"); values.push(description_longue?.trim() || null);

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
    // slug
    columns.push("slug"); values.push(autoSlug || null);
    // entrepôt
    if (body.entrepot_id != null) { columns.push("entrepot_id"); values.push(Number(body.entrepot_id) || null); }
    if (body.prix_entrepot != null) { columns.push("prix_entrepot"); values.push(Number(body.prix_entrepot) || null); }

    const placeholders = columns.map(() => "?").join(",");
    const [result] = await (db as import("mysql2/promise").Pool).execute<mysql.ResultSetHeader>(
      `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`, values
    );
    const newId = result.insertId;

    if (autoRef) {
      await (db as import("mysql2/promise").Pool).execute(
        "UPDATE produits SET reference = ? WHERE id = ?",
        [`PROD-${newId}`, newId]
      );
    }

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

// ── Auto-generate slugs for products that have none ───────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

router.post("/api/admin/products/generate-slugs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "generate_slugs")) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const pool = db as import("mysql2/promise").Pool;
  try {
    try { await pool.execute(`ALTER TABLE produits ADD COLUMN slug VARCHAR(255) NULL`); } catch { /* exists */ }
    try { await pool.execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_slug (slug)`); } catch { /* exists */ }

    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id, nom, reference FROM produits WHERE slug IS NULL OR slug = ''"
    );

    let updated = 0;
    for (const row of rows as mysql.RowDataPacket[]) {
      const base = toSlug((row.nom as string) || (row.reference as string));
      if (!base) continue;

      let slug = base;
      let attempt = 0;
      for (;;) {
        const candidate = attempt === 0 ? slug : `${base}_${attempt}`;
        const [dup] = await pool.execute<mysql.RowDataPacket[]>(
          "SELECT id FROM produits WHERE slug = ? AND id != ? LIMIT 1", [candidate, row.id]
        );
        if ((dup as mysql.RowDataPacket[]).length === 0) { slug = candidate; break; }
        attempt++;
      }
      await pool.execute("UPDATE produits SET slug = ? WHERE id = ?", [slug, row.id]);
      updated++;
    }

    emitAdminEvent("produit");
    res.json({ ok: true, updated });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Export CSV ────────────────────────────────────────────────────────────────
router.get("/api/admin/products/export", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "export_csv")) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  try {
    const q       = (req.query.q as string) || undefined;
    const catId   = req.query.category ? Number(req.query.category) : undefined;
    const brandId = req.query.brand    ? Number(req.query.brand)    : undefined;
    const statut  = (req.query.statut  as string) || undefined;
    const statutFilter = ["disponible","faible","epuise"].includes(statut ?? "")
      ? statut as "disponible" | "faible" | "epuise"
      : undefined;

    const products = await getProducts({
      search: q, categoryId: catId, marqueId: brandId,
      statut: statutFilter, includeInactive: true,
      limit: 5000, offset: 0,
    });

    // Build CSV
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const headers = [
      "Référence","Nom","Catégorie","Marque","Prix","Prix promo",
      "Stock magasin","Stock boutique","Stock minimum",
      "Statut","Actif","Créé le",
    ];
    const rows = products.map((p: mysql.RowDataPacket) => {
      const prix     = Number(p.prix_unitaire ?? 0);
      const remise   = Number(p.remise ?? 0);
      const promo    = remise > 0 ? Math.round(prix * (1 - remise / 100)) : "";
      const stMag    = Number(p.stock_magasin ?? 0);
      const stBout   = Number(p.stock_boutique ?? p.stock ?? 0);
      const stMin    = Number(p.stock_minimum ?? 0);
      const statut   = stMag === 0 ? "Épuisé" : stMag <= stMin ? "Stock faible" : "Disponible";
      const actif    = p.actif ? "Oui" : "Non";
      const date     = p.created_at ? String(p.created_at).slice(0, 10) : "";
      return [
        p.reference, p.nom, p.categorie_nom ?? "", p.marque_nom ?? p.marque ?? "",
        prix, promo, stMag, stBout, stMin, statut, actif, date,
      ].map(escape).join(",");
    });

    const csv = [headers.map(escape).join(","), ...rows].join("\r\n");
    const filename = `produits_${new Date().toISOString().slice(0,10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("﻿" + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
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
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN description_longue TEXT NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`); } catch { /* already exists */ }
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`); } catch { /* already exists */ }
    invalidateProduitColsCache();
    const cols = await produitCols();
    const body = req.body;
    const sets: string[] = [];
    const vals: (string | number | boolean | null)[] = [];
    // Only include columns that exist in the DB schema
    const alwaysAllowed = ["nom","description","description_longue","categorie_id","prix_unitaire",
                           "stock_magasin","stock_boutique","remise","neuf","actif","reference","slug",
                           "entrepot_id","prix_entrepot"];
    for (const key of alwaysAllowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    // Validate & handle image column
    try {
      if ("image_url" in body || "image" in body) {
        const imgVal = ("image_url" in body ? body.image_url : body.image) as string | null;
        const safe   = validateImageUrl(imgVal);
        const imgCol = cols.image_url ? "image_url" : cols.image ? "image" : null;
        if (imgCol) { sets.push(`${imgCol} = ?`); vals.push(safe ?? null); }
      }
      if (cols.images_json && "images_json" in body) {
        const parsed = typeof body.images_json === "string" ? JSON.parse(body.images_json) : body.images_json;
        const safe   = validateImages(parsed);
        sets.push("images_json = ?"); vals.push(safe.length > 0 ? JSON.stringify(safe) : null);
      }
      if ("images" in body) {
        const safe = validateImages(body.images);
        sets.push("images_json = ?"); vals.push(safe.length > 0 ? JSON.stringify(safe) : null);
      }
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Image invalide." });
    }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    await (db as import("mysql2/promise").Pool).execute(
      `UPDATE produits SET ${sets.join(", ")} WHERE id = ?`, vals
    );

    // Sync boutique_stock table if stock_boutique was updated
    if ("stock_boutique" in body) {
      const newQty = Math.max(0, Number(body.stock_boutique ?? 0));
      const produitId = Number(req.params.id);
      try {
        const pool = db as import("mysql2/promise").Pool;
        await pool.execute(
          `INSERT INTO boutique_stock (produit_id, quantite) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE quantite = VALUES(quantite), updated_at = NOW()`,
          [produitId, newQty]
        );
        await pool.execute(
          `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, admin_id)
           VALUES (?, 'ajustement', ?, 'Modifié via fiche produit', ?)`,
          [produitId, newQty, session.id]
        );
      } catch { /* boutique_stock table may not exist yet */ }
    }

    emitAdminEvent("produit");
    // Re-read slug from DB so the client can update its state reliably
    const [refreshed] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
      "SELECT slug FROM produits WHERE id = ? LIMIT 1", [req.params.id]
    );
    const savedSlug = (refreshed as mysql.RowDataPacket[])[0]?.slug ?? null;
    res.json({ ok: true, slug: savedSlug });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "delete_product")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  await (db as import("mysql2/promise").Pool).execute(
    "DELETE FROM produits WHERE id = ?", [req.params.id]
  );
  emitAdminEvent("produit");
  res.json({ ok: true });
});

export default router;
