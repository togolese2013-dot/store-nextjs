import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import { logActivity } from "../../lib/activity-log";
import { hasPageAccess } from "@/lib/admin-permissions";
import { getProducts, getProductCount, getProductStatusCounts, getCategories, db, produitCols, invalidateProduitColsCache } from "@/lib/db";
import { getStockStats, getPrincipalEntrepot } from "@/lib/admin-db";
import { getShopById } from "@/lib/shops";
import { planLimit } from "../../lib/plan-limits";
import { parse as parseCsv } from "csv-parse/sync";
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
    const shopId = session.shop_id ?? 1;
    const [stockStats, statusCounts, totalCount] = await Promise.all([
      getStockStats(shopId),
      getProductStatusCounts(shopId),
      (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM produits WHERE shop_id = ?", [shopId]),
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

  const shopId = session.shop_id ?? 1;
  const [products, total] = await Promise.all([
    getProducts({ search: q, categoryId: catId, marqueId: brandId, limit, offset, statut: statutFilter, includeInactive: true, entrepotId, shopId }),
    getProductCount({ search: q, categoryId: catId, marqueId: brandId, statut: statutFilter, includeInactive: true, entrepotId, shopId }),
  ]);

  // Enrich products with variant stock sums (sum of product_variants.stock per product)
  const ids = products.map((p) => p.id).filter(Boolean) as number[];
  const variantStockMap: Record<number, number> = {};
  if (ids.length > 0) {
    try {
      const [vrows] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
        `SELECT produit_id, COALESCE(SUM(stock), 0) AS variants_stock
         FROM product_variants
         WHERE produit_id IN (${ids.map(() => "?").join(",")})
         GROUP BY produit_id`,
        ids
      );
      for (const row of vrows) variantStockMap[row.produit_id as number] = Number(row.variants_stock);
    } catch { /* table may not exist yet — ignore */ }
  }

  const enriched = products.map((p) => ({
    ...p,
    variants_stock: Object.prototype.hasOwnProperty.call(variantStockMap, p.id) ? variantStockMap[p.id] : null,
  }));

  res.json({ products: enriched, total, page, limit });
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

    // ── Plan limit check ────────────────────────────────────────────────
    const shopId = session.shop_id ?? 1;
    const shop   = await getShopById(shopId);
    const limit  = planLimit(shop?.plan ?? "free");
    if (limit !== Infinity) {
      const [[countRow]] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) AS cnt FROM produits WHERE shop_id = ?", [shopId]
      );
      const currentCount = Number((countRow as mysql.RowDataPacket).cnt ?? 0);
      if (currentCount >= limit) {
        return res.status(403).json({
          error: `Limite atteinte : votre plan ${shop?.plan ?? "free"} autorise ${limit} produits maximum. Passez à un plan supérieur pour en ajouter.`,
          plan_limit: limit,
          current:    currentCount,
        });
      }
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
    // entrepôt — auto-assign entrepôt principal si non fourni
    if (body.entrepot_id != null) {
      columns.push("entrepot_id"); values.push(Number(body.entrepot_id) || null);
    } else {
      const principalId = await getPrincipalEntrepot(shopId).catch(() => null);
      if (principalId) { columns.push("entrepot_id"); values.push(principalId); }
    }
    if (body.prix_entrepot != null) { columns.push("prix_entrepot"); values.push(Number(body.prix_entrepot) || null); }
    if (body.canal_vente) { columns.push("canal_vente"); values.push(body.canal_vente); }
    if (body.prod_condition) { columns.push("prod_condition"); values.push(body.prod_condition); }
    // shop_id (multi-tenant)
    columns.push("shop_id"); values.push(shopId);

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
    logActivity({ shopId: session.shop_id ?? 1, username: session.nom ?? session.username ?? "Admin", actionType: "produit_créé", entity: "produit", entityId: newId, label: `Produit créé : ${body.nom}`, workspace: "Magasin" });
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

    const shopId = session.shop_id ?? 1;
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id, nom, reference FROM produits WHERE shop_id = ? AND (slug IS NULL OR slug = '')",
      [shopId]
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

// ── Import CSV — aperçu (parse + résolution, aucune écriture) ─────────────────
interface ImportRow {
  line:           number;
  action:         "create" | "update";
  existing_id:    number | null;
  reference:      string;
  nom:            string;
  categorie_id:   number | null;
  categorie_nom:  string;
  marque_id:      number | null;
  marque_nom:     string;
  prix_unitaire:  number;
  remise:         number;
  stock_magasin:  number;
  stock_boutique: number;
  stock_minimum:  number;
  actif:          number;
}

function parseImportBool(v: string | undefined): number {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "") return 1; // par défaut actif si colonne absente/vide
  return ["1", "oui", "true", "actif", "yes"].includes(s) ? 1 : 0;
}

async function resolveImportRows(csvText: string, shopId: number) {
  const pool = db as import("mysql2/promise").Pool;
  let records: Record<string, string>[];
  try {
    records = parseCsv(csvText, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  } catch (e) {
    throw new Error("Fichier CSV invalide : " + (e instanceof Error ? e.message : "erreur de lecture"));
  }

  const [catRows]  = await pool.execute<mysql.RowDataPacket[]>("SELECT id, nom FROM categories WHERE shop_id = ?", [shopId]);
  const [marqRows] = await pool.execute<mysql.RowDataPacket[]>("SELECT id, nom FROM marques WHERE shop_id = ?", [shopId]);
  const [prodRows] = await pool.execute<mysql.RowDataPacket[]>("SELECT id, reference FROM produits WHERE shop_id = ?", [shopId]);
  const catByName  = new Map((catRows as mysql.RowDataPacket[]).map(c => [String(c.nom).trim().toLowerCase(), c.id as number]));
  const marqByName = new Map((marqRows as mysql.RowDataPacket[]).map(m => [String(m.nom).trim().toLowerCase(), m.id as number]));
  const prodByRef  = new Map((prodRows as mysql.RowDataPacket[]).map(p => [String(p.reference).trim().toLowerCase(), p.id as number]));

  const rows: ImportRow[] = [];
  const errors: { line: number; reason: string }[] = [];

  records.forEach((r, i) => {
    const line = i + 2; // ligne 1 = en-têtes
    const nom     = (r["Nom"] ?? "").trim();
    const prixRaw = (r["Prix"] ?? "").trim().replace(",", ".");
    const prix    = Number(prixRaw);

    if (!nom)     { errors.push({ line, reason: "Nom manquant" }); return; }
    if (!prixRaw || Number.isNaN(prix) || prix < 0) { errors.push({ line, reason: "Prix invalide" }); return; }

    const reference = (r["Référence"] ?? r["Reference"] ?? "").trim();
    const existingId = reference ? (prodByRef.get(reference.toLowerCase()) ?? null) : null;
    const catNom  = (r["Catégorie"] ?? r["Categorie"] ?? "").trim();
    const marqNom = (r["Marque"] ?? "").trim();

    const promoRaw = (r["Prix promo"] ?? "").trim().replace(",", ".");
    const promo    = promoRaw ? Number(promoRaw) : NaN;
    const remise   = !Number.isNaN(promo) && promo > 0 && promo < prix ? Math.round((prix - promo) * 100) / 100 : 0;

    rows.push({
      line,
      action:        existingId ? "update" : "create",
      existing_id:   existingId,
      reference,
      nom,
      categorie_id:  catNom ? (catByName.get(catNom.toLowerCase()) ?? null) : null,
      categorie_nom: catNom,
      marque_id:     marqNom ? (marqByName.get(marqNom.toLowerCase()) ?? null) : null,
      marque_nom:    marqNom,
      prix_unitaire: prix,
      remise,
      stock_magasin:  Number((r["Stock magasin"]  ?? "0").trim()) || 0,
      stock_boutique: Number((r["Stock boutique"] ?? "0").trim()) || 0,
      stock_minimum:  Number((r["Stock minimum"]  ?? "5").trim()) || 5,
      actif: parseImportBool(r["Actif"]),
    });
  });

  return { rows, errors };
}

router.post("/api/admin/products/import/preview", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "products")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const csvText = (req.body?.csv as string | undefined) ?? "";
  if (!csvText.trim()) return res.status(400).json({ error: "Fichier vide." });

  try {
    const shopId = session.shop_id ?? 1;
    const { rows, errors } = await resolveImportRows(csvText, shopId);

    const createCount = rows.filter(r => r.action === "create").length;
    if (createCount > 0) {
      const shop  = await getShopById(shopId);
      const limit = planLimit(shop?.plan ?? "free");
      if (limit !== Infinity) {
        const pool = db as import("mysql2/promise").Pool;
        const [[countRow]] = await pool.execute<mysql.RowDataPacket[]>(
          "SELECT COUNT(*) AS cnt FROM produits WHERE shop_id = ?", [shopId]
        );
        const current = Number((countRow as mysql.RowDataPacket).cnt ?? 0);
        if (current + createCount > limit) {
          return res.status(403).json({
            error: `Cet import créerait ${createCount} nouveaux produits, ce qui dépasse la limite de votre plan (${limit} max, ${current} actuels). Réduisez le fichier ou passez à un plan supérieur.`,
          });
        }
      }
    }

    res.json({ rows, errors, created: createCount, updated: rows.length - createCount });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Erreur de lecture du fichier." });
  }
});

// ── Import CSV — commit (écrit les lignes validées par /preview) ──────────────
router.post("/api/admin/products/import/commit", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "products")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const rows = req.body?.rows as ImportRow[] | undefined;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Aucune ligne à importer." });
  }

  const shopId = session.shop_id ?? 1;
  const pool   = db as import("mysql2/promise").Pool;
  invalidateProduitColsCache();
  const cols = await produitCols();

  let created = 0, updated = 0;
  const errors: { line: number; reason: string }[] = [];

  for (const r of rows) {
    try {
      if (r.action === "update" && r.existing_id) {
        const [owned] = await pool.execute<mysql.RowDataPacket[]>(
          "SELECT id FROM produits WHERE id = ? AND shop_id = ? LIMIT 1", [r.existing_id, shopId]
        );
        if (!(owned as mysql.RowDataPacket[]).length) {
          errors.push({ line: r.line, reason: "Produit introuvable pour cette boutique" });
          continue;
        }
        await pool.execute(
          `UPDATE produits SET nom=?, categorie_id=?, marque_id=?, prix_unitaire=?, remise=?,
             stock_magasin=?, stock_boutique=?, stock_minimum=?, actif=? WHERE id = ? AND shop_id = ?`,
          [r.nom, r.categorie_id, r.marque_id, r.prix_unitaire, r.remise,
           r.stock_magasin, r.stock_boutique, r.stock_minimum, r.actif, r.existing_id, shopId]
        );
        updated++;
      } else {
        const slug = toSlug(r.nom);
        const columns: string[] = ["reference", "nom", "categorie_id", "prix_unitaire", "remise", "stock_magasin", "actif", "shop_id"];
        const values: (string | number | null)[] = [
          r.reference || "PROD-TMP", r.nom, r.categorie_id, r.prix_unitaire, r.remise, r.stock_magasin, r.actif, shopId,
        ];
        if (cols.stock_boutique) { columns.push("stock_boutique"); values.push(r.stock_boutique); }
        if (cols.stock_minimum)  { columns.push("stock_minimum");  values.push(r.stock_minimum); }
        if (cols.marque_id && r.marque_id) { columns.push("marque_id"); values.push(r.marque_id); }
        columns.push("slug"); values.push(slug || null);
        const [result] = await pool.execute<mysql.ResultSetHeader>(
          `INSERT INTO produits (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(",")})`, values
        );
        if (!r.reference) {
          await pool.execute("UPDATE produits SET reference = ? WHERE id = ?", [`PROD-${result.insertId}`, result.insertId]);
        }
        created++;
      }
    } catch (e) {
      errors.push({ line: r.line, reason: e instanceof Error ? e.message : "Erreur" });
    }
  }

  emitAdminEvent("produit");
  logActivity({
    shopId, username: session.nom ?? session.username ?? "Admin",
    actionType: "produit_créé", entity: "produit",
    label: `Import CSV : ${created} créé${created > 1 ? "s" : ""}, ${updated} modifié${updated > 1 ? "s" : ""}`,
    workspace: "Magasin",
  });
  res.json({ ok: true, created, updated, errors });
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

    const shopId = session.shop_id ?? 1;
    const products = await getProducts({
      search: q, categoryId: catId, marqueId: brandId,
      statut: statutFilter, includeInactive: true,
      limit: 5000, offset: 0, shopId,
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
    const rows = products.map((p: any) => {
      const prix     = Number(p.prix_unitaire ?? 0);
      const remise   = Number(p.remise ?? 0);
      const promo    = remise > 0 ? Math.max(0, prix - remise) : ""; // remise en FCFA, pas en %
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
  const shopId = session.shop_id ?? 1;
  const products = await getProducts({ search: q, limit, includeInactive: false, shopId });
  res.json({ products });
});

router.get("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const shopId = session.shop_id ?? 1;
    const [rows] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      "SELECT * FROM produits WHERE id = ? AND shop_id = ? LIMIT 1", [req.params.id, shopId]
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
    try { await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN options_config JSON NULL`); } catch { /* already exists */ }
    invalidateProduitColsCache();
    const cols = await produitCols();
    const body = req.body;
    const sets: string[] = [];
    const vals: (string | number | boolean | null)[] = [];
    // Only include columns that exist in the DB schema
    const alwaysAllowed = ["nom","description","description_longue","categorie_id","marque_id","prix_unitaire",
                           "stock_magasin","stock_boutique","remise","neuf","actif","reference","slug",
                           "entrepot_id","prix_entrepot","canal_vente","prod_condition","options_config"];
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
    logActivity({ shopId: session.shop_id ?? 1, username: session.nom ?? session.username ?? "Admin", actionType: "produit_modifié", entity: "produit", entityId: Number(req.params.id), label: `Produit #${req.params.id} modifié`, workspace: "Magasin" });
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
  const delId = Number(req.params.id);
  await (db as import("mysql2/promise").Pool).execute(
    "DELETE FROM produits WHERE id = ?", [delId]
  );
  emitAdminEvent("produit");
  logActivity({ shopId: session.shop_id ?? 1, username: session.nom ?? session.username ?? "Admin", actionType: "produit_supprimé", entity: "produit", entityId: delId, label: `Produit #${delId} supprimé`, workspace: "Magasin" });
  res.json({ ok: true });
});

export default router;
