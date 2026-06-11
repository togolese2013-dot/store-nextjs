"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../lib/utils.ts
var finalPrice, formatPrice;
var init_utils = __esm({
  "../lib/utils.ts"() {
    "use strict";
    finalPrice = (p) => p.remise > 0 ? Math.max(0, p.prix_unitaire - p.remise) : p.prix_unitaire;
    formatPrice = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";
  }
});

// ../lib/db.ts
var db_exports = {};
__export(db_exports, {
  checkReviewsTable: () => checkReviewsTable,
  db: () => db,
  finalPrice: () => finalPrice,
  formatPrice: () => formatPrice,
  getCategories: () => getCategories,
  getProductBySlug: () => getProductBySlug,
  getProductCount: () => getProductCount,
  getProductStatusCounts: () => getProductStatusCounts,
  getProductVariants: () => getProductVariants,
  getProducts: () => getProducts,
  getProductsByIds: () => getProductsByIds,
  invalidateProduitColsCache: () => invalidateProduitColsCache,
  produitCols: () => produitCols
});
function createPool() {
  const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const url = rawUrl?.startsWith("mysql://") || rawUrl?.startsWith("mysql2://") ? rawUrl : void 0;
  const shared = {
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
    timezone: "+00:00",
    connectTimeout: 1e4,
    // Prevent ECONNRESET from Railway/MySQL idle-connection timeouts
    enableKeepAlive: true,
    keepAliveInitialDelay: 3e4
  };
  if (url) {
    return import_promise.default.createPool({
      uri: url,
      ...shared,
      ssl: isProduction ? { rejectUnauthorized: false } : void 0
    });
  }
  return import_promise.default.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "togol2600657",
    ...shared
  });
}
function getOrCreatePool() {
  if (globalThis.__db_pool) return globalThis.__db_pool;
  const pool2 = createPool();
  pool2.on("error", (err) => console.error("[db pool]", err.message));
  globalThis.__db_pool = pool2;
  return pool2;
}
async function produitCols() {
  if (_cols) return _cols;
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map((r) => r.COLUMN_NAME.toLowerCase()));
  if (!names.has("images_json")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
      names.add("images_json");
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("images_json");
      }
    }
  }
  if (!names.has("stock_minimum")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN stock_minimum INT NULL DEFAULT 5`);
      names.add("stock_minimum");
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("stock_minimum");
      }
    }
  }
  if (!names.has("marque_id")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`);
      names.add("marque_id");
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("marque_id");
      }
    }
  }
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS marques (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch {
  }
  if (!names.has("slug")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN slug VARCHAR(255) NULL`);
      names.add("slug");
      try {
        await db.execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_slug (slug)`);
      } catch {
      }
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("slug");
      }
    }
  }
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS entrepots (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(150) NOT NULL,
      telephone VARCHAR(30) NULL,
      adresse TEXT NULL,
      notes TEXT NULL,
      actif TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch {
  }
  for (const [col, def] of [
    ["telephone", "VARCHAR(30) NULL"],
    ["adresse", "TEXT NULL"],
    ["notes", "TEXT NULL"],
    ["actif", "TINYINT(1) NOT NULL DEFAULT 1"]
  ]) {
    try {
      await db.execute(`ALTER TABLE entrepots ADD COLUMN ${col} ${def}`);
    } catch {
    }
  }
  if (!names.has("entrepot_id")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`);
      names.add("entrepot_id");
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("entrepot_id");
      }
    }
  }
  if (!names.has("prix_entrepot")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`);
      names.add("prix_entrepot");
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("prix_entrepot");
      }
    }
  }
  if (!names.has("stock_magasin")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN stock_magasin INT NOT NULL DEFAULT 0`);
      names.add("stock_magasin");
      try {
        const [psRows] = await db.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produit_stocks'`
        );
        const psCols = new Set(psRows.map((r) => r.COLUMN_NAME.toLowerCase()));
        const sc = psCols.has("stock") ? "stock" : psCols.has("quantite") ? "quantite" : null;
        if (sc) {
          await db.execute(
            `UPDATE produits p
             JOIN (SELECT produit_id, COALESCE(SUM(\`${sc}\`), 0) AS total
                   FROM produit_stocks GROUP BY produit_id) ps
               ON ps.produit_id = p.id
             SET p.stock_magasin = ps.total`
          );
        }
      } catch {
      }
    } catch {
    }
  }
  if (!names.has("shop_id")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN shop_id INT UNSIGNED NOT NULL DEFAULT 1`);
      names.add("shop_id");
      try {
        await db.execute(`ALTER TABLE produits ADD INDEX idx_produits_shop_id (shop_id)`);
      } catch {
      }
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("shop_id");
      }
    }
  }
  if (names.has("slug") && names.has("shop_id")) {
    try {
      await db.execute(`ALTER TABLE produits DROP INDEX idx_produits_slug`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_shop_slug (shop_id, slug)`);
    } catch {
    }
  }
  _cols = {
    remise: names.has("remise"),
    neuf: names.has("neuf"),
    stock_boutique: names.has("stock_boutique"),
    stock_magasin: names.has("stock_magasin"),
    stock_minimum: names.has("stock_minimum"),
    variations_json: names.has("variations_json"),
    images_json: names.has("images_json"),
    image: names.has("image"),
    image_url: names.has("image_url"),
    date_creation: names.has("date_creation"),
    created_at: names.has("created_at"),
    marque_id: names.has("marque_id"),
    slug: names.has("slug"),
    entrepot_id: names.has("entrepot_id"),
    prix_entrepot: names.has("prix_entrepot"),
    shop_id: names.has("shop_id")
  };
  return _cols;
}
function invalidateProduitColsCache() {
  _cols = null;
}
async function checkReviewsTable() {
  if (_hasReviews !== null) return _hasReviews;
  try {
    const [rows] = await db.execute(
      "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' LIMIT 1"
    );
    _hasReviews = rows.length > 0;
    if (_hasReviews) await _ensureReviewsRatingCol();
  } catch {
    _hasReviews = false;
  }
  return _hasReviews;
}
async function _ensureReviewsRatingCol() {
  try {
    const [rows] = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
       AND COLUMN_NAME IN ('note', 'rating')`
    );
    const cols = new Set(rows.map((r) => r.COLUMN_NAME));
    if (cols.has("note") && !cols.has("rating")) {
      await db.execute("ALTER TABLE reviews CHANGE COLUMN note rating TINYINT NOT NULL DEFAULT 5");
    } else if (!cols.has("note") && !cols.has("rating")) {
      await db.execute("ALTER TABLE reviews ADD COLUMN rating TINYINT NOT NULL DEFAULT 5");
    }
  } catch {
  }
}
async function getProducts(opts) {
  const {
    categoryId,
    marqueId,
    search,
    referenceExact,
    promoOnly,
    newOnly,
    inStock,
    minPrice,
    maxPrice,
    limit = 60,
    offset = 0,
    statut,
    includeInactive = false,
    entrepotId,
    shopId = 1
  } = opts ?? {};
  const cols = await produitCols();
  const conditions = includeInactive ? [] : ["p.actif = 1"];
  const params = [];
  if (cols.shop_id) {
    conditions.push("p.shop_id = ?");
    params.push(shopId);
  }
  if (categoryId) {
    conditions.push("p.categorie_id = ?");
    params.push(categoryId);
  }
  if (marqueId) {
    conditions.push("p.marque_id = ?");
    params.push(marqueId);
  }
  if (referenceExact) {
    conditions.push("p.reference = ?");
    params.push(referenceExact);
  }
  if (search) {
    conditions.push("(p.nom LIKE ? OR p.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (promoOnly && cols.remise) {
    conditions.push("p.remise > 0");
  }
  if (newOnly && cols.neuf) {
    conditions.push("p.neuf = 1");
  }
  if (statut === "disponible") {
    conditions.push("COALESCE(p.stock_boutique, 0) > 5");
  }
  if (statut === "faible") {
    conditions.push("COALESCE(p.stock_boutique, 0) > 0 AND COALESCE(p.stock_boutique, 0) <= 5");
  }
  if (statut === "epuise") {
    conditions.push("COALESCE(p.stock_boutique, 0) = 0");
  }
  if (inStock) {
    conditions.push("COALESCE(p.stock_boutique, 0) > 0");
  }
  if (minPrice != null && !isNaN(minPrice)) {
    conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) >= ?");
    params.push(minPrice);
  }
  if (maxPrice != null && !isNaN(maxPrice)) {
    conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) <= ?");
    params.push(maxPrice);
  }
  if (entrepotId != null) {
    conditions.push("p.entrepot_id = ?");
    params.push(entrepotId);
  }
  const where = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique && cols.entrepot_id ? "CASE WHEN p.entrepot_id IS NOT NULL THEN 999 ELSE CAST(p.stock_boutique AS SIGNED) END" : cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
  const safeLimit = Math.max(1, Math.min(200, Number(limit)));
  const safeOffset = Math.max(0, Number(offset));
  const [rows] = await db.query(
    `SELECT
       p.id, p.reference, ${cols.slug ? "p.slug" : "NULL"} AS slug, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                          AS prix_unitaire,
       ${stockBoutiqueCol}                                                       AS stock_boutique,
       ${stockMagasinCol}                                                        AS stock_magasin,
       ${cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
       ${cols.neuf ? "COALESCE(p.neuf, 1)" : "1"} AS neuf,
       ${imageCol}                                                                          AS image_url,
       ${cols.variations_json ? "p.variations_json" : "NULL"} AS variations_json,
       ${cols.images_json ? "p.images_json" : "NULL"} AS images_json,
       ${cols.marque_id ? "p.marque_id" : "NULL"} AS marque_id,
       ${cols.marque_id ? "m.nom" : "NULL"} AS marque_nom,
       ${cols.entrepot_id ? "p.entrepot_id" : "NULL"} AS entrepot_id,
       ${cols.prix_entrepot ? "p.prix_entrepot" : "NULL"} AS prix_entrepot,
       ${cols.entrepot_id ? "e.nom" : "NULL"} AS entrepot_nom,
       ${cols.entrepot_id ? "e.telephone" : "NULL"} AS entrepot_telephone,
       ${orderCol}                                                                          AS sort_col,
       c.nom AS categorie_nom,
       p.actif
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     ${cols.entrepot_id ? "LEFT JOIN entrepots e ON p.entrepot_id = e.id" : ""}
     WHERE ${where}
     ORDER BY ${orderCol} DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  return rows.map((r) => ({
    id: Number(r.id),
    reference: r.reference,
    slug: r.slug ?? null,
    nom: r.nom,
    description: r.description ?? null,
    categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom: r.categorie_nom ?? null,
    prix_unitaire: Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin: Number(r.stock_magasin ?? 0),
    remise: Number(r.remise),
    neuf: Boolean(r.neuf),
    image_url: r.image_url ?? null,
    images: r.images_json ? tryParse(r.images_json) : [],
    variations: r.variations_json ? tryParse(r.variations_json) : null,
    date_creation: r.sort_col ?? "",
    marque_id: r.marque_id ? Number(r.marque_id) : null,
    marque_nom: r.marque_nom ?? null,
    avg_rating: null,
    review_count: null,
    entrepot_id: r.entrepot_id ? Number(r.entrepot_id) : null,
    prix_entrepot: r.prix_entrepot != null ? Number(r.prix_entrepot) : null,
    entrepot_nom: r.entrepot_nom ?? null,
    entrepot_telephone: r.entrepot_telephone ?? null
  }));
}
async function getProductsByIds(ids) {
  if (ids.length === 0) return [];
  const cols = await produitCols();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique && cols.entrepot_id ? "CASE WHEN p.entrepot_id IS NOT NULL THEN 999 ELSE CAST(p.stock_boutique AS SIGNED) END" : cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT
       p.id, p.reference, ${cols.slug ? "p.slug" : "NULL"} AS slug, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                          AS prix_unitaire,
       ${stockBoutiqueCol}                                                       AS stock_boutique,
       ${stockMagasinCol}                                                        AS stock_magasin,
       ${cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
       ${cols.neuf ? "COALESCE(p.neuf, 1)" : "1"} AS neuf,
       ${imageCol}                                                                          AS image_url,
       ${cols.variations_json ? "p.variations_json" : "NULL"} AS variations_json,
       ${cols.images_json ? "p.images_json" : "NULL"} AS images_json,
       ${cols.marque_id ? "p.marque_id" : "NULL"} AS marque_id,
       ${cols.marque_id ? "m.nom" : "NULL"} AS marque_nom,
       ${orderCol}                                                                          AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     WHERE p.id IN (${placeholders}) AND p.actif = 1`,
    ids
  );
  return rows.map((r) => ({
    id: Number(r.id),
    reference: r.reference,
    slug: r.slug ?? null,
    nom: r.nom,
    description: r.description ?? null,
    categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom: r.categorie_nom ?? null,
    prix_unitaire: Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin: Number(r.stock_magasin ?? 0),
    remise: Number(r.remise),
    neuf: Boolean(r.neuf),
    image_url: r.image_url ?? null,
    images: r.images_json ? tryParse(r.images_json) : [],
    variations: r.variations_json ? tryParse(r.variations_json) : null,
    date_creation: r.sort_col ?? "",
    marque_id: r.marque_id ? Number(r.marque_id) : null,
    marque_nom: r.marque_nom ?? null
  }));
}
async function getProductBySlug(slugOrRef, shopId = 1) {
  const cols = await produitCols();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique && cols.entrepot_id ? "CASE WHEN p.entrepot_id IS NOT NULL THEN 999 ELSE CAST(p.stock_boutique AS SIGNED) END" : cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
  const selectSql = `SELECT
       p.id, p.reference, ${cols.slug ? "p.slug" : "NULL"} AS slug, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                        AS prix_unitaire,
       ${stockBoutiqueCol}                                                     AS stock_boutique,
       ${stockMagasinCol}                                                      AS stock_magasin,
       ${cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)),0)" : "0"} AS remise,
       ${cols.neuf ? "COALESCE(p.neuf,1)" : "1"} AS neuf,
       ${imageCol}                                                                      AS image_url,
       ${cols.variations_json ? "p.variations_json" : "NULL"} AS variations_json,
       ${cols.images_json ? "p.images_json" : "NULL"} AS images_json,
       ${cols.marque_id ? "p.marque_id" : "NULL"} AS marque_id,
       ${cols.marque_id ? "m.nom" : "NULL"} AS marque_nom,
       ${orderCol}                                                                      AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}`;
  const shopCondition = cols.shop_id ? " AND p.shop_id = ?" : "";
  const shopParams = cols.shop_id ? [shopId] : [];
  let rows = [];
  if (cols.slug) {
    const [r1] = await db.execute(
      `${selectSql} WHERE p.slug = ? AND p.actif = 1${shopCondition} LIMIT 1`,
      [slugOrRef, ...shopParams]
    );
    rows = r1;
  }
  if (!rows.length) {
    const [r2] = await db.execute(
      `${selectSql} WHERE p.reference = ? AND p.actif = 1${shopCondition} LIMIT 1`,
      [slugOrRef, ...shopParams]
    );
    rows = r2;
  }
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: Number(r.id),
    reference: r.reference,
    slug: r.slug ?? null,
    nom: r.nom,
    description: r.description ?? null,
    categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom: r.categorie_nom ?? null,
    prix_unitaire: Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin: Number(r.stock_magasin ?? 0),
    remise: Number(r.remise),
    neuf: Boolean(r.neuf),
    image_url: r.image_url ?? null,
    images: r.images_json ? tryParse(r.images_json) : [],
    variations: r.variations_json ? tryParse(r.variations_json) : null,
    date_creation: r.sort_col ?? "",
    marque_id: r.marque_id ? Number(r.marque_id) : null,
    marque_nom: r.marque_nom ?? null
  };
}
async function getProductCount(opts) {
  const { categoryId, marqueId, search, promoOnly, newOnly, inStock, minPrice, maxPrice, statut, includeInactive = false, entrepotId, shopId = 1 } = opts ?? {};
  const cols = await produitCols();
  const conditions = includeInactive ? [] : ["p.actif = 1"];
  const params = [];
  if (cols.shop_id) {
    conditions.push("p.shop_id = ?");
    params.push(shopId);
  }
  if (categoryId) {
    conditions.push("p.categorie_id = ?");
    params.push(categoryId);
  }
  if (marqueId) {
    conditions.push("p.marque_id = ?");
    params.push(marqueId);
  }
  if (search) {
    conditions.push("(p.nom LIKE ? OR p.description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (promoOnly && cols.remise) {
    conditions.push("p.remise > 0");
  }
  if (newOnly && cols.neuf) {
    conditions.push("p.neuf = 1");
  }
  if (inStock) {
    conditions.push("COALESCE(p.stock_boutique, 0) > 0");
  }
  if (statut === "disponible") {
    conditions.push("COALESCE(p.stock_boutique, 0) > 5");
  }
  if (statut === "faible") {
    conditions.push("COALESCE(p.stock_boutique, 0) > 0 AND COALESCE(p.stock_boutique, 0) <= 5");
  }
  if (statut === "epuise") {
    conditions.push("COALESCE(p.stock_boutique, 0) = 0");
  }
  if (minPrice != null && !isNaN(minPrice)) {
    conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) >= ?");
    params.push(minPrice);
  }
  if (maxPrice != null && !isNaN(maxPrice)) {
    conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) <= ?");
    params.push(maxPrice);
  }
  if (entrepotId != null) {
    conditions.push("p.entrepot_id = ?");
    params.push(entrepotId);
  }
  const [rows] = await db.execute(
    `SELECT COUNT(*) as cnt FROM produits p WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}`,
    params
  );
  return Number(rows[0]?.cnt ?? 0);
}
async function getProductStatusCounts() {
  const [rows] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(COALESCE(stock_boutique, 0) > 5)             AS disponible,
       SUM(COALESCE(stock_boutique, 0) BETWEEN 1 AND 5) AS faible,
       SUM(COALESCE(stock_boutique, 0) = 0)             AS epuise
     FROM produits`
  );
  const r = rows[0];
  return {
    total: Number(r?.total ?? 0),
    disponible: Number(r?.disponible ?? 0),
    faible: Number(r?.faible ?? 0),
    epuise: Number(r?.epuise ?? 0)
  };
}
async function getCategories(shopId = 1) {
  const [rows] = await db.execute(
    `SELECT c.id, c.nom, c.description, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     WHERE c.shop_id = ?
     GROUP BY c.id, c.nom, c.description
     ORDER BY product_count DESC`,
    [shopId]
  );
  return rows;
}
function tryParse(json) {
  if (Array.isArray(json) || typeof json === "object" && json !== null) return json;
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
async function getProductVariants(productId) {
  try {
    const [tableCheck] = await db.execute(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'`
    );
    if (!Number(tableCheck[0]?.cnt)) return [];
    const [rows] = await db.execute(
      "SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC",
      [productId]
    );
    return rows.map((r) => ({
      id: Number(r.id),
      produit_id: Number(r.produit_id),
      nom: r.nom,
      options: typeof r.options === "string" ? JSON.parse(r.options) : r.options ?? {},
      prix: Number(r.prix),
      remise: Number(r.remise ?? 0),
      stock: Number(r.stock),
      stock_boutique: Number(r.stock_boutique ?? 0),
      reference_sku: r.reference_sku ?? null,
      image_url: r.image_url ?? null
    }));
  } catch {
    return [];
  }
}
var import_promise, db, _cols, _hasReviews;
var init_db = __esm({
  "../lib/db.ts"() {
    "use strict";
    import_promise = __toESM(require("mysql2/promise"));
    init_utils();
    db = getOrCreatePool();
    _cols = null;
    _hasReviews = null;
  }
});

// ../lib/admin-db.ts
var admin_db_exports = {};
__export(admin_db_exports, {
  accepterLivraison: () => accepterLivraison,
  addFidelitePoints: () => addFidelitePoints,
  addLoyaltyPointsManual: () => addLoyaltyPointsManual,
  addOrderEvent: () => addOrderEvent,
  applyOrderDeliveredEffects: () => applyOrderDeliveredEffects,
  applyOrderPaidEffects: () => applyOrderPaidEffects,
  approveReview: () => approveReview,
  cancelPaymentPlan: () => cancelPaymentPlan,
  countAchats: () => countAchats,
  countBoutiqueClients: () => countBoutiqueClients,
  countClients: () => countClients,
  countOrders: () => countOrders,
  createAchat: () => createAchat,
  createAdminUser: () => createAdminUser,
  createBoutiqueClient: () => createBoutiqueClient,
  createBoutiqueMouvement: () => createBoutiqueMouvement,
  createCategory: () => createCategory,
  createDevis: () => createDevis,
  createFacture: () => createFacture,
  createFinanceEntry: () => createFinanceEntry,
  createFournisseur: () => createFournisseur,
  createLivreur: () => createLivreur,
  createLivreurInscription: () => createLivreurInscription,
  createManualLivraison: () => createManualLivraison,
  createMarque: () => createMarque,
  createOrder: () => createOrder,
  createPaymentPlan: () => createPaymentPlan,
  createReview: () => createReview,
  createStockAjustement: () => createStockAjustement,
  createStockEntree: () => createStockEntree,
  createStockSortie: () => createStockSortie,
  createTombolaSession: () => createTombolaSession,
  createUtilisateur: () => createUtilisateur,
  createVenteWithStock: () => createVenteWithStock,
  deleteAchat: () => deleteAchat,
  deleteAdminUser: () => deleteAdminUser,
  deleteBoutiqueClient: () => deleteBoutiqueClient,
  deleteCategory: () => deleteCategory,
  deleteClient: () => deleteClient,
  deleteCoupon: () => deleteCoupon,
  deleteDeliveryZone: () => deleteDeliveryZone,
  deleteDevis: () => deleteDevis,
  deleteEntrepot: () => deleteEntrepot,
  deleteFacture: () => deleteFacture,
  deleteFinanceEntry: () => deleteFinanceEntry,
  deleteFournisseur: () => deleteFournisseur,
  deleteLivraison: () => deleteLivraison,
  deleteLivreur: () => deleteLivreur,
  deleteMarque: () => deleteMarque,
  deleteNewsletterSubscriber: () => deleteNewsletterSubscriber,
  deleteOrder: () => deleteOrder,
  deleteReview: () => deleteReview,
  deleteTombolaSession: () => deleteTombolaSession,
  deleteUtilisateur: () => deleteUtilisateur,
  ensureAdminUsersCols: () => ensureAdminUsersCols,
  ensureEntrepotsTable: () => ensureEntrepotsTable,
  ensureIndexes: () => ensureIndexes,
  ensureLivraisonCols: () => ensureLivraisonCols,
  ensureLivreurInscriptionsTable: () => ensureLivreurInscriptionsTable,
  ensureOrderLivreurCols: () => ensureOrderLivreurCols,
  ensureOrderVente: () => ensureOrderVente,
  ensureShopIdCols: () => ensureShopIdCols,
  ensureTokenVersionCols: () => ensureTokenVersionCols,
  ensureTombolaTable: () => ensureTombolaTable,
  ensureUtilisateursCols: () => ensureUtilisateursCols,
  fixSiteOrderFinanceEntries: () => fixSiteOrderFinanceEntries,
  getAchatById: () => getAchatById,
  getAchatStats: () => getAchatStats,
  getAdminByEmail: () => getAdminByEmail,
  getAdminByEmailGlobal: () => getAdminByEmailGlobal,
  getAdminById: () => getAdminById,
  getAdminByUsername: () => getAdminByUsername,
  getAdminByUsernameGlobal: () => getAdminByUsernameGlobal,
  getBoutiqueClientById: () => getBoutiqueClientById,
  getBoutiqueClientsStats: () => getBoutiqueClientsStats,
  getCRMStats: () => getCRMStats,
  getClientById: () => getClientById,
  getClientByPhone: () => getClientByPhone,
  getClientFacturesByNom: () => getClientFacturesByNom,
  getClientOrders: () => getClientOrders,
  getClientStats: () => getClientStats,
  getDashboardStats: () => getDashboardStats,
  getDeliveryZones: () => getDeliveryZones,
  getFactureById: () => getFactureById,
  getFacturePaiements: () => getFacturePaiements,
  getFinanceStats: () => getFinanceStats,
  getLivraisonsForLivreur: () => getLivraisonsForLivreur,
  getLivraisonsStats: () => getLivraisonsStats,
  getLivreurByCode: () => getLivreurByCode,
  getLivreurInscriptionById: () => getLivreurInscriptionById,
  getLoyaltyHistory: () => getLoyaltyHistory,
  getLoyaltyStats: () => getLoyaltyStats,
  getOrderById: () => getOrderById,
  getOrderEvents: () => getOrderEvents,
  getOrdersStats: () => getOrdersStats,
  getPaymentPlanByOrderId: () => getPaymentPlanByOrderId,
  getProductEntrepotsForRefs: () => getProductEntrepotsForRefs,
  getProduitsWithStock: () => getProduitsWithStock,
  getRecentBoutiqueMovements: () => getRecentBoutiqueMovements,
  getSetting: () => getSetting,
  getSettings: () => getSettings,
  getStockBoutiqueList: () => getStockBoutiqueList,
  getStockBoutiqueStats: () => getStockBoutiqueStats,
  getStockMovementCounts: () => getStockMovementCounts,
  getStockMovements: () => getStockMovements,
  getStockStats: () => getStockStats,
  getTokenVersion: () => getTokenVersion,
  getTombolaParticipants: () => getTombolaParticipants,
  getTombolaSession: () => getTombolaSession,
  getUtilisateurById: () => getUtilisateurById,
  getUtilisateurByUsername: () => getUtilisateurByUsername,
  getUtilisateurPermissions: () => getUtilisateurPermissions,
  getVentesStats: () => getVentesStats,
  incrementTokenVersion: () => incrementTokenVersion,
  invalidateVentesStats: () => invalidateVentesStats,
  listAchats: () => listAchats,
  listAdminCategories: () => listAdminCategories,
  listAdminMarques: () => listAdminMarques,
  listAdminUsers: () => listAdminUsers,
  listAllUtilisateurModules: () => listAllUtilisateurModules,
  listBoutiqueClients: () => listBoutiqueClients,
  listClients: () => listClients,
  listCoupons: () => listCoupons,
  listDevis: () => listDevis,
  listEntrepots: () => listEntrepots,
  listFactures: () => listFactures,
  listFinanceEntries: () => listFinanceEntries,
  listFournisseurs: () => listFournisseurs,
  listLivraisons: () => listLivraisons,
  listLivraisonsAdmin: () => listLivraisonsAdmin,
  listLivreurInscriptions: () => listLivreurInscriptions,
  listLivreurs: () => listLivreurs,
  listLoyaltyClients: () => listLoyaltyClients,
  listNewsletterSubscribers: () => listNewsletterSubscribers,
  listOrders: () => listOrders,
  listPaymentPlans: () => listPaymentPlans,
  listPermissions: () => listPermissions,
  listReferrals: () => listReferrals,
  listReviews: () => listReviews,
  listSiteClients: () => listSiteClients,
  listTombolaSessions: () => listTombolaSessions,
  listUtilisateurs: () => listUtilisateurs,
  listWaMessages: () => listWaMessages,
  markMessagesRead: () => markMessagesRead,
  markTombolaNotified: () => markTombolaNotified,
  markTranchePaid: () => markTranchePaid,
  markTrancheUnpaid: () => markTrancheUnpaid,
  migrateAdminLivreursToTeam: () => migrateAdminLivreursToTeam,
  recevoirAchat: () => recevoirAchat,
  saveIncomingMessage: () => saveIncomingMessage,
  setSetting: () => setSetting,
  setSettings: () => setSettings,
  setUtilisateurPermissions: () => setUtilisateurPermissions,
  spinTombola: () => spinTombola,
  subscribeNewsletter: () => subscribeNewsletter,
  updateAchat: () => updateAchat,
  updateAchatStatut: () => updateAchatStatut,
  updateAdminLastLogin: () => updateAdminLastLogin,
  updateAdminPassword: () => updateAdminPassword,
  updateAdminUser: () => updateAdminUser,
  updateBoutiqueClient: () => updateBoutiqueClient,
  updateCategory: () => updateCategory,
  updateDevisStatut: () => updateDevisStatut,
  updateFacture: () => updateFacture,
  updateFactureStatut: () => updateFactureStatut,
  updateFinanceEntry: () => updateFinanceEntry,
  updateFournisseur: () => updateFournisseur,
  updateLivraisonAdmin: () => updateLivraisonAdmin,
  updateLivraisonStatut: () => updateLivraisonStatut,
  updateLivreur: () => updateLivreur,
  updateLivreurInscriptionStatut: () => updateLivreurInscriptionStatut,
  updateMarque: () => updateMarque,
  updateOrderFields: () => updateOrderFields,
  updateOrderStatus: () => updateOrderStatus,
  updateProductStock: () => updateProductStock,
  updateTombolaSession: () => updateTombolaSession,
  updateUtilisateur: () => updateUtilisateur,
  updateUtilisateurPassword: () => updateUtilisateurPassword,
  upsertClient: () => upsertClient,
  upsertCoupon: () => upsertCoupon,
  upsertDeliveryZone: () => upsertDeliveryZone,
  upsertEntrepot: () => upsertEntrepot
});
function runOnce(key, fn) {
  if (!_ensurePromises.has(key)) _ensurePromises.set(key, fn());
  return _ensurePromises.get(key);
}
async function getProduitsWithStock() {
  let hasVariantsTable = false;
  try {
    await db.execute("SELECT 1 FROM product_variants LIMIT 0");
    hasVariantsTable = true;
  } catch {
  }
  if (!hasVariantsTable) {
    const [rows2] = await db.query(
      `SELECT p.id AS produit_id, p.nom, p.reference,
              COALESCE(p.stock_magasin, 0) AS stock,
              0 AS variants_count, NULL AS variant_id, NULL AS variant_nom
       FROM produits p WHERE p.actif = 1 ORDER BY p.nom`
    );
    return rows2;
  }
  const [rows] = await db.query(
    `SELECT * FROM (
       SELECT p.id AS produit_id, p.nom,
              p.reference,
              COALESCE(p.stock_magasin, 0) AS stock,
              0 AS variants_count, NULL AS variant_id, NULL AS variant_nom
       FROM produits p
       WHERE p.actif = 1
         AND NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.produit_id = p.id)

       UNION ALL

       SELECT p.id AS produit_id,
              CONCAT(p.nom, ' \u2014 ', pv.nom) AS nom,
              COALESCE(NULLIF(pv.reference_sku,''), p.reference) AS reference,
              pv.stock AS stock,
              1 AS variants_count,
              pv.id AS variant_id,
              pv.nom AS variant_nom
       FROM product_variants pv
       JOIN produits p ON p.id = pv.produit_id
       WHERE p.actif = 1
     ) AS combined
     ORDER BY nom ASC`
  );
  return rows;
}
async function createStockEntree(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let stockApres;
    if (data.variant_id) {
      await conn.execute(
        `UPDATE product_variants SET stock = stock + ? WHERE id = ? AND produit_id = ?`,
        [data.quantite, data.variant_id, data.produit_id]
      );
      const [[vRow]] = await conn.execute(
        `SELECT stock FROM product_variants WHERE id = ?`,
        [data.variant_id]
      );
      stockApres = Number(vRow?.stock ?? 0);
    } else {
      await conn.execute(
        `UPDATE produits SET stock_magasin = COALESCE(stock_magasin, 0) + ? WHERE id = ?`,
        [data.quantite, data.produit_id]
      );
      const [[stockRow]] = await conn.execute(
        `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
        [data.produit_id]
      );
      stockApres = Number(stockRow?.stock ?? 0);
    }
    const noteWithVariant = data.variant_id && !data.note ? null : data.note ?? null;
    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'entree', ?, ?, ?, ?, ?)`,
      [data.produit_id, data.quantite, stockApres, data.reference ?? null, noteWithVariant, data.user_id ?? null]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function createStockSortie(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let stockApres;
    if (data.variant_id) {
      const [[vRow]] = await conn.execute(
        `SELECT stock FROM product_variants WHERE id = ? AND produit_id = ?`,
        [data.variant_id, data.produit_id]
      );
      const available = Number(vRow?.stock ?? 0);
      if (available < data.quantite) {
        throw new Error(`Stock insuffisant : ${available} disponible(s), ${data.quantite} demand\xE9(s)`);
      }
      await conn.execute(
        `UPDATE product_variants
         SET stock = stock - ?, stock_boutique = stock_boutique + ?
         WHERE id = ?`,
        [data.quantite, data.quantite, data.variant_id]
      );
      stockApres = available - data.quantite;
    } else {
      const [[row]] = await conn.execute(
        `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
        [data.produit_id]
      );
      const available = Number(row?.stock ?? 0);
      if (available < data.quantite) {
        throw new Error(`Stock insuffisant : ${available} disponible(s), ${data.quantite} demand\xE9(s)`);
      }
      await conn.execute(
        `UPDATE produits
         SET stock_magasin  = GREATEST(0, COALESCE(stock_magasin, 0) - ?),
             stock_boutique = COALESCE(stock_boutique, 0) + ?
         WHERE id = ?`,
        [data.quantite, data.quantite, data.produit_id]
      );
      stockApres = available - data.quantite;
      await conn.execute(
        `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?, 'entree', ?, 'Depuis magasin', ?, ?)`,
        [data.produit_id, data.quantite, data.reference ?? null, data.user_id ?? null]
      );
      await conn.execute(
        `INSERT INTO boutique_stock (produit_id, quantite)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite), updated_at = NOW()`,
        [data.produit_id, data.quantite]
      );
    }
    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'retrait', ?, ?, ?, ?, ?)`,
      [data.produit_id, data.quantite, stockApres, data.reference ?? null, data.note ?? null, data.user_id ?? null]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function createStockAjustement(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const abs = Math.abs(data.quantite);
    const type = data.quantite >= 0 ? "entree" : "retrait";
    let stockApres;
    if (data.variant_id) {
      await conn.execute(
        `UPDATE product_variants SET stock = GREATEST(0, stock + ?) WHERE id = ? AND produit_id = ?`,
        [data.quantite, data.variant_id, data.produit_id]
      );
      const [[vRow]] = await conn.execute(
        `SELECT stock FROM product_variants WHERE id = ?`,
        [data.variant_id]
      );
      stockApres = Number(vRow?.stock ?? 0);
    } else {
      await conn.execute(
        `UPDATE produits
         SET stock_magasin = GREATEST(0, COALESCE(stock_magasin, 0) + ?)
         WHERE id = ?`,
        [data.quantite, data.produit_id]
      );
      const [[stockRow]] = await conn.execute(
        `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
        [data.produit_id]
      );
      stockApres = Number(stockRow?.stock ?? 0);
    }
    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.produit_id, type, abs, stockApres, data.motif, data.user_id ?? null]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function getStockMovementCounts() {
  const [rows] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(type = 'entree')              AS entrees,
       SUM(type IN ('retrait','vente'))  AS sorties,
       SUM(type NOT IN ('entree','retrait','vente')) AS ajustements
     FROM stock_mouvements`
  );
  const r = rows[0];
  return {
    total: Number(r?.total ?? 0),
    entrees: Number(r?.entrees ?? 0),
    sorties: Number(r?.sorties ?? 0),
    ajustements: Number(r?.ajustements ?? 0)
  };
}
async function getStockMovements(opts = {}) {
  const { limit = 50, offset = 0, type, search } = opts;
  const conditions = [];
  const params = [];
  if (type && type !== "tous") {
    if (type === "sortie") {
      conditions.push("sm.type IN ('retrait','vente')");
    } else {
      conditions.push("sm.type = ?");
      params.push(type);
    }
  }
  if (search) {
    conditions.push("(p.nom LIKE ? OR sm.reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT sm.*, p.nom AS nom_produit
     FROM stock_mouvements sm
     LEFT JOIN produits p ON p.id = sm.produit_id
     ${where}
     ORDER BY sm.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query(
    `SELECT COUNT(*) AS cnt FROM stock_mouvements sm LEFT JOIN produits p ON p.id = sm.produit_id ${where}`,
    params
  );
  return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function ensureAdminUsersCols() {
  const [cols] = await db.execute("SHOW COLUMNS FROM admin_users");
  const names = new Set(cols.map((c) => c.Field));
  const addCol = async (sql, col) => {
    if (names.has(col)) return;
    try {
      await db.execute(sql);
      names.add(col);
    } catch (e) {
      const err = e;
      if (err?.code !== "ER_DUP_FIELDNAME" && !String(err?.message).includes("Duplicate column")) throw e;
      names.add(col);
    }
  };
  await addCol("ALTER TABLE admin_users ADD COLUMN username VARCHAR(50) NULL AFTER nom", "username");
  await addCol("ALTER TABLE admin_users ADD COLUMN telephone VARCHAR(30) NULL", "telephone");
  await addCol("ALTER TABLE admin_users ADD COLUMN poste VARCHAR(50) NULL DEFAULT 'staff'", "poste");
  await addCol("ALTER TABLE admin_users ADD COLUMN permissions TEXT NULL", "permissions");
  await addCol("ALTER TABLE admin_users ADD COLUMN must_change_password TINYINT NOT NULL DEFAULT 0", "must_change_password");
  await db.execute(
    "UPDATE admin_users SET username = CONCAT(LOWER(REPLACE(TRIM(nom), ' ', '_')), '_', id) WHERE username IS NULL OR username = ''"
  );
  const KENT_HASH = "$2b$12$1aX3rMm96gDZ8zaJBcekG.zjZ6Q.p1oUQOCEAyt4mcOAgrU28nGo2";
  try {
    const [kentRows] = await db.execute(
      "SELECT id FROM admin_users WHERE username = 'kent' LIMIT 1"
    );
    if (kentRows.length) {
      await db.execute(
        "UPDATE admin_users SET password_hash = ?, role = 'super_admin', actif = 1 WHERE username = 'kent'",
        [KENT_HASH]
      );
    } else {
      const uniqueEmail = `kent.${Date.now()}@admin.local`;
      await db.execute(
        "INSERT INTO admin_users (nom, username, email, poste, password_hash, role, actif) VALUES ('Kent','kent',?,'Administrateur',?,?,1)",
        [uniqueEmail, KENT_HASH, "super_admin"]
      );
    }
  } catch (e) {
    console.error("[ensureAdminUsersCols] kent seed failed:", e);
  }
}
async function ensureShopIdCols() {
  return runOnce("shop_id_cols", async () => {
    const tables = [
      ["admin_users"],
      ["orders"],
      ["factures"],
      ["categories"],
      ["delivery_zones"],
      ["coupons"],
      ["settings"],
      ["entrepots"],
      ["marques"],
      ["finance_entries"],
      ["devis"],
      ["livraisons_ventes"],
      ["boutique_mouvements"],
      ["boutique_clients"]
    ];
    for (const [table, extra] of tables) {
      try {
        await db.execute(
          `ALTER TABLE \`${table}\` ADD COLUMN shop_id INT UNSIGNED NOT NULL DEFAULT 1`
        );
        try {
          await db.execute(
            `ALTER TABLE \`${table}\` ADD INDEX idx_${table}_shop_id (shop_id)`
          );
        } catch {
        }
        void extra;
      } catch (e) {
        const err = e;
        const msg = String(err?.message ?? "");
        if (err?.code !== "ER_DUP_FIELDNAME" && !msg.includes("Duplicate column") && err?.code !== "ER_NO_SUCH_TABLE") {
          console.warn(`[ensureShopIdCols] ${table}:`, err?.code ?? msg);
        }
      }
    }
    try {
      await db.execute("ALTER TABLE settings DROP INDEX `key`");
    } catch {
    }
    try {
      await db.execute("ALTER TABLE settings ADD UNIQUE KEY `key_shop` (`key`, shop_id)");
    } catch {
    }
  });
}
async function getAdminByEmail(email, shopId = 1) {
  const [rows] = await db.execute(
    "SELECT * FROM admin_users WHERE email = ? AND shop_id = ? AND actif = 1 LIMIT 1",
    [email, shopId]
  );
  return rows[0] ?? null;
}
async function getAdminByUsername(username, shopId = 1) {
  const [rows] = await db.execute(
    "SELECT * FROM admin_users WHERE username = ? AND shop_id = ? AND actif = 1 LIMIT 1",
    [username, shopId]
  );
  return rows[0] ?? null;
}
async function getAdminByUsernameGlobal(username) {
  const [rows] = await db.execute(
    "SELECT * FROM admin_users WHERE username = ? AND actif = 1 ORDER BY id ASC LIMIT 1",
    [username]
  );
  return rows[0] ?? null;
}
async function getAdminByEmailGlobal(email) {
  const [rows] = await db.execute(
    "SELECT * FROM admin_users WHERE email = ? AND actif = 1 ORDER BY id ASC LIMIT 1",
    [email]
  );
  return rows[0] ?? null;
}
async function getAdminById(id) {
  const [rows] = await db.execute(
    "SELECT * FROM admin_users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
async function listAdminUsers(shopId = 1) {
  const [rows] = await db.execute(
    "SELECT id, nom, username, email, telephone, poste, role, actif, permissions, created_at, last_login FROM admin_users WHERE shop_id = ? ORDER BY id ASC",
    [shopId]
  );
  return rows;
}
async function createAdminUser(data) {
  await db.execute(
    "INSERT INTO admin_users (nom, username, email, telephone, poste, password_hash, role, must_change_password, shop_id) VALUES (?,?,?,?,?,?,?,?,?)",
    [data.nom, data.username, data.email ?? null, data.telephone ?? null, data.poste ?? "staff", data.password_hash, data.role, data.must_change_password ? 1 : 0, data.shop_id ?? 1]
  );
}
async function updateAdminLastLogin(id) {
  await db.execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [id]);
}
async function updateAdminPassword(id, hash, clearFlag = false) {
  const extra = clearFlag ? ", must_change_password = 0" : "";
  await db.execute(`UPDATE admin_users SET password_hash = ?${extra} WHERE id = ?`, [hash, id]);
}
async function updateUtilisateurPassword(id, hash) {
  await db.execute(
    "UPDATE utilisateurs SET mot_de_passe = ?, must_change_password = 0 WHERE id = ?",
    [hash, id]
  );
}
async function updateAdminUser(id, data) {
  const sets = [];
  const vals = [];
  if (data.nom !== void 0) {
    sets.push("nom = ?");
    vals.push(data.nom);
  }
  if (data.username !== void 0) {
    sets.push("username = ?");
    vals.push(data.username);
  }
  if (data.email !== void 0) {
    sets.push("email = ?");
    vals.push(data.email);
  }
  if (data.telephone !== void 0) {
    sets.push("telephone = ?");
    vals.push(data.telephone);
  }
  if (data.poste !== void 0) {
    sets.push("poste = ?");
    vals.push(data.poste);
  }
  if (data.role !== void 0) {
    sets.push("role = ?");
    vals.push(data.role);
  }
  if (data.actif !== void 0) {
    sets.push("actif = ?");
    vals.push(data.actif ? 1 : 0);
  }
  if (data.permissions !== void 0) {
    sets.push("permissions = ?");
    vals.push(data.permissions);
  }
  if (!sets.length) return;
  vals.push(id);
  await db.execute(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, vals);
}
async function deleteAdminUser(id) {
  await db.execute("DELETE FROM admin_users WHERE id = ?", [id]);
}
async function ensureUtilisateursCols() {
  try {
    await db.execute("ALTER TABLE utilisateurs ADD COLUMN username VARCHAR(50) NULL AFTER nom");
  } catch {
  }
  try {
    await db.execute("ALTER TABLE utilisateurs ADD COLUMN permissions TEXT NULL");
  } catch {
  }
  try {
    await db.execute("ALTER TABLE utilisateurs ADD COLUMN must_change_password TINYINT NOT NULL DEFAULT 0");
  } catch {
  }
  try {
    await db.execute("ALTER TABLE utilisateurs ADD COLUMN numero_plaque VARCHAR(30) NULL");
  } catch {
  }
}
async function ensureOrderLivreurCols() {
  const cols = [
    "ALTER TABLE orders ADD COLUMN livreur_id INT NULL",
    "ALTER TABLE orders ADD COLUMN livraison_note TEXT NULL",
    "ALTER TABLE orders ADD COLUMN livraison_statut VARCHAR(20) NULL",
    "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of cols) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
}
async function migrateAdminLivreursToTeam() {
  const [livreurs] = await db.execute(
    "SELECT id, nom, username, email, telephone, password_hash FROM admin_users WHERE poste = 'Livreur' AND actif = 1"
  );
  for (const l of livreurs) {
    const [existing] = await db.execute(
      "SELECT id FROM utilisateurs WHERE username = ? LIMIT 1",
      [l.username]
    );
    if (existing.length === 0) {
      await db.execute(
        "INSERT INTO utilisateurs (nom, username, email, telephone, poste, mot_de_passe, actif) VALUES (?,?,?,?,?,?,1)",
        [l.nom, l.username, l.email ?? null, l.telephone ?? null, "Livreur", l.password_hash]
      );
    }
    await db.execute("UPDATE admin_users SET actif = 0 WHERE id = ?", [l.id]);
  }
}
async function listUtilisateurs() {
  await ensureUtilisateursCols();
  const [rows] = await db.execute(
    "SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions FROM utilisateurs WHERE actif = 1 ORDER BY date_creation DESC"
  );
  return rows;
}
async function getUtilisateurById(id) {
  const [rows] = await db.execute(
    "SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions FROM utilisateurs WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
async function getUtilisateurByUsername(username) {
  const [rows] = await db.execute(
    "SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions, mot_de_passe, must_change_password FROM utilisateurs WHERE username = ? AND actif = 1 LIMIT 1",
    [username]
  );
  return rows[0] ?? null;
}
async function createUtilisateur(data) {
  await ensureUtilisateursCols();
  const [res] = await db.execute(
    "INSERT INTO utilisateurs (nom, username, email, telephone, numero_plaque, poste, mot_de_passe, must_change_password) VALUES (?,?,?,?,?,?,?,?)",
    [data.nom, data.username ?? null, data.email ?? null, data.telephone ?? null, data.numero_plaque ?? null, data.poste, data.motDePasse, data.mustChangePassword ? 1 : 0]
  );
  return res.insertId;
}
async function updateUtilisateur(id, data) {
  const fields = [];
  const values = [];
  if (data.nom !== void 0) {
    fields.push("nom = ?");
    values.push(data.nom);
  }
  if (data.username !== void 0) {
    fields.push("username = ?");
    values.push(data.username ?? null);
  }
  if (data.email !== void 0) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.telephone !== void 0) {
    fields.push("telephone = ?");
    values.push(data.telephone);
  }
  if (data.numero_plaque !== void 0) {
    fields.push("numero_plaque = ?");
    values.push(data.numero_plaque ?? null);
  }
  if (data.poste !== void 0) {
    fields.push("poste = ?");
    values.push(data.poste);
  }
  if (data.permissions !== void 0) {
    fields.push("permissions = ?");
    values.push(data.permissions ?? null);
  }
  if (data.actif !== void 0) {
    fields.push("actif = ?");
    values.push(data.actif);
  }
  if (data.motDePasse !== void 0) {
    fields.push("mot_de_passe = ?");
    values.push(data.motDePasse);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?`, values);
}
async function deleteUtilisateur(id) {
  await db.execute("UPDATE utilisateurs SET actif = 0 WHERE id = ?", [id]);
}
async function listPermissions() {
  const [rows] = await db.execute(
    "SELECT id, nom, description, module FROM permissions ORDER BY module, id ASC"
  );
  return rows;
}
async function listAllUtilisateurModules() {
  const [rows] = await db.execute(
    "SELECT id, permissions FROM utilisateurs WHERE actif = 1 AND permissions IS NOT NULL"
  );
  const map = {};
  for (const r of rows) {
    try {
      const perms = JSON.parse(r.permissions);
      map[Number(r.id)] = Object.keys(perms);
    } catch {
    }
  }
  return map;
}
async function getUtilisateurPermissions(utilisateurId) {
  const [rows] = await db.execute(
    "SELECT permission_id FROM utilisateur_permissions WHERE utilisateur_id = ?",
    [utilisateurId]
  );
  return rows.map((r) => Number(r.permission_id));
}
async function setUtilisateurPermissions(utilisateurId, permissionIds) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?", [utilisateurId]);
    if (permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => "(?,?)").join(",");
      const values = permissionIds.flatMap((pid) => [utilisateurId, pid]);
      await conn.execute(
        `INSERT IGNORE INTO utilisateur_permissions (utilisateur_id, permission_id) VALUES ${placeholders}`,
        values
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
function invalidateSettingsCache(shopId) {
  if (shopId !== void 0) _settingsCacheMap.delete(shopId);
  else _settingsCacheMap.clear();
}
async function loadSettings(shopId = 1) {
  const now = Date.now();
  const cached = _settingsCacheMap.get(shopId);
  if (cached && cached.expiresAt > now) return cached.data;
  const [rows] = await db.execute(
    "SELECT `key`, `value` FROM settings WHERE shop_id = ?",
    [shopId]
  );
  const data = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  _settingsCacheMap.set(shopId, { data, expiresAt: now + 5 * 6e4 });
  return data;
}
async function getSettings(shopId = 1) {
  return loadSettings(shopId);
}
async function getSetting(key, shopId = 1) {
  const all = await loadSettings(shopId);
  if (key in all) return all[key] ?? "";
  const [rows] = await db.execute(
    "SELECT `value` FROM settings WHERE `key` = ? AND shop_id = ?",
    [key, shopId]
  );
  return rows[0]?.value ?? "";
}
async function setSetting(key, value, shopId = 1) {
  await db.execute(
    "INSERT INTO settings (`key`, `value`, shop_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, value, shopId]
  );
  invalidateSettingsCache(shopId);
}
async function setSettings(entries, shopId = 1) {
  const pairs = Object.entries(entries);
  if (!pairs.length) return;
  const placeholders = pairs.map(() => "(?,?,?)").join(",");
  const values = pairs.flatMap(([k, v]) => [k, v, shopId]);
  await db.execute(
    `INSERT INTO settings (\`key\`, \`value\`, shop_id) VALUES ${placeholders} ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`,
    values
  );
  invalidateSettingsCache(shopId);
}
async function getDeliveryZones(activeOnly = false, shopId = 1) {
  const conds = [`shop_id = ${Number(shopId)}`];
  if (activeOnly) conds.push("actif = 1");
  const [rows] = await db.execute(
    `SELECT * FROM delivery_zones WHERE ${conds.join(" AND ")} ORDER BY sort_order ASC, id ASC`
  );
  return rows.map((r) => ({ ...r, actif: Boolean(r.actif), prix_libre: Boolean(r.prix_libre) }));
}
async function upsertDeliveryZone(zone, shopId = 1) {
  if (zone.id) {
    await db.execute(
      "UPDATE delivery_zones SET nom=?, fee=?, actif=?, sort_order=?, prix_libre=? WHERE id=? AND shop_id=?",
      [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order, zone.prix_libre ? 1 : 0, zone.id, shopId]
    );
  } else {
    await db.execute(
      "INSERT INTO delivery_zones (nom, fee, actif, sort_order, prix_libre, shop_id) VALUES (?,?,?,?,?,?)",
      [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order, zone.prix_libre ? 1 : 0, shopId]
    );
  }
}
async function deleteDeliveryZone(id, shopId = 1) {
  await db.execute("DELETE FROM delivery_zones WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function listOrders(limit = 50, offset = 0, shopId = 1) {
  const [rows] = await db.query(
    `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee,
            items, subtotal, total, status, statut_paiement,
            livreur_id, livraison_statut, created_at, updated_at
     FROM orders WHERE shop_id = ${Number(shopId)}
     ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  );
  return rows;
}
async function countOrders(shopId = 1) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) as cnt FROM orders WHERE shop_id = ?",
    [shopId]
  );
  return Number(rows[0]?.cnt ?? 0);
}
async function ensureOrderLifecycleCols() {
  const pool2 = db;
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN stock_boutique_deducted TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN finance_entry_id INT NULL",
    "ALTER TABLE orders ADD COLUMN vente_facture_id INT NULL",
    "ALTER TABLE factures ADD COLUMN source VARCHAR(30) NULL",
    "ALTER TABLE factures ADD COLUMN order_id INT NULL"
  ]) {
    try {
      await pool2.execute(ddl);
    } catch (err) {
      const code = err.code;
      if (code !== "ER_DUP_FIELDNAME" && code !== "ER_NO_SUCH_TABLE") throw err;
    }
  }
}
async function updateOrderStatus(id, status) {
  if (status === "delivered") {
    await db.execute(
      "UPDATE orders SET status = ?, delivered_at = NOW() WHERE id = ?",
      [status, id]
    );
  } else {
    await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  }
}
async function ensureEntrepotsTable() {
  return runOnce("entrepots", async () => {
    await db.execute(`CREATE TABLE IF NOT EXISTS entrepots (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(150) NOT NULL,
      telephone VARCHAR(30) NULL,
      adresse TEXT NULL,
      notes TEXT NULL,
      actif TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`);
    } catch {
    }
  });
}
async function listEntrepots(shopId = 1) {
  await ensureEntrepotsTable();
  const [rows] = await db.execute(
    "SELECT id, nom, telephone, adresse, notes, actif FROM entrepots WHERE shop_id = ? ORDER BY nom",
    [shopId]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    nom: r.nom,
    telephone: r.telephone ?? null,
    adresse: r.adresse ?? null,
    notes: r.notes ?? null,
    actif: Boolean(r.actif)
  }));
}
async function upsertEntrepot(data, shopId = 1) {
  await ensureEntrepotsTable();
  if (data.id) {
    await db.execute(
      `UPDATE entrepots SET nom = ?, telephone = ?, adresse = ?, notes = ?, actif = ? WHERE id = ? AND shop_id = ?`,
      [data.nom, data.telephone ?? null, data.adresse ?? null, data.notes ?? null, data.actif !== false ? 1 : 0, data.id, shopId]
    );
    return data.id;
  }
  const [result] = await db.execute(
    `INSERT INTO entrepots (nom, telephone, adresse, notes, actif, shop_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.nom, data.telephone ?? null, data.adresse ?? null, data.notes ?? null, data.actif !== false ? 1 : 0, shopId]
  );
  return result.insertId;
}
async function deleteEntrepot(id, shopId = 1) {
  await db.execute("DELETE FROM entrepots WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function getProductEntrepotsForRefs(refs) {
  if (!refs.length) return {};
  const placeholders = refs.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT p.reference, p.prix_entrepot, e.nom AS entrepot_nom, e.telephone
     FROM produits p
     JOIN entrepots e ON p.entrepot_id = e.id
     WHERE p.reference IN (${placeholders}) AND p.entrepot_id IS NOT NULL`,
    refs
  );
  const map = {};
  for (const r of rows) {
    map[r.reference] = {
      entrepot_nom: r.entrepot_nom,
      telephone: r.telephone ?? null,
      prix_entrepot: r.prix_entrepot != null ? Number(r.prix_entrepot) : null
    };
  }
  return map;
}
async function updateOrderFields(id, data) {
  const sets = [];
  const params = [];
  if (data.nom !== void 0) {
    sets.push("nom = ?");
    params.push(data.nom);
  }
  if (data.telephone !== void 0) {
    sets.push("telephone = ?");
    params.push(data.telephone);
  }
  if (data.adresse !== void 0) {
    sets.push("adresse = ?");
    params.push(data.adresse);
  }
  if (data.zone_livraison !== void 0) {
    sets.push("zone_livraison = ?");
    params.push(data.zone_livraison);
  }
  if (data.note !== void 0) {
    sets.push("note = ?");
    params.push(data.note);
  }
  if (data.delivery_fee !== void 0) {
    sets.push("delivery_fee = ?");
    params.push(data.delivery_fee);
  }
  if (data.subtotal !== void 0) {
    sets.push("subtotal = ?");
    params.push(data.subtotal);
  }
  if (data.total !== void 0) {
    sets.push("total = ?");
    params.push(data.total);
  }
  if (data.items !== void 0) {
    sets.push("items = ?");
    params.push(data.items);
  }
  if (data.statut_paiement !== void 0) {
    sets.push("statut_paiement = ?");
    params.push(data.statut_paiement);
  }
  if (data.lien_localisation !== void 0) {
    sets.push("lien_localisation = ?");
    params.push(data.lien_localisation ?? null);
  }
  if (sets.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`, params);
}
async function deleteOrder(id) {
  const [[order]] = await db.execute(
    "SELECT finance_entry_id, vente_facture_id, reference FROM orders WHERE id = ? LIMIT 1",
    [id]
  );
  await db.execute("DELETE FROM order_events WHERE order_id = ?", [id]);
  await db.execute("DELETE FROM orders WHERE id = ?", [id]);
  if (order?.finance_entry_id) {
    await db.execute("DELETE FROM finance_entries WHERE id = ?", [order.finance_entry_id]).catch(() => {
    });
  }
  if (order?.reference) {
    await db.execute(
      "DELETE FROM finance_entries WHERE CONVERT(description USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ?",
      [`%${order.reference}%`]
    ).catch(() => {
    });
  }
  if (order?.vente_facture_id) {
    await db.execute("DELETE FROM factures WHERE id = ?", [order.vente_facture_id]).catch(() => {
    });
  } else {
    await db.execute("DELETE FROM factures WHERE order_id = ?", [id]).catch(() => {
    });
  }
  await db.execute("DELETE FROM livraisons_ventes WHERE order_id = ?", [id]).catch(() => {
  });
  invalidateVentesStats();
}
async function getOrderById(id) {
  const [rows] = await db.execute(
    `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee,
            note, items, subtotal, total, status, statut_paiement, payment_mode,
            livreur_id, livraison_statut, stock_boutique_deducted, finance_entry_id,
            vente_facture_id, created_at, updated_at
     FROM orders WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}
async function createOrder(data) {
  await ensureOrderLifecycleCols();
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1e3 + Math.random() * 9e3);
  const reference = `CMD-${dateStr}-${rand}`;
  const [result] = await db.execute(
    `INSERT INTO orders (reference, nom, telephone, adresse, zone_livraison, delivery_fee, note, items, subtotal, total, status, shop_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      reference,
      data.nom,
      data.telephone,
      data.adresse,
      data.zone_livraison,
      data.delivery_fee,
      data.note,
      JSON.stringify(data.items),
      data.subtotal,
      data.total,
      data.shop_id ?? 1
    ]
  );
  return result.insertId;
}
function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items !== "string") return [];
  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function orderPaymentModeToFinanceMode(mode) {
  if (mode === "moov_direct" || mode === "moov_money") return "moov_money";
  if (mode === "yas_direct" || mode === "tmoney" || mode === "mix_by_yas") return "tmoney";
  if (mode === "virement" || mode === "virement_bancaire") return "virement_bancaire";
  return "especes";
}
async function ensureOrderVente(orderId, actor) {
  await ensureOrderLifecycleCols();
  const [[order]] = await db.execute(
    "SELECT * FROM orders WHERE id = ? LIMIT 1",
    [orderId]
  );
  if (!order) return null;
  let factureId = order.vente_facture_id ? Number(order.vente_facture_id) : null;
  if (factureId && actor?.id) {
    await db.execute(
      "UPDATE factures SET admin_id = ? WHERE id = ? AND admin_id IS NULL",
      [actor.id, factureId]
    ).catch(() => {
    });
  }
  if (!factureId) {
    const items = parseOrderItems(order.items).map((item) => {
      const qty = Number(item.qty ?? item.quantite ?? 1);
      const prix = Number(item.prix_unitaire ?? item.prix ?? 0);
      return {
        produit_id: Number(item.id ?? item.produit_id ?? 0),
        nom: String(item.nom ?? "Produit"),
        reference: String(item.reference ?? ""),
        qty,
        prix,
        total: Number(item.total ?? prix * qty)
      };
    });
    if (items.length === 0) return null;
    const reference = generateVenteRef("VS");
    const [result] = await db.execute(
      `INSERT INTO factures
         (reference, client_nom, client_tel, items, sous_total, remise, total,
          avec_livraison, adresse_livraison, contact_livraison, lien_localisation,
          mode_paiement, statut_paiement, statut, note, source, order_id, admin_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        reference,
        String(order.nom ?? "").trim().toUpperCase(),
        order.telephone ?? null,
        JSON.stringify(items),
        Number(order.subtotal ?? 0),
        0,
        Number(order.total ?? 0),
        1,
        order.adresse ?? null,
        order.telephone ?? null,
        order.lien_localisation ?? null,
        orderPaymentModeToFinanceMode(order.payment_mode),
        order.statut_paiement === "paye" ? "paye_total" : order.statut_paiement ?? "non_paye",
        "valide",
        `Commande site ${order.reference}`,
        "site_order",
        orderId,
        actor?.id ?? null
      ]
    );
    factureId = result.insertId;
    await db.execute("UPDATE orders SET vente_facture_id = ? WHERE id = ?", [factureId, orderId]);
    if (order.nom && order.telephone) {
      const _sId = Number(order.shop_id ?? 1);
      await db.execute(
        `INSERT INTO boutique_clients (nom, telephone, type_client, shop_id)
         SELECT ?, ?, 'particulier', ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ? AND shop_id = ?)`,
        [String(order.nom).trim(), String(order.telephone).trim(), _sId, String(order.telephone).trim(), _sId]
      ).catch(() => {
      });
    }
  }
  const isDelivered = ["delivered", "livree", "livre", "livr\xE9"].includes(String(order.status ?? ""));
  if (isDelivered && !order.finance_entry_id) {
    const parsedItems = parseOrderItems(order.items);
    const refs = parsedItems.map((i) => String(i.reference ?? "")).filter(Boolean);
    let entrepotCost = 0;
    if (refs.length > 0) {
      try {
        const placeholders = refs.map(() => "?").join(",");
        const [entrepotRows] = await db.query(
          `SELECT p.reference, p.prix_entrepot FROM produits p
           WHERE p.reference IN (${placeholders}) AND p.entrepot_id IS NOT NULL AND p.prix_entrepot IS NOT NULL`,
          refs
        );
        const eMap = /* @__PURE__ */ new Map();
        for (const r of entrepotRows) {
          if (r.prix_entrepot != null) eMap.set(r.reference, Number(r.prix_entrepot));
        }
        for (const item of parsedItems) {
          const pe = eMap.get(String(item.reference ?? ""));
          if (pe != null) entrepotCost += pe * Number(item.qty ?? item.quantite ?? 1);
        }
      } catch {
      }
    }
    const montant = Math.max(0, Number(order.subtotal ?? 0) - Number(order.coupon_remise ?? 0) - entrepotCost);
    if (montant > 0) {
      const entryId = await createFinanceEntry({
        type: "vente",
        montant,
        mode_paiement: orderPaymentModeToFinanceMode(order.payment_mode) ?? "especes",
        description: `Commande site livr\xE9e \u2014 ${order.reference}${entrepotCost > 0 ? ` (marge nette, co\xFBt entrep\xF4t ${entrepotCost} FCFA d\xE9duit)` : ""}`,
        date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        admin_id: actor?.id,
        admin_nom: actor?.nom
      }).catch(() => null);
      if (entryId) {
        await db.execute("UPDATE orders SET finance_entry_id = ? WHERE id = ?", [entryId, orderId]).catch(() => {
        });
      }
    }
  }
  return factureId;
}
async function applyOrderDeliveredEffects(orderId, actor) {
  await ensureOrderLifecycleCols();
  await ensureBoutiqueStockPopulated();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT id, reference, items, stock_boutique_deducted
       FROM orders WHERE id = ? FOR UPDATE`,
      [orderId]
    );
    const order = rows[0];
    if (!order || Number(order.stock_boutique_deducted ?? 0) === 1) {
      await conn.commit();
      return;
    }
    const items = parseOrderItems(order.items);
    for (const item of items) {
      const produitId = Number(item.id ?? item.produit_id ?? 0);
      const qty = Number(item.qty ?? item.quantite ?? 1);
      if (!produitId || qty <= 0) continue;
      const [stockRows] = await conn.execute(
        "SELECT quantite FROM boutique_stock WHERE produit_id = ? LIMIT 1",
        [produitId]
      );
      const dispo = Number(stockRows[0]?.quantite ?? 0);
      if (dispo < qty) {
        throw new Error(`Stock boutique insuffisant pour "${item.nom ?? item.reference ?? produitId}" (dispo: ${dispo}, demand\xE9: ${qty})`);
      }
    }
    for (const item of items) {
      const produitId = Number(item.id ?? item.produit_id ?? 0);
      const qty = Number(item.qty ?? item.quantite ?? 1);
      if (!produitId || qty <= 0) continue;
      await conn.execute(
        "UPDATE boutique_stock SET quantite = GREATEST(0, quantite - ?), updated_at = NOW() WHERE produit_id = ?",
        [qty, produitId]
      );
      await conn.execute(
        `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?,?,?,?,?,NULL)`,
        [produitId, "sortie", qty, "Commande site livr\xE9e", order.reference]
      );
      try {
        await conn.execute(
          `UPDATE produits p
           JOIN boutique_stock bs ON bs.produit_id = p.id
           SET p.stock_boutique = bs.quantite
           WHERE p.id = ?`,
          [produitId]
        );
      } catch {
      }
    }
    await conn.execute("UPDATE orders SET stock_boutique_deducted = 1 WHERE id = ?", [orderId]);
    await conn.execute(
      "INSERT INTO order_events (order_id, status, note, created_by) VALUES (?,?,?,?)",
      [orderId, "stock_boutique", "Stock boutique d\xE9cr\xE9ment\xE9 automatiquement", actor ?? ""]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function applyOrderPaidEffects(orderId, actor) {
  await ensureOrderLifecycleCols();
  const [[order]] = await db.execute(
    `SELECT id, reference, nom, telephone, total, coupon_remise, payment_mode, finance_entry_id
     FROM orders WHERE id = ? LIMIT 1`,
    [orderId]
  );
  if (!order || order.finance_entry_id) return;
  const entryId = await createFinanceEntry({
    type: "rentree",
    mode_paiement: orderPaymentModeToFinanceMode(order.payment_mode) ?? "especes",
    categorie: "Commande site",
    description: `Commande site ${order.reference} \u2013 ${order.nom ?? order.telephone}`,
    montant: Math.max(0, Number(order.total ?? 0) - Number(order.coupon_remise ?? 0)),
    date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
  });
  await db.execute("UPDATE orders SET finance_entry_id = ? WHERE id = ?", [entryId, orderId]);
  await addOrderEvent(orderId, "finance", "Entr\xE9e caisse cr\xE9\xE9e automatiquement", actor ?? "");
}
async function addOrderEvent(order_id, status, note = "", created_by = "") {
  await db.execute(
    "INSERT INTO order_events (order_id, status, note, created_by) VALUES (?,?,?,?)",
    [order_id, status, note, created_by]
  );
}
async function getOrderEvents(order_id) {
  const [rows] = await db.execute(
    "SELECT * FROM order_events WHERE order_id = ? AND status NOT IN ('stock_boutique', 'finance') ORDER BY created_at ASC",
    [order_id]
  );
  return rows;
}
async function getDashboardStats() {
  const [ordersRow] = await db.execute(
    "SELECT COUNT(*) as cnt, COALESCE(SUM(subtotal),0) as revenue FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  );
  const [productsRow] = await db.execute(
    "SELECT COUNT(*) as cnt FROM produits WHERE actif = 1"
  );
  const [messagesRow] = await db.execute(
    "SELECT COUNT(*) as cnt FROM whatsapp_messages WHERE direction='in' AND read_at IS NULL"
  ).catch(() => [[{ cnt: 0 }]]);
  const [recentOrders] = await db.query(
    `SELECT id, reference, nom, telephone, zone_livraison, subtotal, total, status, statut_paiement, created_at
     FROM orders ORDER BY created_at DESC LIMIT 5`
  ).catch(() => [[], []]);
  return {
    orders30d: Number(ordersRow[0]?.cnt ?? 0),
    revenue30d: Number(ordersRow[0]?.revenue ?? 0),
    productsActive: Number(productsRow[0]?.cnt ?? 0),
    unreadMessages: Number(messagesRow[0]?.cnt ?? 0),
    recentOrders
  };
}
async function getOrdersStats() {
  const [
    [totalRow],
    [todayRow],
    [week7Row],
    [month30Row],
    statusRows,
    trendRows,
    recentRows
  ] = await Promise.all([
    db.execute(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(subtotal),0) as rev FROM orders"
    ),
    db.execute(
      "SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = CURDATE()"
    ),
    db.execute(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(subtotal),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    ),
    db.execute(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(subtotal),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    ),
    db.execute(
      "SELECT status, COUNT(*) as cnt FROM orders GROUP BY status"
    ),
    db.execute(
      `SELECT DATE(created_at) as date,
              COUNT(*) as count,
              COALESCE(SUM(subtotal),0) as revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ),
    db.query(
      `SELECT id, reference, nom, telephone, zone_livraison, subtotal, total, status, statut_paiement, created_at
       FROM orders ORDER BY created_at DESC LIMIT 8`
    )
  ]);
  const total = Number(totalRow[0]?.cnt ?? 0);
  const revenue = Number(totalRow[0]?.rev ?? 0);
  const byStatus = {};
  for (const r of statusRows[0]) {
    byStatus[r.status] = Number(r.cnt);
  }
  const trend7d = trendRows[0].map((r) => ({
    date: String(r.date).slice(0, 10),
    count: Number(r.count),
    revenue: Number(r.revenue)
  }));
  return {
    totalOrders: total,
    totalRevenue: revenue,
    avgOrderValue: total > 0 ? revenue / total : 0,
    ordersToday: Number(todayRow[0]?.cnt ?? 0),
    orders7d: Number(week7Row[0]?.cnt ?? 0),
    orders30d: Number(month30Row[0]?.cnt ?? 0),
    revenue30d: Number(month30Row[0]?.rev ?? 0),
    byStatus,
    trend7d,
    recentOrders: recentRows[0]
  };
}
async function listWaMessages(limit = 100, shopId = 1) {
  const modern = `SELECT id, wa_message_id, from_number, to_number, contact_name, direction, type,
                         COALESCE(content, body, '') as content, COALESCE(media_url,'') as media_url,
                         status, read_at, created_at
                  FROM whatsapp_messages WHERE shop_id = ${Number(shopId)} ORDER BY created_at DESC LIMIT ${limit}`;
  const legacy = `SELECT id, COALESCE(wa_message_id,'') as wa_message_id, from_number,
                         COALESCE(to_number,'') as to_number, COALESCE(contact_name,'') as contact_name,
                         COALESCE(direction,'in') as direction, COALESCE(type,'text') as type,
                         COALESCE(body,'') as content, '' as media_url, COALESCE(status,'received') as status,
                         read_at, created_at
                  FROM whatsapp_messages WHERE shop_id = ${Number(shopId)} ORDER BY created_at DESC LIMIT ${limit}`;
  const [rows] = await db.query(modern).catch(() => db.query(legacy)).catch(() => [[], []]);
  return rows;
}
async function markMessagesRead(ids) {
  if (!ids.length) return;
  await db.query(
    `UPDATE whatsapp_messages SET read_at = NOW() WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
}
async function saveIncomingMessage(msg) {
  await db.execute(
    `INSERT IGNORE INTO whatsapp_messages
     (wa_message_id, from_number, to_number, contact_name, direction, type, content, media_url, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      msg.wa_message_id,
      msg.from_number,
      msg.to_number,
      msg.contact_name,
      msg.direction,
      msg.type,
      msg.content,
      msg.media_url,
      msg.status
    ]
  );
}
async function listReviews(filter = false) {
  const opts = typeof filter === "boolean" ? { approvedOnly: filter } : filter;
  const conditions = [];
  const params = [];
  if (opts.approvedOnly) {
    conditions.push("r.approved = 1");
  }
  if (opts.produit_id) {
    conditions.push("r.product_id = ?");
    params.push(opts.produit_id);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.execute(
    `SELECT r.*, p.nom as product_nom FROM reviews r
     LEFT JOIN produits p ON r.product_id = p.id
     ${where} ORDER BY r.created_at DESC`,
    params
  );
  return rows.map((r) => ({ ...r, approved: Boolean(r.approved) }));
}
async function createReview(data) {
  await db.execute(
    `INSERT INTO reviews (product_id, nom, rating, comment, approved, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [data.produit_id, data.nom, data.note, data.commentaire ?? ""]
  );
}
async function approveReview(id, approved) {
  await db.execute("UPDATE reviews SET approved = ? WHERE id = ?", [approved ? 1 : 0, id]);
}
async function deleteReview(id) {
  await db.execute("DELETE FROM reviews WHERE id = ?", [id]);
}
async function ensureCouponsTable() {
  return runOnce("coupons", () => db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code       VARCHAR(50)  NOT NULL UNIQUE,
      type       ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
      valeur     DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order  DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_uses   INT UNSIGNED  NOT NULL DEFAULT 0,
      uses_count INT UNSIGNED  NOT NULL DEFAULT 0,
      expires_at DATETIME      NULL,
      actif      TINYINT(1)    NOT NULL DEFAULT 1,
      created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `).then(() => {
  }));
}
async function listCoupons(shopId = 1) {
  await ensureCouponsTable();
  const [rows] = await db.execute(
    "SELECT id, code, type, valeur, min_order, max_uses, uses_count, expires_at, actif, created_at FROM coupons WHERE shop_id = ? ORDER BY created_at DESC LIMIT 500",
    [shopId]
  );
  return rows.map((r) => ({ ...r, actif: Boolean(r.actif) }));
}
async function upsertCoupon(c, shopId = 1) {
  if (c.id) {
    await db.execute(
      "UPDATE coupons SET code=?,type=?,valeur=?,min_order=?,max_uses=?,expires_at=?,actif=? WHERE id=? AND shop_id=?",
      [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0, c.id, shopId]
    );
  } else {
    await db.execute(
      "INSERT INTO coupons (code,type,valeur,min_order,max_uses,expires_at,actif,shop_id) VALUES (?,?,?,?,?,?,?,?)",
      [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0, shopId]
    );
  }
}
async function deleteCoupon(id, shopId = 1) {
  await db.execute("DELETE FROM coupons WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function listAdminCategories(shopId = 1) {
  const [rows] = await db.execute(
    `SELECT c.id, c.nom, COALESCE(c.description,'') AS description,
            COUNT(p.id) AS nb_produits
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     WHERE c.shop_id = ?
     GROUP BY c.id
     ORDER BY c.nom ASC`,
    [shopId]
  );
  return rows.map((r) => ({ ...r, nb_produits: Number(r.nb_produits) }));
}
async function createCategory(nom, description, shopId = 1) {
  const [result] = await db.execute(
    "INSERT INTO categories (nom, description, shop_id) VALUES (?,?,?)",
    [nom, description, shopId]
  );
  return result.insertId;
}
async function updateCategory(id, nom, description, shopId = 1) {
  await db.execute(
    "UPDATE categories SET nom=?, description=? WHERE id=? AND shop_id=?",
    [nom, description, id, shopId]
  );
}
async function deleteCategory(id, shopId = 1) {
  await db.execute("DELETE FROM categories WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function listClients(limit = 50, offset = 0, search = "") {
  const where = search ? "WHERE telephone LIKE ? OR nom LIKE ?" : "";
  const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];
  const [rows] = await db.query(
    `SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
  return rows;
}
async function countClients(search = "") {
  const where = search ? "WHERE telephone LIKE ? OR nom LIKE ?" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  const [rows] = await db.execute(
    `SELECT COUNT(*) as cnt FROM clients ${where}`,
    params
  );
  return Number(rows[0]?.cnt ?? 0);
}
async function getClientByPhone(telephone) {
  const [rows] = await db.execute(
    "SELECT * FROM clients WHERE telephone = ? LIMIT 1",
    [telephone]
  );
  return rows[0] ?? null;
}
async function getClientById(id) {
  const [rows] = await db.execute(
    "SELECT * FROM clients WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
async function upsertClient(data) {
  const existing = await getClientByPhone(data.telephone);
  if (existing) {
    const sets = [];
    const vals = [];
    if (data.nom !== void 0) {
      sets.push("nom=?");
      vals.push(data.nom);
    }
    if (data.email !== void 0) {
      sets.push("email=?");
      vals.push(data.email);
    }
    if (data.adresse !== void 0) {
      sets.push("adresse=?");
      vals.push(data.adresse);
    }
    if (data.ville !== void 0) {
      sets.push("ville=?");
      vals.push(data.ville);
    }
    if (data.statut !== void 0) {
      sets.push("statut=?");
      vals.push(data.statut);
    }
    if (data.notes !== void 0) {
      sets.push("notes=?");
      vals.push(data.notes);
    }
    if (data.tags !== void 0) {
      sets.push("tags=?");
      vals.push(data.tags);
    }
    if (sets.length) {
      vals.push(existing.id);
      await db.execute(
        `UPDATE clients SET ${sets.join(",")} WHERE id=?`,
        vals
      );
    }
    return existing.id;
  } else {
    const [result] = await db.execute(
      "INSERT INTO clients (telephone,nom,email,adresse,ville,statut,notes,tags) VALUES (?,?,?,?,?,?,?,?)",
      [
        data.telephone,
        data.nom ?? "",
        data.email ?? "",
        data.adresse ?? "",
        data.ville ?? "",
        data.statut ?? "normal",
        data.notes ?? "",
        data.tags ?? null
      ]
    );
    return result.insertId;
  }
}
async function deleteClient(id) {
  await db.execute("DELETE FROM clients WHERE id = ?", [id]);
}
async function getClientOrders(telephone) {
  const [rows] = await db.query(
    `SELECT id, reference, nom, telephone, zone_livraison, delivery_fee,
            subtotal, total, status, statut_paiement, created_at
     FROM orders WHERE telephone = ? ORDER BY created_at DESC LIMIT 20`,
    [telephone]
  );
  return rows;
}
async function getClientStats(telephone) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_spent,
     COALESCE(AVG(total),0) as avg_basket, MAX(created_at) as last_order_at
     FROM orders WHERE telephone = ?`,
    [telephone]
  );
  const r = rows[0] ?? {};
  return {
    total_orders: Number(r.total_orders ?? 0),
    total_spent: Number(r.total_spent ?? 0),
    avg_basket: Number(r.avg_basket ?? 0),
    last_order_at: r.last_order_at ?? null
  };
}
async function getCRMStats() {
  const [newClients] = await db.execute(
    "SELECT COUNT(*) as cnt FROM clients WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  ).catch(() => [[{ cnt: 0 }]]);
  const [topClients] = await db.query(
    `SELECT c.id, c.nom, c.telephone, c.statut,
     COUNT(o.id) as total_orders, COALESCE(SUM(o.total),0) as total_spent
     FROM clients c
     LEFT JOIN orders o ON o.telephone = c.telephone
     GROUP BY c.id ORDER BY total_spent DESC LIMIT 10`
  ).catch(() => [[], []]);
  return {
    newClients30d: Number(newClients[0]?.cnt ?? 0),
    topClients
  };
}
async function updateProductStock(produit_id, _entrepot_id, stock) {
  await db.execute(
    `UPDATE produits SET stock_magasin = ? WHERE id = ?`,
    [stock, produit_id]
  );
}
async function getStockStats() {
  const [rows] = await db.execute(`
    SELECT
      COUNT(*)                                                                                   AS en_stock,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) = 0 THEN 1 ELSE 0 END)                           AS en_rupture,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) > 0 AND COALESCE(stock_magasin, 0) <= 5 THEN 1 ELSE 0 END) AS stock_faible,
      COALESCE(SUM(prix_unitaire * COALESCE(stock_magasin, 0)), 0)                               AS valeur_totale
    FROM produits
  `);
  const r = rows[0];
  return {
    en_stock: Number(r.en_stock ?? 0),
    en_rupture: Number(r.en_rupture ?? 0),
    stock_faible: Number(r.stock_faible ?? 0),
    valeur_totale: Number(r.valeur_totale ?? 0),
    entrees_jour: 0,
    sorties_jour: 0
  };
}
async function getProduitColsAdmin() {
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map((r) => r.COLUMN_NAME.toLowerCase()));
  return {
    image_url: names.has("image_url"),
    image: names.has("image"),
    remise: names.has("remise")
  };
}
async function ensureBoutiqueStockPopulated() {
  return runOnce("boutique_stock", async () => {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS boutique_stock (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      produit_id   INT NOT NULL,
      quantite     INT NOT NULL DEFAULT 0,
      seuil_alerte INT NOT NULL DEFAULT 5,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_produit (produit_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    const [[cnt]] = await db.execute(
      "SELECT COUNT(*) AS n FROM boutique_stock"
    );
    if (Number(cnt.n ?? 0) === 0) {
      await db.execute(`
      INSERT INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
      ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)
    `).catch(
        () => db.execute(`
        INSERT INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
        ON DUPLICATE KEY UPDATE quantite = quantite
      `)
      );
    } else {
      await db.execute(`
      INSERT IGNORE INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
    `).catch(
        () => db.execute(`
        INSERT IGNORE INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
      `)
      );
    }
  });
}
async function getStockBoutiqueStats(shopId = 1) {
  await ensureBoutiqueStockPopulated();
  const [rows] = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM produits WHERE shop_id = ?)                                     AS total_produits,
      COALESCE(SUM(bs.quantite * p.prix_unitaire), 0)                                      AS valeur_boutique,
      SUM(CASE WHEN bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte THEN 1 ELSE 0 END) AS stock_faible,
      SUM(CASE WHEN bs.quantite = 0 THEN 1 ELSE 0 END)                                     AS epuises
    FROM boutique_stock bs
    JOIN produits p ON p.id = bs.produit_id
    WHERE p.shop_id = ?
  `, [shopId, shopId]);
  const r = rows[0] ?? {};
  return {
    total_produits: Number(r.total_produits ?? 0),
    valeur_boutique: Number(r.valeur_boutique ?? 0),
    stock_faible: Number(r.stock_faible ?? 0),
    epuises: Number(r.epuises ?? 0)
  };
}
async function getStockBoutiqueList(opts) {
  const { search, filter = "all", limit = 50, offset = 0, shopId = 1 } = opts;
  await ensureBoutiqueStockPopulated();
  const cols = await getProduitColsAdmin();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const remiseCol = cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0";
  const searchLike = search ? `%${search}%` : null;
  const p1Conds = [`p.shop_id = ${Number(shopId)}`, "NOT EXISTS (SELECT 1 FROM product_variants pv2 WHERE pv2.produit_id = p.id)"];
  const p1Params = [];
  if (searchLike) {
    p1Conds.push("(p.nom LIKE ? OR p.reference LIKE ?)");
    p1Params.push(searchLike, searchLike);
  }
  if (filter === "faible") p1Conds.push("COALESCE(bs.quantite,0)>0 AND COALESCE(bs.quantite,0)<=COALESCE(bs.seuil_alerte,5) AND p.entrepot_id IS NULL");
  if (filter === "epuise") p1Conds.push("COALESCE(bs.quantite,0)=0 AND p.entrepot_id IS NULL");
  if (filter === "disponible") p1Conds.push("(COALESCE(bs.quantite,0)>0 OR p.entrepot_id IS NOT NULL)");
  p1Conds.push("(bs.produit_id IS NOT NULL OR p.entrepot_id IS NOT NULL)");
  const [rows1] = await db.query(
    `SELECT COALESCE(bs.produit_id, p.id) AS produit_id,
            NULL AS variant_id, NULL AS variant_nom,
            p.nom, p.reference,
            ${imageCol} AS image_url, ${remiseCol} AS remise, p.prix_unitaire,
            COALESCE(c.nom,'') AS categorie_nom,
            CASE WHEN p.entrepot_id IS NOT NULL THEN 999 ELSE COALESCE(bs.quantite,0) END AS quantite,
            COALESCE(bs.seuil_alerte,5) AS seuil_alerte
     FROM produits p
     LEFT JOIN boutique_stock bs ON bs.produit_id = p.id
     LEFT JOIN categories c ON c.id = p.categorie_id
     WHERE ${p1Conds.join(" AND ")}`,
    p1Params
  );
  const p2Conds = [`p.shop_id = ${Number(shopId)}`];
  const p2Params = [];
  if (searchLike) {
    p2Conds.push("(p.nom LIKE ? OR pv.nom LIKE ? OR p.reference LIKE ?)");
    p2Params.push(searchLike, searchLike, searchLike);
  }
  if (filter === "disponible") p2Conds.push("pv.stock_boutique > 0");
  if (filter === "epuise") p2Conds.push("pv.stock_boutique = 0");
  if (filter === "faible") p2Conds.push("pv.stock_boutique > 0 AND pv.stock_boutique <= 5");
  let rows2 = [];
  try {
    [rows2] = await db.query(
      `SELECT pv.produit_id,
              pv.id AS variant_id, pv.nom AS variant_nom,
              CONCAT(p.nom, ' \u2014 ', pv.nom) AS nom,
              COALESCE(NULLIF(pv.reference_sku,''), p.reference) AS reference,
              COALESCE(NULLIF(pv.image_url,''), ${imageCol}) AS image_url,
              COALESCE(NULLIF(pv.remise,0), 0) AS remise,
              CASE WHEN pv.prix > 0 THEN pv.prix ELSE p.prix_unitaire END AS prix_unitaire,
              COALESCE(c.nom,'') AS categorie_nom,
              pv.stock_boutique AS quantite,
              5 AS seuil_alerte
       FROM product_variants pv
       JOIN produits p ON p.id = pv.produit_id
       LEFT JOIN categories c ON c.id = p.categorie_id
       ${p2Conds.length ? "WHERE " + p2Conds.join(" AND ") : ""}`,
      p2Params
    );
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") throw err;
  }
  const mapRow = (r) => ({
    produit_id: Number(r.produit_id),
    variant_id: r.variant_id != null ? Number(r.variant_id) : void 0,
    variant_nom: r.variant_nom ?? void 0,
    nom: String(r.nom),
    reference: String(r.reference ?? ""),
    image_url: r.image_url ?? null,
    categorie_nom: String(r.categorie_nom ?? ""),
    prix_unitaire: Number(r.prix_unitaire),
    remise: Number(r.remise ?? 0),
    quantite: Number(r.quantite),
    seuil_alerte: Number(r.seuil_alerte),
    valeur: Number(r.quantite) * Number(r.prix_unitaire)
  });
  const all = [
    ...rows1.map(mapRow),
    ...rows2.map(mapRow)
  ].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  return {
    items: all.slice(offset, offset + limit),
    total: all.length
  };
}
async function createBoutiqueMouvement(data) {
  await db.execute(
    `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id, shop_id)
     VALUES (?,?,?,?,?,?,?)`,
    [
      data.produit_id,
      data.type,
      Math.abs(data.quantite),
      data.motif ?? null,
      data.ref_commande ?? null,
      data.admin_id ?? null,
      data.shop_id ?? 1
    ]
  );
  const delta = data.type === "entree" ? Math.abs(data.quantite) : -Math.abs(data.quantite);
  await db.execute(
    `UPDATE boutique_stock SET quantite = GREATEST(0, quantite + ?), updated_at = NOW() WHERE produit_id = ?`,
    [delta, data.produit_id]
  );
  try {
    await db.execute(
      `UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id SET p.stock_boutique = bs.quantite WHERE p.id = ?`,
      [data.produit_id]
    );
  } catch {
  }
}
async function getRecentBoutiqueMovements(limit = 30, shopId = 1) {
  const [rows] = await db.query(
    `SELECT bm.*, p.nom AS nom_produit,
            COALESCE(au.nom, u.nom) AS admin_nom
     FROM boutique_mouvements bm
     JOIN produits p ON p.id = bm.produit_id
     LEFT JOIN admin_users au ON au.id = bm.admin_id
     LEFT JOIN utilisateurs u ON u.id = bm.admin_id
     WHERE p.shop_id = ?
     ORDER BY bm.created_at DESC
     LIMIT ${Number(limit)}`,
    [shopId]
  );
  return rows;
}
async function listFactures(opts = {}) {
  const { limit = 50, offset = 0, search, statut, shopId = 1 } = opts;
  const conditions = ["f.shop_id = ?"];
  const params = [shopId];
  if (search) {
    conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (statut) {
    conditions.push("statut = ?");
    params.push(statut);
  }
  conditions.push("(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT f.*, COALESCE(_so.coupon_remise, 0) AS coupon_remise, _so.status AS order_status,
            CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status IN ('confirmed','shipped','delivered')
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     ${where} ORDER BY f.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query(
    `SELECT COUNT(*) AS cnt FROM factures f LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status IN ('confirmed','shipped','delivered') ${where}`,
    params
  );
  return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function ensureFacturePaiementsTable() {
  return runOnce("facture_paiements", () => db.execute(`
    CREATE TABLE IF NOT EXISTS facture_paiements (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      facture_id    INT NOT NULL,
      montant       DECIMAL(12,2) NOT NULL,
      mode_paiement VARCHAR(50) NULL,
      admin_id      INT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_fp_facture (facture_id)
    )
  `).then(() => {
  }));
}
async function createFacturePaiement(data) {
  await ensureFacturePaiementsTable();
  await db.execute(
    `INSERT INTO facture_paiements (facture_id, montant, mode_paiement, admin_id) VALUES (?,?,?,?)`,
    [data.facture_id, data.montant, data.mode_paiement ?? null, data.admin_id ?? null]
  );
}
async function getFacturePaiements(facture_id) {
  await ensureFacturePaiementsTable();
  const [rows] = await db.execute(
    `SELECT fp.*, COALESCE(au.nom, util.nom) AS vendeur
     FROM facture_paiements fp
     LEFT JOIN admin_users au ON au.id = fp.admin_id
     LEFT JOIN utilisateurs util ON util.id = fp.admin_id
     WHERE fp.facture_id = ? ORDER BY fp.created_at ASC`,
    [facture_id]
  );
  return rows;
}
async function getFactureById(id) {
  const [rows] = await db.execute(
    `SELECT f.*, COALESCE(o.coupon_remise, 0) AS coupon_remise,
            CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN orders o ON o.id = f.order_id
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     WHERE f.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  const facture = rows[0];
  facture.paiements = await getFacturePaiements(id);
  return facture;
}
async function getClientFacturesByNom(nom, tel) {
  const conditions = ["(f.client_nom = ? OR f.client_nom LIKE ?)"];
  const params = [nom, `%${nom}%`];
  if (tel) {
    conditions.push("f.client_tel = ?");
    params.push(tel);
  }
  const [rows] = await db.query(
    `SELECT f.*, CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     WHERE f.client_nom = ?
     ORDER BY f.created_at DESC LIMIT 50`,
    [nom]
  );
  return rows;
}
function generateVenteRef(prefix) {
  const now = /* @__PURE__ */ new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const seq = String(Math.floor(1e3 + Math.random() * 9e3));
  return `${prefix}${date}${seq}`;
}
async function createFacture(data) {
  const reference = generateVenteRef("FV");
  const [result] = await db.execute(
    `INSERT INTO factures (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, note, admin_id, shop_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      reference,
      data.client_nom,
      data.client_tel ?? null,
      data.client_email ?? null,
      JSON.stringify(data.items),
      data.sous_total,
      data.remise ?? 0,
      data.total,
      data.statut ?? "brouillon",
      data.note ?? null,
      data.admin_id ?? null,
      data.shop_id ?? 1
    ]
  );
  if (data.client_nom?.trim() && data.client_tel?.trim()) {
    const _sId = data.shop_id ?? 1;
    await db.execute(
      `INSERT INTO boutique_clients (nom, telephone, email, type_client, shop_id)
       SELECT ?, ?, ?, 'particulier', ? FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ? AND shop_id = ?)`,
      [data.client_nom.trim(), data.client_tel.trim(), data.client_email ?? null, _sId, data.client_tel.trim(), _sId]
    ).catch(() => {
    });
  }
  return result.insertId;
}
async function createVenteWithStock(data) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of data.items) {
      if (item.variant_id) {
        const [[vRow]] = await conn.execute(
          "SELECT stock_boutique FROM product_variants WHERE id = ? LIMIT 1",
          [item.variant_id]
        );
        const dispo = Number(vRow?.stock_boutique ?? 0);
        if (dispo < item.qty) {
          throw new Error(`Stock boutique insuffisant pour "${item.nom}" (dispo: ${dispo}, demand\xE9: ${item.qty})`);
        }
      } else {
        const [rows] = await conn.execute(
          "SELECT quantite FROM boutique_stock WHERE produit_id = ? LIMIT 1",
          [item.produit_id]
        );
        const dispo = Number(rows[0]?.quantite ?? 0);
        if (dispo < item.qty) {
          throw new Error(`Stock insuffisant pour "${item.nom}" (dispo: ${dispo}, demand\xE9: ${item.qty})`);
        }
      }
    }
    const reference = generateVenteRef("VT");
    data.client_nom = data.client_nom.trim().toUpperCase();
    const [result] = await conn.execute(
      `INSERT INTO factures
         (reference, client_nom, client_tel, items,
          sous_total, remise, total,
          avec_livraison, adresse_livraison, contact_livraison, lien_localisation,
          mode_paiement, statut_paiement, montant_acompte,
          statut, note, admin_id, shop_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        reference,
        data.client_nom,
        data.client_tel ?? null,
        JSON.stringify(data.items),
        data.sous_total,
        data.remise ?? 0,
        data.total,
        data.avec_livraison ? 1 : 0,
        data.adresse_livraison ?? null,
        data.contact_livraison ?? null,
        data.lien_localisation ?? null,
        data.mode_paiement ?? null,
        data.statut_paiement ?? null,
        data.montant_acompte ?? null,
        "valide",
        data.note ?? null,
        data.admin_id ?? null,
        data.shop_id ?? 1
      ]
    );
    const factureId = result.insertId;
    for (const item of data.items) {
      if (item.variant_id) {
        await conn.execute(
          "UPDATE product_variants SET stock_boutique = GREATEST(0, stock_boutique - ?) WHERE id = ?",
          [item.qty, item.variant_id]
        );
      } else {
        await conn.execute(
          "UPDATE boutique_stock SET quantite = GREATEST(0, quantite - ?), updated_at = NOW() WHERE produit_id = ?",
          [item.qty, item.produit_id]
        );
        try {
          await conn.execute(
            `UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id
           SET p.stock_boutique = bs.quantite WHERE p.id = ?`,
            [item.produit_id]
          );
        } catch {
        }
      }
      await conn.execute(
        `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?,?,?,?,?,?)`,
        [item.produit_id, "sortie", item.qty, "Vente", reference, data.admin_id ?? null]
      );
    }
    if (data.avec_livraison) {
      const livRef = generateVenteRef("LV");
      await conn.execute(
        `INSERT INTO livraisons_ventes
           (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          livRef,
          factureId,
          data.client_nom,
          data.client_tel ?? null,
          data.adresse_livraison ?? null,
          data.contact_livraison ?? null,
          data.lien_localisation ?? null,
          "en_attente"
        ]
      );
    }
    await conn.commit();
    if (data.client_nom?.trim() && data.client_tel?.trim()) {
      const _sId = data.shop_id ?? 1;
      await db.execute(
        `INSERT INTO boutique_clients (nom, telephone, type_client, shop_id)
         SELECT ?, ?, 'particulier', ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ? AND shop_id = ?)`,
        [data.client_nom.trim(), data.client_tel.trim(), _sId, data.client_tel.trim(), _sId]
      ).catch(() => {
      });
    }
    if (data.statut_paiement && data.statut_paiement !== "non_paye") {
      const montantInitial = data.statut_paiement === "acompte" ? data.montant_acompte ?? 0 : data.total;
      if (montantInitial > 0) {
        await createFacturePaiement({
          facture_id: factureId,
          montant: montantInitial,
          mode_paiement: data.mode_paiement ?? null,
          admin_id: data.admin_id ?? null
        }).catch(() => {
        });
      }
    }
    if (!data.avec_livraison && data.statut_paiement && data.statut_paiement !== "non_paye") {
      const montantFinance = data.statut_paiement === "acompte" ? data.montant_acompte ?? 0 : data.total;
      if (montantFinance > 0) {
        await createFinanceEntry({
          type: "vente",
          mode_paiement: data.mode_paiement ?? "especes",
          categorie: "Vente boutique",
          description: `Vente ${reference} \u2013 ${data.client_nom.trim()}`,
          montant: montantFinance,
          date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          shop_id: data.shop_id ?? 1
        }).catch(() => {
        });
      }
    }
    invalidateVentesStats();
    return { id: factureId, reference };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function updateFactureStatut(id, statut) {
  await db.execute("UPDATE factures SET statut = ? WHERE id = ?", [statut, id]);
  invalidateVentesStats();
}
async function updateFacture(id, data) {
  const sets = [];
  const params = [];
  if (data.statut !== void 0) {
    sets.push("statut = ?");
    params.push(data.statut);
  }
  if (data.statut_paiement !== void 0) {
    sets.push("statut_paiement = ?");
    params.push(data.statut_paiement);
  }
  if (data.mode_paiement !== void 0) {
    sets.push("mode_paiement = ?");
    params.push(data.mode_paiement);
  }
  if (data.montant_acompte !== void 0) {
    sets.push("montant_acompte = ?");
    params.push(data.montant_acompte);
  }
  if (sets.length > 0) {
    params.push(id);
    await db.execute(`UPDATE factures SET ${sets.join(", ")} WHERE id = ?`, params);
  }
  if (data.montant_paiement && data.montant_paiement > 0) {
    await createFacturePaiement({
      facture_id: id,
      montant: data.montant_paiement,
      mode_paiement: data.mode_paiement ?? null,
      admin_id: data.admin_id ?? null
    }).catch(() => {
    });
    let factureRow;
    try {
      const [[f]] = await db.execute(
        "SELECT reference, client_nom FROM factures WHERE id = ? LIMIT 1",
        [id]
      );
      factureRow = f;
    } catch (err) {
      console.error("[updateFacture/select]", err);
    }
    if (factureRow) {
      try {
        await createFinanceEntry({
          type: "vente",
          mode_paiement: data.mode_paiement ?? "especes",
          categorie: "Vente boutique",
          description: `Paiement ${factureRow.reference} \u2013 ${factureRow.client_nom}`,
          montant: data.montant_paiement,
          date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          shop_id: data.shop_id ?? 1
        });
      } catch (err) {
        console.error("[updateFacture/createFinanceEntry]", err);
      }
    }
  }
  invalidateVentesStats();
}
async function deleteFacture(id) {
  const [[row]] = await db.execute(
    "SELECT reference, items FROM factures WHERE id = ?",
    [id]
  );
  const ref = row?.reference;
  const items = (() => {
    try {
      const raw = row?.items;
      return Array.isArray(raw) ? raw : JSON.parse(raw ?? "[]");
    } catch {
      return [];
    }
  })();
  await Promise.all([
    db.execute("DELETE FROM factures WHERE id = ?", [id]),
    db.execute("DELETE FROM livraisons_ventes WHERE facture_id = ?", [id]).catch(() => {
    })
  ]);
  for (const item of items) {
    if (!item.produit_id || !item.qty) continue;
    await db.execute(
      "UPDATE boutique_stock SET quantite = quantite + ?, updated_at = NOW() WHERE produit_id = ?",
      [item.qty, item.produit_id]
    ).catch(() => {
    });
    await db.execute(
      `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande)
       VALUES (?, 'entree', ?, 'Annulation vente', ?)`,
      [item.produit_id, item.qty, ref ?? null]
    ).catch(() => {
    });
    await db.execute(
      `UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id
       SET p.stock_boutique = bs.quantite WHERE p.id = ?`,
      [item.produit_id]
    ).catch(() => {
    });
  }
  if (ref) {
    await db.execute(
      "DELETE FROM finance_entries WHERE CONVERT(description USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ?",
      [`%${ref}%`]
    ).catch(() => {
    });
  }
  await db.execute(
    "DELETE FROM finance_entries WHERE CONVERT(description USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE ?",
    [`%facture #${id}%`]
  ).catch(() => {
  });
  invalidateVentesStats();
}
async function listDevis(opts = {}) {
  const { limit = 50, offset = 0, search, statut, shopId = 1 } = opts;
  const conditions = ["shop_id = ?"];
  const params = [shopId];
  if (search) {
    conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (statut) {
    conditions.push("statut = ?");
    params.push(statut);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT id, reference, client_nom, client_tel, client_email, items,
            sous_total, remise, total, statut, valide_jusqu, note, admin_id, created_at, updated_at
     FROM devis ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query(`SELECT COUNT(*) AS cnt FROM devis ${where}`, params);
  return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function createDevis(data) {
  const reference = generateVenteRef("DV");
  const [result] = await db.execute(
    `INSERT INTO devis (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, valide_jusqu, note, admin_id, shop_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      reference,
      data.client_nom,
      data.client_tel ?? null,
      data.client_email ?? null,
      JSON.stringify(data.items),
      data.sous_total,
      data.remise ?? 0,
      data.total,
      data.statut ?? "brouillon",
      data.valide_jusqu ?? null,
      data.note ?? null,
      data.admin_id ?? null,
      data.shop_id ?? 1
    ]
  );
  return result.insertId;
}
async function createPaymentPlan(data) {
  const mt = Math.round(data.montant_total / data.nb_tranches * 100) / 100;
  const [result] = await db.execute(
    `INSERT INTO payment_plans (order_id, nb_tranches, montant_total, montant_tranche) VALUES (?,?,?,?)`,
    [data.order_id, data.nb_tranches, data.montant_total, mt]
  );
  const planId = result.insertId;
  for (let i = 1; i <= data.nb_tranches; i++) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + (i - 1) * 7);
    await db.execute(
      `INSERT INTO payment_tranches (plan_id, numero, montant, date_echeance) VALUES (?,?,?,?)`,
      [planId, i, mt, d.toISOString().split("T")[0]]
    );
  }
  return planId;
}
async function listPaymentPlans() {
  const [rows] = await db.execute(
    `SELECT pp.*, o.reference, o.nom
     FROM payment_plans pp JOIN orders o ON o.id = pp.order_id
     ORDER BY pp.created_at DESC`
  );
  return rows;
}
async function getPaymentPlanByOrderId(orderId) {
  const [planRows] = await db.execute(
    `SELECT pp.*, o.reference, o.nom FROM payment_plans pp
     JOIN orders o ON o.id = pp.order_id WHERE pp.order_id = ? LIMIT 1`,
    [orderId]
  );
  if (!planRows.length) return null;
  const plan = planRows[0];
  const [tranches] = await db.execute(
    `SELECT * FROM payment_tranches WHERE plan_id = ? ORDER BY numero`,
    [plan.id]
  );
  return { ...plan, tranches };
}
async function markTranchePaid(trancheId, note, mode_paiement) {
  await db.execute(
    `UPDATE payment_tranches SET statut='payee', date_paiement=NOW(), note=?, mode_paiement=? WHERE id=?`,
    [note ?? null, mode_paiement ?? null, trancheId]
  );
  const [tRow] = await db.execute(
    `SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`,
    [trancheId]
  );
  const planId = tRow[0]?.plan_id;
  if (!planId) return;
  const [rem] = await db.execute(
    `SELECT COUNT(*) AS cnt FROM payment_tranches WHERE plan_id=? AND statut!='payee'`,
    [planId]
  );
  if (Number(rem[0]?.cnt) === 0) {
    await db.execute(`UPDATE payment_plans SET statut='solde' WHERE id=?`, [planId]);
    const [pRow] = await db.execute(
      `SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`,
      [planId]
    );
    if (pRow[0]?.order_id) {
      await db.execute(`UPDATE orders SET status='confirmed' WHERE id=?`, [pRow[0].order_id]);
      await addOrderEvent(pRow[0].order_id, "confirmed", "Paiement \xE9chelonn\xE9 sold\xE9 \u2014 commande confirm\xE9e");
    }
  }
}
async function markTrancheUnpaid(trancheId) {
  await db.execute(
    `UPDATE payment_tranches SET statut='en_attente', date_paiement=NULL, note=NULL WHERE id=?`,
    [trancheId]
  );
  const [tRow] = await db.execute(
    `SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`,
    [trancheId]
  );
  if (tRow[0]?.plan_id) {
    await db.execute(
      `UPDATE payment_plans SET statut='en_cours' WHERE id=? AND statut='solde'`,
      [tRow[0].plan_id]
    );
  }
}
async function cancelPaymentPlan(planId) {
  await db.execute(`UPDATE payment_plans SET statut='annule' WHERE id=?`, [planId]);
  const [pRow] = await db.execute(
    `SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`,
    [planId]
  );
  if (pRow[0]?.order_id) {
    await db.execute(`UPDATE orders SET status='annul\xE9e' WHERE id=?`, [pRow[0].order_id]);
  }
}
async function updateDevisStatut(id, statut) {
  await db.execute("UPDATE devis SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteDevis(id) {
  await db.execute("DELETE FROM devis WHERE id = ?", [id]);
}
async function listLivraisons(opts = {}) {
  const { limit = 50, offset = 0, search, statut, shopId = 1 } = opts;
  const conditions = ["shop_id = ?"];
  const params = [shopId];
  if (search) {
    conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (statut) {
    conditions.push("statut = ?");
    params.push(statut);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT id, reference, facture_id, client_nom, client_tel, adresse,
            contact_livraison, lien_localisation, statut, livreur,
            montant_livraison, order_id, livree_le, created_at, updated_at
     FROM livraisons_ventes ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query(`SELECT COUNT(*) AS cnt FROM livraisons_ventes ${where}`, params);
  return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function updateLivraisonStatut(id, statut) {
  await db.execute("UPDATE livraisons_ventes SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteLivraison(id) {
  await db.execute("DELETE FROM livraisons_ventes WHERE id = ?", [id]);
}
async function listFinanceEntries(opts = {}) {
  const { limit = 50, offset = 0, type, search, shopId = 1 } = opts;
  await financeEntrieCols();
  const conditions = ["f.type != 'vente'", "f.shop_id = ?"];
  const params = [shopId];
  if (type) {
    conditions.push("f.type = ?");
    params.push(type);
  }
  if (search) {
    conditions.push("(f.categorie LIKE ? OR f.reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT f.*, COALESCE(f.admin_nom, au.nom, u.nom) AS admin_nom
     FROM finance_entries f
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs u ON u.id = f.admin_id
     ${where} ORDER BY f.date_entree DESC, f.id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query(
    `SELECT COUNT(*) AS cnt FROM finance_entries f ${where}`,
    params
  );
  const items = rows.map((r) => ({ ...r, montant: Number(r.montant) }));
  return { items, total: Number(cnt[0]?.cnt ?? 0) };
}
async function financeEntrieCols() {
  if (_finCols) return _finCols;
  const [rows] = await db.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_entries'`
  );
  const names = new Set(rows.map((r) => r.COLUMN_NAME.toLowerCase()));
  if (!names.has("admin_id")) {
    try {
      await db.execute("ALTER TABLE finance_entries ADD COLUMN admin_id INT NULL");
    } catch {
    }
    names.add("admin_id");
  }
  if (!names.has("compte_destination")) {
    try {
      await db.execute("ALTER TABLE finance_entries ADD COLUMN compte_destination VARCHAR(30) NULL");
    } catch {
    }
    names.add("compte_destination");
  }
  if (!names.has("admin_nom")) {
    try {
      await db.execute("ALTER TABLE finance_entries ADD COLUMN admin_nom VARCHAR(150) NULL");
    } catch {
    }
    names.add("admin_nom");
  }
  try {
    await db.execute(
      `ALTER TABLE finance_entries MODIFY COLUMN type ENUM('caisse','depense','rentree','vente','transfert') NOT NULL`
    );
  } catch {
  }
  if (names.has("mode_paiement")) {
    try {
      await db.execute(
        `ALTER TABLE finance_entries MODIFY COLUMN mode_paiement ENUM('especes','moov_money','tmoney','virement_bancaire','mix_by_yas') NULL`
      );
    } catch {
    }
  }
  _finCols = {
    mode_paiement: names.has("mode_paiement"),
    admin_id: names.has("admin_id"),
    compte_destination: names.has("compte_destination"),
    admin_nom: names.has("admin_nom")
  };
  return _finCols;
}
async function getFinanceStats(shopId = 1) {
  const cols = await financeEntrieCols();
  const [netRows, transfersOut, transfersIn, summaryRow] = await Promise.all([
    // NET balance per account: ventes+rentrees+caisse as credits, depenses as debits
    cols.mode_paiement ? db.query(
      `SELECT COALESCE(mode_paiement, 'especes') AS mode_paiement,
                  SUM(CASE
                    WHEN type IN ('caisse','rentree','vente') THEN montant
                    WHEN type = 'depense' THEN -montant
                    ELSE 0
                  END) AS net
           FROM finance_entries
           WHERE type != 'transfert' AND shop_id = ?
           GROUP BY COALESCE(mode_paiement, 'especes')`,
      [shopId]
    ).then(([rows]) => rows) : Promise.resolve([]),
    // Transfer outflows (debit from source account)
    cols.mode_paiement ? db.query(
      `SELECT mode_paiement, SUM(montant) AS total
           FROM finance_entries WHERE type = 'transfert' AND shop_id = ?
           GROUP BY mode_paiement`,
      [shopId]
    ).then(([rows]) => rows) : Promise.resolve([]),
    // Transfer inflows (credit to destination account)
    cols.compte_destination ? db.query(
      `SELECT compte_destination AS mode_paiement, SUM(montant) AS total
           FROM finance_entries WHERE type = 'transfert' AND compte_destination IS NOT NULL AND shop_id = ?
           GROUP BY compte_destination`,
      [shopId]
    ).then(([rows]) => rows) : Promise.resolve([]),
    // Summary totals (manual entries only, not ventes)
    db.query(
      `SELECT
         SUM(CASE WHEN type IN ('caisse','rentree') THEN montant ELSE 0 END) AS recettes,
         SUM(CASE WHEN type = 'depense'             THEN montant ELSE 0 END) AS depenses
       FROM finance_entries WHERE shop_id = ?`,
      [shopId]
    ).then(([[row]]) => row)
  ]);
  const modeMap = {};
  netRows.forEach((r) => {
    if (r.mode_paiement) modeMap[r.mode_paiement] = Number(r.net ?? 0);
  });
  transfersOut.forEach((r) => {
    if (r.mode_paiement) modeMap[r.mode_paiement] = (modeMap[r.mode_paiement] ?? 0) - Number(r.total ?? 0);
  });
  transfersIn.forEach((r) => {
    if (r.mode_paiement) modeMap[r.mode_paiement] = (modeMap[r.mode_paiement] ?? 0) + Number(r.total ?? 0);
  });
  const especes = modeMap["especes"] ?? 0;
  const moov_money = modeMap["moov_money"] ?? 0;
  const virement_bancaire = modeMap["virement_bancaire"] ?? 0;
  const mix_by_yas = (modeMap["mix_by_yas"] ?? 0) + (modeMap["tmoney"] ?? 0);
  return {
    total_recettes: Number(summaryRow?.recettes ?? 0),
    total_depenses: Number(summaryRow?.depenses ?? 0),
    solde_net: especes + moov_money + virement_bancaire + mix_by_yas,
    especes,
    moov_money,
    virement_bancaire,
    mix_by_yas
  };
}
function genFinanceRef(type) {
  const prefix = type === "depense" ? "DEP" : type === "caisse" ? "CAI" : type === "transfert" ? "TRF" : "ENT";
  return `${prefix}-${Date.now()}`;
}
async function createFinanceEntry(data) {
  const cols = await financeEntrieCols();
  const reference = genFinanceRef(data.type);
  const colNames = ["reference", "type", "categorie", "description", "montant", "date_entree", "shop_id"];
  const colVals = [
    reference,
    data.type,
    data.categorie ?? null,
    data.description ?? null,
    data.montant,
    data.date_entree,
    data.shop_id ?? 1
  ];
  if (cols.mode_paiement) {
    colNames.push("mode_paiement");
    colVals.push(data.mode_paiement ?? "especes");
  }
  if (cols.compte_destination) {
    colNames.push("compte_destination");
    colVals.push(data.compte_destination ?? null);
  }
  if (cols.admin_id) {
    colNames.push("admin_id");
    colVals.push(data.admin_id ?? null);
  }
  if (cols.admin_nom) {
    colNames.push("admin_nom");
    colVals.push(data.admin_nom ?? null);
  }
  const [result] = await db.execute(
    `INSERT INTO finance_entries (${colNames.join(", ")}) VALUES (${colNames.map(() => "?").join(", ")})`,
    colVals
  );
  return result.insertId;
}
async function updateFinanceEntry(id, data) {
  const cols = await financeEntrieCols();
  const fields = [];
  const params = [];
  if (cols.mode_paiement && data.mode_paiement !== void 0) {
    fields.push("mode_paiement = ?");
    params.push(data.mode_paiement);
  }
  if (data.categorie !== void 0) {
    fields.push("categorie = ?");
    params.push(data.categorie);
  }
  if (data.description !== void 0) {
    fields.push("description = ?");
    params.push(data.description);
  }
  if (data.montant !== void 0) {
    fields.push("montant = ?");
    params.push(data.montant);
  }
  if (data.date_entree !== void 0) {
    fields.push("date_entree = ?");
    params.push(data.date_entree);
  }
  if (!fields.length) return;
  params.push(id);
  await db.execute(`UPDATE finance_entries SET ${fields.join(", ")} WHERE id = ?`, params);
}
async function deleteFinanceEntry(id) {
  await db.execute("DELETE FROM finance_entries WHERE id = ?", [id]);
}
function invalidateVentesStats() {
  _ventesStatsCache = null;
}
async function getVentesStats() {
  const now = Date.now();
  if (_ventesStatsCache && _ventesStatsCache.expiresAt > now) return _ventesStatsCache.data;
  const SITE_JOIN2 = "LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status = 'delivered'";
  const SITE_COND2 = "(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)";
  const [[f], [l], [ca], [fp], [tj], [cj]] = await Promise.all([
    db.execute(
      `SELECT COUNT(*) AS cnt FROM factures f ${SITE_JOIN2} WHERE ${SITE_COND2}`
    ),
    db.execute("SELECT COUNT(*) AS cnt FROM livraisons_ventes"),
    db.execute(
      `SELECT COALESCE(SUM(
        CASE
          WHEN f.statut_paiement IN ('paye','paye_total') THEN CASE WHEN f.source = 'site_order' THEN f.sous_total ELSE f.total END
          WHEN f.statut_paiement = 'acompte'             THEN COALESCE(f.montant_acompte, 0)
          ELSE 0
        END
      ), 0) AS total FROM factures f ${SITE_JOIN2} WHERE f.statut != 'annule' AND ${SITE_COND2}`
    ),
    db.execute(
      `SELECT COUNT(*) AS cnt FROM factures f ${SITE_JOIN2} WHERE f.statut = 'paye' AND ${SITE_COND2}`
    ),
    db.execute(
      `SELECT COUNT(*) AS cnt,
              COALESCE(SUM(
                CASE
                  WHEN f.statut_paiement IN ('paye','paye_total') THEN CASE WHEN f.source = 'site_order' THEN f.sous_total ELSE f.total END
                  WHEN f.statut_paiement = 'acompte'             THEN COALESCE(f.montant_acompte, 0)
                  ELSE 0
                END
              ), 0) AS montant
       FROM factures f
       LEFT JOIN livraisons_ventes lv ON lv.facture_id = f.id
       WHERE DATE(f.created_at) = CURDATE() AND f.statut_paiement IN ('paye','paye_total','acompte') AND f.statut != 'annule' AND (f.source IS NULL OR f.source != 'site_order')
         AND (lv.id IS NULL OR lv.statut = 'livre')`
    ),
    db.execute(
      `SELECT COALESCE(SUM(subtotal - COALESCE(coupon_remise, 0)), 0) AS montant, COUNT(*) AS cnt FROM orders WHERE status = 'delivered' AND DATE(updated_at) = CURDATE()`
    ).catch(() => [[{ montant: 0, cnt: 0 }]])
  ]);
  let depenses_jour = 0;
  let rentrees_jour = 0;
  let solde_jour = 0;
  try {
    const [[sj]] = await db.execute(
      `SELECT COALESCE(SUM(
         CASE WHEN type IN ('vente','rentree','caisse') THEN montant
              WHEN type = 'depense'                    THEN -montant
              ELSE 0 END
       ), 0) AS solde
       FROM finance_entries
       WHERE DATE(date_entree) = CURDATE() AND type != 'transfert'`
    );
    const [[dj]] = await db.execute(
      `SELECT COALESCE(SUM(montant), 0) AS montant FROM finance_entries WHERE type = 'depense' AND DATE(date_entree) = CURDATE()`
    );
    const [[rj]] = await db.execute(
      `SELECT COALESCE(SUM(montant), 0) AS montant FROM finance_entries WHERE type = 'rentree' AND DATE(date_entree) = CURDATE()`
    );
    solde_jour = Number(sj?.solde ?? 0);
    depenses_jour = Number(dj?.montant ?? 0);
    rentrees_jour = Number(rj?.montant ?? 0);
  } catch {
  }
  const result = {
    factures: Number(f[0]?.cnt ?? 0),
    livraisons: Number(l[0]?.cnt ?? 0),
    ca_total: Number(ca[0]?.total ?? 0),
    factures_payees: Number(fp[0]?.cnt ?? 0),
    ventes_jour_montant: Number(tj[0]?.montant ?? 0),
    ventes_jour_count: Number(tj[0]?.cnt ?? 0),
    commandes_livrees_jour: Number(cj[0]?.montant ?? 0),
    commandes_livrees_jour_count: Number(cj[0]?.cnt ?? 0),
    depenses_jour,
    rentrees_jour,
    solde_jour
  };
  _ventesStatsCache = { data: result, expiresAt: Date.now() + 6e4 };
  return result;
}
async function getLivraisonsStats() {
  const [rows] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut IN ('acceptee','en_cours')) AS en_cours,
       SUM(statut = 'livre') AS livre
     FROM livraisons_ventes`
  );
  const r = rows[0] ?? {};
  return {
    total: Number(r.total ?? 0),
    en_attente: Number(r.en_attente ?? 0),
    en_cours: Number(r.en_cours ?? 0),
    livre: Number(r.livre ?? 0)
  };
}
async function listFournisseurs(shopId = 1) {
  const [rows] = await db.query(
    "SELECT id, nom, contact, telephone, email, adresse, note, created_at FROM fournisseurs WHERE shop_id = ? ORDER BY nom LIMIT 500",
    [shopId]
  );
  return rows;
}
async function createFournisseur(data, shopId = 1) {
  const [result] = await db.execute(
    `INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, note, shop_id) VALUES (?,?,?,?,?,?,?)`,
    [data.nom, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null, shopId]
  );
  return result.insertId;
}
async function updateFournisseur(id, data, shopId = 1) {
  await db.execute(
    `UPDATE fournisseurs SET nom=?, contact=?, telephone=?, email=?, adresse=?, note=? WHERE id=? AND shop_id=?`,
    [data.nom ?? null, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null, id, shopId]
  );
}
async function deleteFournisseur(id, shopId = 1) {
  await db.execute("DELETE FROM fournisseurs WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function listAchats(shopId = 1, limit = 50, offset = 0) {
  const [rows] = await db.query(
    `SELECT a.*, f.nom AS fournisseur_nom
     FROM achats a
     LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
     WHERE a.shop_id = ?
     ORDER BY a.date_achat DESC, a.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [shopId]
  );
  return rows;
}
async function countAchats(shopId = 1) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) as cnt FROM achats WHERE shop_id = ?",
    [shopId]
  );
  return Number(rows[0]?.cnt ?? 0);
}
async function getAchatStats(shopId = 1) {
  const [rows] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut = 'recu') AS recu,
       COALESCE(SUM(montant_total), 0) AS montant_total
     FROM achats WHERE shop_id = ?`,
    [shopId]
  );
  const r = rows[0];
  return {
    total: Number(r.total ?? 0),
    en_attente: Number(r.en_attente ?? 0),
    recu: Number(r.recu ?? 0),
    montant_total: Number(r.montant_total ?? 0)
  };
}
async function getAchatById(id, shopId = 1) {
  const [aRows] = await db.execute(
    `SELECT a.*, f.nom AS fournisseur_nom FROM achats a LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id WHERE a.id = ? AND a.shop_id = ?`,
    [id, shopId]
  );
  if (!aRows[0]) return null;
  const [iRows] = await db.execute(
    `SELECT ai.*, p.nom AS produit_nom FROM achat_items ai LEFT JOIN produits p ON p.id = ai.produit_id WHERE ai.achat_id = ?`,
    [id]
  );
  return { achat: aRows[0], items: iRows };
}
async function createAchat(data, shopId = 1) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    let reference = data.reference?.trim();
    if (!reference) {
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const [cntRows] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM achats WHERE YEAR(date_achat) = ? AND shop_id = ?`,
        [year, shopId]
      );
      const num = (Number(cntRows[0].cnt) + 1).toString().padStart(3, "0");
      reference = `ACH-${year}-${num}`;
    }
    const montant_total = data.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
    let hasTransport = false;
    try {
      await conn.execute(`ALTER TABLE achats ADD COLUMN transport VARCHAR(10) NULL`);
      hasTransport = true;
    } catch (e) {
      const err = e;
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        hasTransport = true;
      }
    }
    const achatCols = ["shop_id", "fournisseur_id", "reference", "date_achat", "statut", "montant_total", "notes"];
    const achatVals = [
      shopId,
      data.fournisseur_id ?? null,
      reference,
      data.date_achat,
      data.statut,
      montant_total,
      data.note ?? null
    ];
    if (hasTransport) {
      achatCols.push("transport");
      achatVals.push(data.transport ?? null);
    }
    const [res] = await conn.execute(
      `INSERT INTO achats (${achatCols.join(",")}) VALUES (${achatCols.map(() => "?").join(",")})`,
      achatVals
    );
    const achatId = res.insertId;
    if (data.items.length > 0) {
      const placeholders = data.items.map(() => "(?,?,?,?,?)").join(",");
      const values = data.items.flatMap((i) => [achatId, i.produit_id ?? null, i.designation, i.quantite, i.prix_unitaire]);
      await conn.execute(
        `INSERT INTO achat_items (achat_id, produit_id, designation, quantite, prix_unitaire) VALUES ${placeholders}`,
        values
      );
    }
    await conn.commit();
    return achatId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function updateAchatStatut(id, statut) {
  await db.execute("UPDATE achats SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteAchat(id, shopId = 1) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [check] = await conn.execute("SELECT id FROM achats WHERE id = ? AND shop_id = ?", [id, shopId]);
    if (!check[0]) throw new Error("Achat introuvable.");
    await conn.execute("DELETE FROM achat_items WHERE achat_id = ?", [id]);
    await conn.execute("DELETE FROM achats WHERE id = ? AND shop_id = ?", [id, shopId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function updateAchat(id, data, shopId = 1) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const sets = [];
    const vals = [];
    if ("fournisseur_id" in data) {
      sets.push("fournisseur_id = ?");
      vals.push(data.fournisseur_id ?? null);
    }
    if (data.date_achat) {
      sets.push("date_achat = ?");
      vals.push(data.date_achat);
    }
    if ("transport" in data) {
      sets.push("transport = ?");
      vals.push(data.transport ?? null);
    }
    if ("note" in data) {
      sets.push("notes = ?");
      vals.push(data.note ?? null);
    }
    if (data.items) {
      const montant_total = data.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
      sets.push("montant_total = ?");
      vals.push(montant_total);
      await conn.execute("DELETE FROM achat_items WHERE achat_id = ?", [id]);
      if (data.items.length > 0) {
        const placeholders = data.items.map(() => "(?,?,?,?,?)").join(",");
        const values = data.items.flatMap((i) => [id, i.produit_id ?? null, i.designation, i.quantite, i.prix_unitaire]);
        await conn.execute(
          `INSERT INTO achat_items (achat_id, produit_id, designation, quantite, prix_unitaire) VALUES ${placeholders}`,
          values
        );
      }
    }
    if (sets.length) {
      vals.push(id);
      vals.push(shopId);
      await conn.execute(`UPDATE achats SET ${sets.join(", ")} WHERE id = ? AND shop_id = ?`, vals);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function recevoirAchat(id, shopId = 1) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute("SELECT statut FROM achats WHERE id = ? AND shop_id = ?", [id, shopId]);
    if (!rows[0]) throw new Error("Achat introuvable.");
    if (rows[0].statut !== "en_attente") throw new Error("Cet achat n'est pas en attente.");
    await conn.execute("UPDATE achats SET statut = 'recu' WHERE id = ? AND shop_id = ?", [id, shopId]);
    const [items] = await conn.execute(
      "SELECT produit_id, quantite FROM achat_items WHERE achat_id = ? AND produit_id IS NOT NULL",
      [id]
    );
    if (items.length > 0) {
      const cases = items.map(() => "WHEN id = ? THEN COALESCE(stock_magasin, 0) + ?").join(" ");
      const ids = items.map((i) => i.produit_id);
      const vals = items.flatMap((i) => [i.produit_id, i.quantite]);
      await conn.execute(
        `UPDATE produits SET stock_magasin = CASE ${cases} END WHERE id IN (${ids.map(() => "?").join(",")})`,
        [...vals, ...ids]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function ensureLivreurCols() {
  return runOnce("livreur_cols", async () => {
    await db.execute(
      "ALTER TABLE livreurs ADD COLUMN numero_plaque VARCHAR(30) NULL AFTER telephone"
    ).catch(() => {
    });
  });
}
async function listLivreurs() {
  await ensureLivreurCols();
  const [rows] = await db.query(
    "SELECT id, nom, telephone, numero_plaque, code_acces, statut, created_at FROM livreurs ORDER BY nom ASC LIMIT 200"
  );
  return rows;
}
async function getLivreurByCode(code) {
  const [rows] = await db.execute(
    "SELECT * FROM livreurs WHERE code_acces = ? LIMIT 1",
    [code]
  );
  return rows[0] ?? null;
}
function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
async function createLivreur(data) {
  let code = generateCode();
  let [existing] = await db.execute("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
  while (existing.length > 0) {
    code = generateCode();
    [existing] = await db.execute("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
  }
  const [result] = await db.execute(
    "INSERT INTO livreurs (nom, telephone, numero_plaque, code_acces) VALUES (?,?,?,?)",
    [data.nom, data.telephone ?? null, data.numero_plaque ?? null, code]
  );
  const [rows] = await db.execute("SELECT * FROM livreurs WHERE id = ?", [result.insertId]);
  return rows[0];
}
async function updateLivreur(id, data) {
  const fields = [];
  const values = [];
  if (data.nom !== void 0) {
    fields.push("nom = ?");
    values.push(data.nom);
  }
  if (data.telephone !== void 0) {
    fields.push("telephone = ?");
    values.push(data.telephone);
  }
  if (data.numero_plaque !== void 0) {
    fields.push("numero_plaque = ?");
    values.push(data.numero_plaque);
  }
  if (data.statut !== void 0) {
    fields.push("statut = ?");
    values.push(data.statut);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE livreurs SET ${fields.join(", ")} WHERE id = ?`, values);
}
async function deleteLivreur(id) {
  await db.execute("DELETE FROM livreurs WHERE id = ?", [id]);
}
async function ensureLivreurInscriptionsTable() {
  return runOnce("livreur_inscriptions", async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS livreur_inscriptions (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        nom                VARCHAR(100) NOT NULL,
        telephone          VARCHAR(30)  NOT NULL,
        numero_plaque      VARCHAR(30)  NULL,
        carte_identite_url TEXT         NULL,
        password_hash      VARCHAR(255) NOT NULL,
        statut             ENUM('en_attente','approuve','rejete') NOT NULL DEFAULT 'en_attente',
        note_admin         TEXT         NULL,
        created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await db.execute("ALTER TABLE livreur_inscriptions ADD COLUMN carte_identite_url TEXT NULL AFTER numero_plaque").catch(() => {
    });
  });
}
async function createLivreurInscription(data) {
  await ensureLivreurInscriptionsTable();
  const [res] = await db.execute(
    "INSERT INTO livreur_inscriptions (nom, telephone, numero_plaque, carte_identite_url, password_hash) VALUES (?,?,?,?,?)",
    [data.nom, data.telephone, data.numero_plaque ?? null, data.carte_identite_url ?? null, data.password_hash]
  );
  return res.insertId;
}
async function listLivreurInscriptions(statut) {
  await ensureLivreurInscriptionsTable();
  const where = statut ? "WHERE statut = ?" : "";
  const params = statut ? [statut] : [];
  const [rows] = await db.execute(
    `SELECT id, nom, telephone, numero_plaque, carte_identite_url, statut, note_admin, created_at FROM livreur_inscriptions ${where} ORDER BY created_at DESC LIMIT 200`,
    params
  );
  return rows;
}
async function getLivreurInscriptionById(id) {
  await ensureLivreurInscriptionsTable();
  const [rows] = await db.execute(
    "SELECT * FROM livreur_inscriptions WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
}
async function updateLivreurInscriptionStatut(id, statut, note) {
  await db.execute(
    "UPDATE livreur_inscriptions SET statut = ?, note_admin = ? WHERE id = ?",
    [statut, note ?? null, id]
  );
}
async function ensureLivraisonCols() {
  return runOnce("livraison_cols", async () => {
    const alters = [
      "ALTER TABLE livraisons_ventes ADD COLUMN montant_livraison DECIMAL(10,2) NULL",
      "ALTER TABLE livraisons_ventes ADD COLUMN livree_le DATETIME NULL",
      "ALTER TABLE livraisons_ventes ADD COLUMN note TEXT NULL",
      "ALTER TABLE livraisons_ventes ADD COLUMN livreur VARCHAR(255) NULL",
      "ALTER TABLE livraisons_ventes ADD COLUMN order_id INT NULL",
      "ALTER TABLE livraisons_ventes ADD UNIQUE KEY uk_order_id (order_id)",
      "ALTER TABLE livraisons_ventes MODIFY COLUMN statut ENUM('en_attente','acceptee','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente'",
      "ALTER TABLE livraisons_ventes DROP FOREIGN KEY livraisons_ventes_ibfk_2"
    ];
    for (const sql of alters) {
      await db.execute(sql).catch(() => {
      });
    }
  });
}
async function listLivraisonsAdmin(opts = {}) {
  await ensureLivraisonCols();
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push("(lv.client_nom LIKE ? OR lv.reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (statut) {
    conditions.push("lv.statut = ?");
    params.push(statut);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [[rows], [cnt]] = await Promise.all([
    db.query(
      `SELECT lv.*, li.nom AS livreur_nom
       FROM livraisons_ventes lv
       LEFT JOIN utilisateurs li ON li.id = lv.livreur_id
       ${where}
       ORDER BY lv.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ),
    db.query(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes lv ${where}`,
      params
    )
  ]);
  return {
    items: rows.map((r) => ({ ...r, livreur: r.livreur_nom ?? r.livreur })),
    total: Number(cnt[0]?.cnt ?? 0)
  };
}
async function updateLivraisonAdmin(id, data) {
  const fields = [];
  const values = [];
  if (data.statut !== void 0) {
    fields.push("statut = ?");
    values.push(data.statut);
  }
  if (data.livreur_id !== void 0) {
    fields.push("livreur_id = ?");
    values.push(data.livreur_id);
  }
  if (data.note !== void 0) {
    fields.push("note = ?");
    values.push(data.note);
  }
  if (data.statut === "livre") {
    fields.push("livree_le = NOW()");
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE livraisons_ventes SET ${fields.join(", ")} WHERE id = ?`, values);
  if (data.statut === "livre") {
    const [[liv]] = await db.execute(
      `SELECT lv.facture_id, lv.order_id, f.reference, f.client_nom, f.total, f.sous_total,
              f.statut_paiement, f.montant_acompte, f.mode_paiement, f.source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.id = ? LIMIT 1`,
      [id]
    );
    const f = liv;
    if (!f?.order_id && f?.reference && f.statut_paiement && f.statut_paiement !== "non_paye") {
      const montant = f.statut_paiement === "acompte" ? Number(f.montant_acompte ?? 0) : Number(f.source === "site_order" ? f.sous_total : f.total);
      if (montant > 0) {
        await createFinanceEntry({
          type: "vente",
          mode_paiement: f.mode_paiement ?? "especes",
          categorie: "Vente boutique",
          description: `Vente ${f.reference} \u2013 ${f.client_nom}`,
          montant,
          date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
        }).catch(() => {
        });
      }
    }
    invalidateVentesStats();
  }
}
async function accepterLivraison(livraisonId, livreurId, montantLivraison) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      "SELECT id, statut FROM livraisons_ventes WHERE id = ? FOR UPDATE",
      [livraisonId]
    );
    const liv = rows[0];
    if (!liv || liv.statut !== "en_attente") {
      await conn.rollback();
      return false;
    }
    const [livreurRow] = await conn.execute(
      "SELECT nom FROM utilisateurs WHERE id = ?",
      [livreurId]
    );
    const nomLivreur = livreurRow[0]?.nom ?? null;
    await conn.execute(
      "UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ?, montant_livraison = ? WHERE id = ?",
      [livreurId, nomLivreur, montantLivraison ?? null, livraisonId]
    );
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function createManualLivraison(data) {
  const reference = generateVenteRef("LV");
  const [result] = await db.execute(
    `INSERT INTO livraisons_ventes
       (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut, note)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', ?)`,
    [
      reference,
      data.client_nom,
      data.client_tel ?? null,
      data.adresse ?? null,
      data.contact_livraison ?? null,
      data.lien_localisation ?? null,
      data.note ?? null
    ]
  );
  return result.insertId;
}
async function getLivraisonsForLivreur(livreurId) {
  const [rows] = await db.query(
    `SELECT lv.*, li.nom AS livreur_nom
     FROM livraisons_ventes lv
     LEFT JOIN utilisateurs li ON li.id = lv.livreur_id
     WHERE lv.statut = 'en_attente'
        OR (lv.livreur_id = ? AND lv.statut NOT IN ('livre','echoue'))
     ORDER BY lv.created_at DESC`,
    [livreurId]
  );
  return rows.map((r) => ({ ...r, livreur: r.livreur_nom ?? r.livreur }));
}
async function ensureBoutiqueClientsTable() {
  return runOnce("boutique_clients", async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS boutique_clients (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        nom          VARCHAR(255) NOT NULL,
        telephone    VARCHAR(20),
        email        VARCHAR(150),
        localisation VARCHAR(255),
        type_client  ENUM('particulier','professionnel') NOT NULL DEFAULT 'particulier',
        solde        DECIMAL(15,2) NOT NULL DEFAULT 0,
        notes        TEXT,
        shop_id      INT UNSIGNED NOT NULL DEFAULT 1,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nom       (nom),
        INDEX idx_telephone (telephone),
        INDEX idx_shop_id   (shop_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [[cnt]] = await db.execute(
      "SELECT COUNT(*) AS n FROM boutique_clients"
    );
    if (Number(cnt.n ?? 0) === 0) {
      await db.execute(`
        INSERT INTO boutique_clients (nom, telephone, email, type_client)
        SELECT nom, telephone, email, 'particulier'
        FROM clients
        WHERE telephone IS NOT NULL AND telephone != ''
      `).catch(() => {
      });
    }
  });
}
async function listBoutiqueClients(limit, offset, search, filtre, shopId = 1) {
  await ensureBoutiqueClientsTable();
  const conditions = ["shop_id = ?"];
  const params = [shopId];
  if (search) {
    conditions.push("(nom LIKE ? OR telephone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filtre === "debiteurs") {
    conditions.push("solde < 0");
  } else if (filtre === "dettes") {
    conditions.push("solde > 0");
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT * FROM boutique_clients ${where} ORDER BY nom ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows;
}
async function countBoutiqueClients(search, filtre, shopId = 1) {
  const conditions = ["shop_id = ?"];
  const params = [shopId];
  if (search) {
    conditions.push("(nom LIKE ? OR telephone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filtre === "debiteurs") {
    conditions.push("solde < 0");
  } else if (filtre === "dettes") {
    conditions.push("solde > 0");
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM boutique_clients ${where}`,
    params
  );
  return rows[0].cnt;
}
async function getBoutiqueClientById(id, shopId = 1) {
  const [rows] = await db.execute(
    "SELECT * FROM boutique_clients WHERE id = ? AND shop_id = ?",
    [id, shopId]
  );
  return rows[0] ?? null;
}
async function createBoutiqueClient(data) {
  const [result] = await db.execute(
    `INSERT INTO boutique_clients (nom, telephone, email, localisation, type_client, solde, notes, shop_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nom ?? "",
      data.telephone ?? null,
      data.email ?? null,
      data.localisation ?? null,
      data.type_client ?? "particulier",
      data.solde ?? 0,
      data.notes ?? null,
      data.shop_id ?? 1
    ]
  );
  return result.insertId;
}
async function updateBoutiqueClient(id, data, shopId = 1) {
  const fields = [];
  const values = [];
  if (data.nom !== void 0) {
    fields.push("nom = ?");
    values.push(data.nom);
  }
  if (data.telephone !== void 0) {
    fields.push("telephone = ?");
    values.push(data.telephone);
  }
  if (data.email !== void 0) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.localisation !== void 0) {
    fields.push("localisation = ?");
    values.push(data.localisation);
  }
  if (data.type_client !== void 0) {
    fields.push("type_client = ?");
    values.push(data.type_client);
  }
  if (data.solde !== void 0) {
    fields.push("solde = ?");
    values.push(data.solde);
  }
  if (data.notes !== void 0) {
    fields.push("notes = ?");
    values.push(data.notes);
  }
  if (fields.length === 0) return;
  values.push(id, shopId);
  await db.execute(`UPDATE boutique_clients SET ${fields.join(", ")} WHERE id = ? AND shop_id = ?`, values);
}
async function deleteBoutiqueClient(id, shopId = 1) {
  await db.execute("DELETE FROM boutique_clients WHERE id = ? AND shop_id = ?", [id, shopId]);
}
async function getBoutiqueClientsStats(shopId = 1) {
  const [[kpis], [segments], [acquisitions], [topDebiteurs], [topDepensiers], [derniers]] = await Promise.all([
    // KPIs
    db.query(
      `SELECT
           COUNT(*) AS total,
           SUM(solde > 0) AS en_avance,
           SUM(solde < 0) AS debiteurs,
           ROUND(AVG(solde), 2) AS solde_moyen
         FROM boutique_clients WHERE shop_id = ?`,
      [shopId]
    ),
    // Segment distribution
    db.query(
      `SELECT type_client, COUNT(*) AS count
         FROM boutique_clients WHERE shop_id = ?
         GROUP BY type_client`,
      [shopId]
    ),
    // New acquisitions last 6 months
    db.query(
      `SELECT DATE_FORMAT(created_at, '%b') AS mois,
                COUNT(*) AS count
         FROM boutique_clients
         WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY YEAR(created_at), MONTH(created_at), mois
         ORDER BY YEAR(created_at), MONTH(created_at)`,
      [shopId]
    ),
    // Top debiteurs (solde le plus négatif)
    db.query(
      `SELECT id, nom, telephone, type_client, solde
         FROM boutique_clients
         WHERE shop_id = ? AND solde < 0
         ORDER BY solde ASC
         LIMIT 5`,
      [shopId]
    ),
    // Top dépensiers (solde le plus positif = en avance = ont payé le plus)
    db.query(
      `SELECT id, nom, telephone, type_client, solde AS total_achats
         FROM boutique_clients
         WHERE shop_id = ? AND solde > 0
         ORDER BY solde DESC
         LIMIT 5`,
      [shopId]
    ),
    // Derniers clients ajoutés
    db.query(
      `SELECT * FROM boutique_clients WHERE shop_id = ? ORDER BY created_at DESC LIMIT 8`,
      [shopId]
    )
  ]);
  const kpi = kpis[0];
  return {
    total: Number(kpi?.total ?? 0),
    en_avance: Number(kpi?.en_avance ?? 0),
    debiteurs: Number(kpi?.debiteurs ?? 0),
    solde_moyen: Number(kpi?.solde_moyen ?? 0),
    segments,
    acquisitions,
    top_debiteurs: topDebiteurs,
    top_depensiers: topDepensiers,
    derniers
  };
}
async function listLoyaltyClients() {
  const [rows] = await db.execute(`
    SELECT
      lp.telephone,
      MAX(c.nom) AS nom,
      SUM(lp.points) AS total_points,
      MAX(lp.created_at) AS last_date,
      COUNT(*) AS nb_transactions
    FROM loyalty_points lp
    LEFT JOIN clients c
      ON RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', ''), 8)
       = RIGHT(REGEXP_REPLACE(lp.telephone, '[^0-9]', ''), 8)
    GROUP BY lp.telephone
    ORDER BY total_points DESC
  `);
  return rows;
}
async function getLoyaltyHistory(telephone) {
  const digits = telephone.replace(/\D/g, "").slice(-8);
  const [rows] = await db.execute(
    `SELECT * FROM loyalty_points
     WHERE RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', ''), 8) = ?
     ORDER BY created_at DESC LIMIT 50`,
    [digits]
  );
  return rows;
}
async function addLoyaltyPointsManual(telephone, points, reason) {
  await db.execute(
    `INSERT INTO loyalty_points (telephone, points, reason, created_at) VALUES (?, ?, ?, NOW())`,
    [telephone, points, reason]
  );
}
async function addFidelitePoints(telephone, points, reason) {
  return addLoyaltyPointsManual(telephone, points, reason);
}
async function listReferrals() {
  const [rows] = await db.execute(
    `SELECT * FROM referrals ORDER BY uses_count DESC, created_at DESC`
  );
  return rows;
}
async function listNewsletterSubscribers() {
  const [rows] = await db.execute(
    `SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC`
  );
  return rows;
}
async function subscribeNewsletter(email) {
  await db.execute(
    `INSERT IGNORE INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())`,
    [email]
  );
}
async function deleteNewsletterSubscriber(id) {
  await db.execute(`DELETE FROM newsletter_subscribers WHERE id = ?`, [id]);
}
async function listSiteClients() {
  try {
    const [rows] = await db.execute(`
      SELECT id, nom, email, telephone,
             google_id IS NOT NULL AS via_google,
             password IS NOT NULL  AS via_password,
             statut, created_at
      FROM clients
      WHERE password IS NOT NULL OR google_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    return rows;
  } catch {
    return [];
  }
}
async function getLoyaltyStats() {
  try {
    const [[r]] = await db.execute(`
      SELECT
        COUNT(DISTINCT telephone) AS nb_clients,
        SUM(CASE WHEN points > 0 THEN points ELSE 0 END) AS total_distribues,
        ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)) AS total_echanges
      FROM loyalty_points
    `);
    return {
      nb_clients: Number(r?.nb_clients ?? 0),
      total_distribues: Number(r?.total_distribues ?? 0),
      total_echanges: Number(r?.total_echanges ?? 0)
    };
  } catch {
    return { nb_clients: 0, total_distribues: 0, total_echanges: 0 };
  }
}
async function ensureMarquesTable() {
  return runOnce("marques", async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS marques (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        nom         VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [cols] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'produits'
         AND COLUMN_NAME  = 'marque_id'`
    );
    if (Number(cols[0]?.cnt ?? 0) === 0) {
      await db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`).catch(() => {
      });
    }
  });
}
async function listAdminMarques(shopId = 1) {
  await ensureMarquesTable();
  const [rows] = await db.execute(`
    SELECT m.id, m.nom, COALESCE(m.description, '') AS description,
           COUNT(p.id) AS nb_produits
    FROM marques m
    LEFT JOIN produits p ON p.marque_id = m.id AND p.shop_id = ?
    WHERE m.shop_id = ?
    GROUP BY m.id
    ORDER BY m.nom
  `, [shopId, shopId]);
  return rows.map((r) => ({
    id: Number(r.id),
    nom: String(r.nom),
    description: String(r.description ?? ""),
    nb_produits: Number(r.nb_produits ?? 0)
  }));
}
async function createMarque(data, shopId = 1) {
  await ensureMarquesTable();
  const [res] = await db.execute(
    `INSERT INTO marques (nom, description, shop_id) VALUES (?, ?, ?)`,
    [data.nom, data.description || null, shopId]
  );
  return res.insertId;
}
async function updateMarque(id, data, shopId = 1) {
  await db.execute(
    `UPDATE marques SET nom = ?, description = ? WHERE id = ? AND shop_id = ?`,
    [data.nom, data.description || null, id, shopId]
  );
}
async function deleteMarque(id, shopId = 1) {
  await db.execute(`DELETE FROM marques WHERE id = ? AND shop_id = ?`, [id, shopId]);
}
async function ensureTokenVersionCols() {
  const alters = [
    "ALTER TABLE admin_users ADD COLUMN token_version INT NOT NULL DEFAULT 0",
    "ALTER TABLE utilisateurs ADD COLUMN token_version INT NOT NULL DEFAULT 0"
  ];
  for (const sql of alters) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
}
async function getTokenVersion(table, id) {
  const col = table === "admin_users" ? "id" : "id";
  const [rows] = await db.execute(
    `SELECT token_version FROM ${table} WHERE ${col} = ? LIMIT 1`,
    [id]
  );
  return Number(rows[0]?.token_version ?? 0);
}
async function incrementTokenVersion(table, id) {
  await db.execute(
    `UPDATE ${table} SET token_version = token_version + 1 WHERE id = ?`,
    [id]
  );
}
async function ensureIndexes() {
  const indexes = [
    // factures — filtres fréquents sur statut, date, order_id et statut_paiement
    ["CREATE INDEX idx_fac_statut     ON factures (statut)", "factures.statut"],
    ["CREATE INDEX idx_fac_created    ON factures (created_at)", "factures.created_at"],
    ["CREATE INDEX idx_fac_order_id   ON factures (order_id)", "factures.order_id"],
    ["CREATE INDEX idx_fac_statut_pmt ON factures (statut_paiement)", "factures.statut_paiement"],
    ["CREATE INDEX idx_fac_source     ON factures (source(20))", "factures.source"],
    // orders — LEFT JOIN + filtre status/updated_at
    ["CREATE INDEX idx_ord_status     ON orders (status)", "orders.status"],
    ["CREATE INDEX idx_ord_status_upd ON orders (status, updated_at)", "orders.status+updated_at"],
    // finance_entries — GROUP BY type + filtre date + ORDER BY date_entree
    ["CREATE INDEX idx_fe_type_date   ON finance_entries (type, date_entree)", "finance_entries.type+date_entree"],
    ["CREATE INDEX idx_fe_created     ON finance_entries (date_entree)", "finance_entries.date_entree"],
    // devis — ORDER BY / filtre date
    ["CREATE INDEX idx_dev_created    ON devis (created_at)", "devis.created_at"],
    // livraisons_ventes — ORDER BY / filtre date
    ["CREATE INDEX idx_liv_created    ON livraisons_ventes (created_at)", "livraisons_ventes.created_at"],
    // orders — recherche par téléphone (suivi commande public)
    ["CREATE INDEX idx_ord_telephone  ON orders (telephone)", "orders.telephone"]
  ];
  for (const [sql, label] of indexes) {
    try {
      await db.execute(sql);
      console.log(`[indexes] OK: ${label}`);
    } catch (e) {
      const code = e.code;
      if (code !== "ER_DUP_KEYNAME") console.warn(`[indexes] ${label}:`, e.message);
    }
  }
}
async function fixSiteOrderFinanceEntries() {
  return runOnce("fix_site_order_finance_delivery", async () => {
    try {
      const [result] = await db.execute(
        `UPDATE finance_entries fe
         JOIN orders o ON fe.description LIKE CONCAT('%', o.reference COLLATE utf8mb4_unicode_ci, '%')
         SET fe.montant = fe.montant - o.delivery_fee
         WHERE fe.description LIKE 'Commande site livr\xE9e%' COLLATE utf8mb4_unicode_ci
           AND o.delivery_fee > 0
           AND fe.montant > o.delivery_fee`
      );
      if (result.affectedRows > 0) {
        console.log("[migration] fixed delivery_fee in " + result.affectedRows + " finance_entries");
        invalidateVentesStats();
      }
    } catch (e) {
      console.error("[migration] fixSiteOrderFinanceEntries failed:", e);
    }
  });
}
function mapTombolaRow(r) {
  return {
    id: Number(r.id),
    nom: String(r.nom),
    statut: r.statut,
    min_montant: Number(r.min_montant),
    min_participants: Number(r.min_participants),
    prize_description: r.prize_description ?? null,
    winner_facture_id: r.winner_facture_id ? Number(r.winner_facture_id) : null,
    winner_nom: r.winner_nom ?? null,
    winner_tel: r.winner_tel ?? null,
    winner_montant: r.winner_montant != null ? Number(r.winner_montant) : null,
    winner_reference: r.winner_reference ?? null,
    notifie: Boolean(r.notifie),
    created_at: String(r.created_at),
    launched_at: r.launched_at ? String(r.launched_at) : null,
    completed_at: r.completed_at ? String(r.completed_at) : null
  };
}
async function ensureTombolaTable() {
  return runOnce("tombola", async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tombola_sessions (
        id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nom              VARCHAR(150) NOT NULL,
        statut           ENUM('draft','active','termine') NOT NULL DEFAULT 'draft',
        min_montant      DECIMAL(10,2) NOT NULL DEFAULT 50000,
        min_participants INT UNSIGNED NOT NULL DEFAULT 10,
        prize_description TEXT NULL,
        winner_facture_id INT UNSIGNED NULL,
        winner_nom       VARCHAR(150) NULL,
        winner_tel       VARCHAR(30)  NULL,
        winner_montant   DECIMAL(10,2) NULL,
        winner_reference VARCHAR(50)  NULL,
        notifie          TINYINT(1) NOT NULL DEFAULT 0,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        launched_at      TIMESTAMP NULL,
        completed_at     TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  });
}
async function listTombolaSessions() {
  await ensureTombolaTable();
  const [rows] = await db.query(
    `SELECT * FROM tombola_sessions ORDER BY created_at DESC`
  );
  return rows.map(mapTombolaRow);
}
async function getTombolaSession(id) {
  await ensureTombolaTable();
  const [[row]] = await db.execute(
    `SELECT * FROM tombola_sessions WHERE id = ?`,
    [id]
  );
  if (!row) return null;
  return mapTombolaRow(row);
}
async function createTombolaSession(data) {
  await ensureTombolaTable();
  const [result] = await db.execute(
    `INSERT INTO tombola_sessions (nom, min_montant, min_participants, prize_description)
     VALUES (?, ?, ?, ?)`,
    [data.nom, data.min_montant, data.min_participants, data.prize_description ?? null]
  );
  return result.insertId;
}
async function updateTombolaSession(id, data) {
  const entries = Object.entries(data).filter(([, v]) => v !== void 0);
  if (entries.length === 0) return;
  const fields = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = [...entries.map(([, v]) => v), id];
  await db.execute(`UPDATE tombola_sessions SET ${fields} WHERE id = ?`, values);
}
async function deleteTombolaSession(id) {
  await db.execute(
    `DELETE FROM tombola_sessions WHERE id = ? AND statut = 'draft'`,
    [id]
  );
}
async function getTombolaParticipants(minMontant) {
  const [rows] = await db.query(
    `SELECT id AS facture_id, reference, client_nom, client_tel, total, created_at
     FROM factures
     WHERE statut_paiement = 'paye_total' AND total >= ?
     ORDER BY created_at DESC`,
    [minMontant]
  );
  return rows.map((r) => ({
    facture_id: Number(r.facture_id),
    reference: String(r.reference),
    client_nom: String(r.client_nom),
    client_tel: r.client_tel ?? null,
    total: Number(r.total),
    created_at: String(r.created_at)
  }));
}
async function spinTombola(sessionId, winnerFactureId) {
  const [[row]] = await db.execute(
    `SELECT client_nom, client_tel, total, reference FROM factures WHERE id = ?`,
    [winnerFactureId]
  );
  if (!row) throw new Error("Facture introuvable");
  await db.execute(
    `UPDATE tombola_sessions
     SET statut = 'termine', winner_facture_id = ?, winner_nom = ?, winner_tel = ?,
         winner_montant = ?, winner_reference = ?, completed_at = NOW()
     WHERE id = ? AND statut IN ('draft','active')`,
    [
      winnerFactureId,
      row.client_nom,
      row.client_tel ?? null,
      row.total,
      row.reference,
      sessionId
    ]
  );
}
async function markTombolaNotified(sessionId) {
  await db.execute(`UPDATE tombola_sessions SET notifie = 1 WHERE id = ?`, [sessionId]);
}
var _ensurePromises, _settingsCacheMap, _finCols, _ventesStatsCache;
var init_admin_db = __esm({
  "../lib/admin-db.ts"() {
    "use strict";
    init_db();
    _ensurePromises = /* @__PURE__ */ new Map();
    _settingsCacheMap = /* @__PURE__ */ new Map();
    _finCols = null;
    _ventesStatsCache = null;
  }
});

// index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_dotenv = require("dotenv");
var import_path = require("path");
var import_express47 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_helmet = __toESM(require("helmet"));
var import_express_rate_limit = require("express-rate-limit");

// routes/admin/auth.ts
var import_express = __toESM(require("express"));
var import_bcryptjs = __toESM(require("bcryptjs"));
init_admin_db();
init_db();

// ../lib/shops.ts
init_db();
var _ensured = false;
async function ensureShopsTable() {
  if (_ensured) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shops (
      id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom                 VARCHAR(150)                                          NOT NULL,
      slug                VARCHAR(100)                                          NOT NULL UNIQUE,
      email               VARCHAR(150)                                          NOT NULL,
      plan                ENUM('basic','pro','business')                        NOT NULL DEFAULT 'basic',
      actif               TINYINT(1)                                            NOT NULL DEFAULT 1,
      custom_domain       VARCHAR(255)                                          NULL UNIQUE,
      subscription_status ENUM('trial','active','expired','suspended')         NOT NULL DEFAULT 'trial',
      trial_ends_at       DATETIME                                              NULL,
      current_period_end  DATETIME                                              NULL,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const alterCols = [
    `ALTER TABLE shops ADD COLUMN custom_domain VARCHAR(255) NULL UNIQUE`,
    `ALTER TABLE shops ADD COLUMN subscription_status ENUM('trial','active','expired','suspended') NOT NULL DEFAULT 'trial'`,
    `ALTER TABLE shops ADD COLUMN trial_ends_at DATETIME NULL`,
    `ALTER TABLE shops ADD COLUMN current_period_end DATETIME NULL`,
    `ALTER TABLE shops ADD COLUMN pays VARCHAR(100) NULL`
  ];
  for (const sql of alterCols) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shop_payments (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      shop_id         INT UNSIGNED       NOT NULL,
      transaction_id  VARCHAR(100)       NOT NULL UNIQUE,
      plan            ENUM('pro','business') NOT NULL,
      amount          INT UNSIGNED        NOT NULL,
      duration_months TINYINT UNSIGNED   NOT NULL DEFAULT 1,
      status          ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
      operator        VARCHAR(10)        NULL,
      mm_reference    VARCHAR(100)       NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_at         DATETIME           NULL,
      INDEX idx_sp_shop (shop_id)
    )
  `);
  const spAlter = [
    `ALTER TABLE shop_payments ADD COLUMN operator VARCHAR(10) NULL`,
    `ALTER TABLE shop_payments ADD COLUMN mm_reference VARCHAR(100) NULL`
  ];
  for (const sql of spAlter) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
  await db.execute(
    `INSERT IGNORE INTO shops (id, nom, slug, email, subscription_status) VALUES (1, 'Default Shop', 'default', 'admin@shop.com', 'active')`
  );
  await db.execute(
    `UPDATE shops SET subscription_status = 'active' WHERE id = 1 AND subscription_status != 'active'`
  );
  _ensured = true;
}
async function getShopBySlug(slug) {
  await ensureShopsTable();
  const [rows] = await db.execute(
    "SELECT * FROM shops WHERE slug = ? AND actif = 1 LIMIT 1",
    [slug]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null };
}
async function getShopById(id) {
  await ensureShopsTable();
  const [rows] = await db.execute(
    "SELECT * FROM shops WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null };
}
async function getShopByDomain(domain) {
  await ensureShopsTable();
  const normalized = domain.toLowerCase().replace(/^www\./, "").split(":")[0];
  const [rows] = await db.execute(
    "SELECT * FROM shops WHERE custom_domain = ? AND actif = 1 LIMIT 1",
    [normalized]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null };
}
async function setShopDomain(id, domain) {
  await ensureShopsTable();
  const normalized = domain ? domain.toLowerCase().replace(/^www\./, "").split(":")[0] : null;
  await db.execute("UPDATE shops SET custom_domain = ? WHERE id = ?", [normalized, id]);
}
async function createShop(data) {
  await ensureShopsTable();
  const [result] = await db.execute(
    `INSERT INTO shops (nom, slug, email, plan) VALUES (?, ?, ?, ?)`,
    [data.nom, data.slug, data.email, data.plan ?? "basic"]
  );
  return result.insertId;
}
async function updateShop(id, data) {
  await ensureShopsTable();
  const sets = [];
  const vals = [];
  if (data.nom !== void 0) {
    sets.push("nom = ?");
    vals.push(data.nom);
  }
  if (data.email !== void 0) {
    sets.push("email = ?");
    vals.push(data.email);
  }
  if (data.plan !== void 0) {
    sets.push("plan = ?");
    vals.push(data.plan);
  }
  if (data.actif !== void 0) {
    sets.push("actif = ?");
    vals.push(data.actif ? 1 : 0);
  }
  if (data.subscription_status !== void 0) {
    sets.push("subscription_status = ?");
    vals.push(data.subscription_status);
  }
  if (!sets.length) return;
  vals.push(id);
  await db.execute(`UPDATE shops SET ${sets.join(", ")} WHERE id = ?`, vals);
}
async function listShopsWithStats() {
  await ensureShopsTable();
  const [rows] = await db.execute(`
    SELECT
      s.*,
      COALESCE(p.cnt, 0)  AS product_count,
      COALESCE(a.cnt, 0)  AS admin_count
    FROM shops s
    LEFT JOIN (SELECT shop_id, COUNT(*) AS cnt FROM produits GROUP BY shop_id) p ON p.shop_id = s.id
    LEFT JOIN (SELECT shop_id, COUNT(*) AS cnt FROM admin_users GROUP BY shop_id) a ON a.shop_id = s.id
    ORDER BY s.created_at DESC
  `);
  return rows.map((r) => ({
    ...r,
    actif: Boolean(r.actif),
    custom_domain: r.custom_domain ?? null,
    product_count: Number(r.product_count),
    admin_count: Number(r.admin_count)
  }));
}
async function activateShopSubscription(shopId, plan, durationMonths) {
  await ensureShopsTable();
  const [rows] = await db.execute(
    "SELECT current_period_end, subscription_status FROM shops WHERE id = ?",
    [shopId]
  );
  const row = rows[0];
  const base2 = row?.subscription_status === "active" && row?.current_period_end ? new Date(row.current_period_end) : /* @__PURE__ */ new Date();
  const newEnd = new Date(base2);
  newEnd.setMonth(newEnd.getMonth() + durationMonths);
  await db.execute(
    `UPDATE shops SET plan = ?, subscription_status = 'active', current_period_end = ? WHERE id = ?`,
    [plan, newEnd.toISOString().slice(0, 19).replace("T", " "), shopId]
  );
}
async function recordShopPayment(data) {
  await ensureShopsTable();
  await db.execute(
    `INSERT INTO shop_payments (shop_id, transaction_id, plan, amount, duration_months, status, operator, mm_reference, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), operator = VALUES(operator), mm_reference = VALUES(mm_reference), paid_at = VALUES(paid_at)`,
    [
      data.shopId,
      data.transactionId,
      data.plan,
      data.amount,
      data.durationMonths,
      data.status,
      data.operator ?? null,
      data.mmReference ?? null,
      data.paidAt ? data.paidAt.toISOString().slice(0, 19).replace("T", " ") : null
    ]
  );
}
async function getShopPayments(shopId) {
  await ensureShopsTable();
  const [rows] = await db.execute(
    "SELECT * FROM shop_payments WHERE shop_id = ? ORDER BY created_at DESC LIMIT 20",
    [shopId]
  );
  return rows;
}
async function expireShopSubscriptions() {
  await db.execute(`
    UPDATE shops
    SET subscription_status = 'expired'
    WHERE subscription_status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end < NOW()
      AND id != 1
  `);
}

// lib/auth.ts
var import_jose = require("jose");
init_admin_db();
var jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("FATAL: JWT_SECRET env var is not set. Server cannot start securely.");
  process.exit(1);
}
var SECRET = new TextEncoder().encode(jwtSecret);
var COOKIE_NAME = "ts_admin_token";
var TTL = 60 * 60 * 8;
function cookieDomain() {
  if (process.env.NODE_ENV !== "production") return void 0;
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN;
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return void 0;
  try {
    const host = new URL(siteUrl).hostname;
    if (host === "localhost" || /^\d+[\d.:]+$/.test(host)) return void 0;
    const parts = host.split(".");
    if (parts.length < 2) return void 0;
    return `.${parts.slice(-2).join(".")}`;
  } catch {
    return void 0;
  }
}
async function signToken(payload) {
  return new import_jose.SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${TTL}s`).sign(SECRET);
}
async function verifyToken(token) {
  try {
    const { payload } = await (0, import_jose.jwtVerify)(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}
async function getSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  try {
    const table = payload.role === "staff" ? "utilisateurs" : "admin_users";
    const dbVersion = await getTokenVersion(table, Number(payload.id));
    if (payload.token_version !== dbVersion) return null;
  } catch {
    return payload;
  }
  return payload;
}
function setAuthCookie(res, token) {
  const domain = cookieDomain();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: TTL * 1e3,
    path: "/",
    domain,
    secure: process.env.NODE_ENV === "production"
  });
}
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    domain: cookieDomain(),
    secure: process.env.NODE_ENV === "production"
  });
}

// lib/security-log.ts
init_db();
async function ensureSecurityLogsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS security_logs (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      action      VARCHAR(50)  NOT NULL,
      username    VARCHAR(100) NOT NULL,
      ip          VARCHAR(45)  NOT NULL DEFAULT '',
      user_agent  VARCHAR(255) NULL,
      details     TEXT         NULL,
      shop_id     INT UNSIGNED NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_action   (action),
      INDEX idx_created  (created_at),
      INDEX idx_shop     (shop_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await db.execute(`ALTER TABLE security_logs ADD COLUMN shop_id INT UNSIGNED NULL`);
    await db.execute(`ALTER TABLE security_logs ADD INDEX idx_shop (shop_id)`);
  } catch {
  }
}
async function logSecurityEvent(action, username, ip, userAgent, details, shopId) {
  try {
    await db.execute(
      "INSERT INTO security_logs (action, username, ip, user_agent, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [action, username, ip, userAgent ?? null, details ?? null, shopId ?? null]
    );
  } catch {
  }
}
async function getSecurityLogs(limit = 100, shopId) {
  let query = `SELECT id, action, username, ip, details, created_at FROM security_logs`;
  const params = [];
  if (shopId) {
    query += ` WHERE shop_id = ?`;
    params.push(shopId);
  }
  query += ` ORDER BY created_at DESC LIMIT ${Number(limit)}`;
  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch {
    const [rows] = await db.execute(
      `SELECT id, action, username, ip, details, created_at FROM security_logs ORDER BY created_at DESC LIMIT ${Number(limit)}`
    );
    return rows;
  }
}

// routes/admin/auth.ts
function getIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
}
var router = import_express.default.Router();
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1e3;
var lockMap = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of lockMap) {
    if (entry.lockedUntil && entry.lockedUntil < now) lockMap.delete(key);
  }
}, 60 * 60 * 1e3);
function isLocked(slug) {
  const entry = lockMap.get(slug);
  if (!entry?.lockedUntil) return { locked: false, minutesLeft: 0 };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, minutesLeft: Math.ceil((entry.lockedUntil - now) / 6e4) };
  }
  lockMap.delete(slug);
  return { locked: false, minutesLeft: 0 };
}
function recordFailure(slug) {
  const entry = lockMap.get(slug) ?? { attempts: 0, lockedUntil: null };
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  lockMap.set(slug, entry);
  return entry.attempts;
}
function resetLock(slug) {
  lockMap.delete(slug);
}
function attemptsLeft(slug) {
  const entry = lockMap.get(slug);
  return Math.max(0, MAX_ATTEMPTS - (entry?.attempts ?? 0));
}
router.post("/api/admin/auth/login", async (req, res) => {
  try {
    const { username, password, shop_slug } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    }
    await ensureShopsTable();
    const rawSlug = shop_slug ?? req.headers["x-shop-slug"] ?? "default";
    const shop = await getShopBySlug(rawSlug);
    let shopId = shop?.id ?? 1;
    const slug = username.trim().toLowerCase();
    const lock = isLocked(slug);
    if (lock.locked) {
      logSecurityEvent("login_locked", slug, getIp(req), req.headers["user-agent"]);
      return res.status(429).json({
        error: `Compte temporairement verrouill\xE9. R\xE9essayez dans ${lock.minutesLeft} minute${lock.minutesLeft > 1 ? "s" : ""}.`
      });
    }
    let user = await getAdminByUsername(slug, shopId) ?? await getAdminByEmail(slug, shopId);
    if (!user && rawSlug === "default") {
      user = await getAdminByUsernameGlobal(slug) ?? await getAdminByEmailGlobal(slug);
      if (user) shopId = user.shop_id;
    }
    if (!user) {
      const [rows] = await db.execute(
        "SELECT COUNT(*) as cnt FROM admin_users"
      );
      if (Number(rows[0]?.cnt) === 0) {
        const hash = await import_bcryptjs.default.hash(password, 12);
        await createAdminUser({
          nom: "Admin",
          username: slug,
          email: null,
          password_hash: hash,
          role: "super_admin"
        });
        user = await getAdminByUsername(slug);
      }
    }
    if (!user) {
      const teamMember = await getUtilisateurByUsername(slug);
      if (teamMember) {
        const validTeam = await import_bcryptjs.default.compare(password, teamMember.mot_de_passe);
        if (!validTeam) {
          const attempts = recordFailure(slug);
          const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
          logSecurityEvent("login_failure", slug, getIp(req), req.headers["user-agent"], `attempts=${attempts}`);
          const msg = remaining > 0 ? `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.` : `Compte verrouill\xE9 pour 15 minutes.`;
          return res.status(401).json({ error: msg });
        }
        resetLock(slug);
        let permissions2 = null;
        if (teamMember.permissions) {
          try {
            permissions2 = JSON.parse(teamMember.permissions);
          } catch {
          }
        }
        const mustChange2 = Boolean(teamMember.must_change_password);
        const tokenVersion2 = await getTokenVersion("utilisateurs", teamMember.id);
        const token2 = await signToken({
          id: teamMember.id,
          username: teamMember.username ?? slug,
          email: teamMember.email,
          nom: teamMember.nom,
          role: "staff",
          poste: teamMember.poste,
          permissions: permissions2,
          must_change_password: mustChange2,
          token_version: tokenVersion2,
          shop_id: shopId
        });
        setAuthCookie(res, token2);
        logSecurityEvent("login_success", slug, getIp(req), req.headers["user-agent"], "role=staff");
        return res.json({ ok: true, nom: teamMember.nom, role: "staff", poste: teamMember.poste, must_change_password: mustChange2 });
      }
      recordFailure(slug);
      logSecurityEvent("login_failure", slug, getIp(req), req.headers["user-agent"], "user_not_found");
      return res.status(401).json({ error: "Identifiants incorrects.", attemptsLeft: attemptsLeft(slug) });
    }
    const valid = await import_bcryptjs.default.compare(password, user.password_hash);
    if (!valid) {
      const attempts = recordFailure(slug);
      const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
      logSecurityEvent("login_failure", slug, getIp(req), req.headers["user-agent"], `attempts=${attempts}`);
      const msg = remaining > 0 ? `Identifiants incorrects. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.` : `Compte verrouill\xE9 pour 15 minutes.`;
      return res.status(401).json({ error: msg });
    }
    resetLock(slug);
    let permissions = null;
    if (user.permissions) {
      try {
        permissions = JSON.parse(user.permissions);
      } catch {
      }
    }
    const mustChange = Boolean(user.must_change_password);
    const tokenVersion = await getTokenVersion("admin_users", user.id);
    const token = await signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      nom: user.nom,
      role: user.role,
      poste: user.poste ?? void 0,
      permissions,
      must_change_password: mustChange,
      token_version: tokenVersion,
      shop_id: shopId
    });
    await updateAdminLastLogin(user.id);
    setAuthCookie(res, token);
    logSecurityEvent("login_success", slug, getIp(req), req.headers["user-agent"], `role=${user.role}`, shopId);
    return res.json({ ok: true, nom: user.nom, role: user.role, must_change_password: mustChange });
  } catch (err) {
    console.error("[admin login]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router.patch("/api/admin/auth/change-password", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Ancien et nouveau mot de passe requis." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caract\xE8res." });
  }
  try {
    const pool2 = db;
    if (session.role === "staff") {
      const [rows] = await pool2.execute(
        "SELECT mot_de_passe FROM utilisateurs WHERE id = ? AND actif = 1 LIMIT 1",
        [session.id]
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ error: "Compte introuvable." });
      const valid = await import_bcryptjs.default.compare(currentPassword, row.mot_de_passe);
      if (!valid) return res.status(401).json({ error: "Ancien mot de passe incorrect." });
      const hash = await import_bcryptjs.default.hash(newPassword, 12);
      await updateUtilisateurPassword(Number(session.id), hash);
    } else {
      const [rows] = await pool2.execute(
        "SELECT password_hash FROM admin_users WHERE id = ? AND actif = 1 LIMIT 1",
        [session.id]
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ error: "Compte introuvable." });
      const valid = await import_bcryptjs.default.compare(currentPassword, row.password_hash);
      if (!valid) return res.status(401).json({ error: "Ancien mot de passe incorrect." });
      const hash = await import_bcryptjs.default.hash(newPassword, 12);
      await updateAdminPassword(Number(session.id), hash, true);
    }
    const table = session.role === "staff" ? "utilisateurs" : "admin_users";
    await incrementTokenVersion(table, Number(session.id));
    const newVersion = await getTokenVersion(table, Number(session.id));
    const permissions = session.permissions ?? null;
    const newToken = await signToken({
      id: session.id,
      username: session.username,
      email: session.email,
      nom: session.nom,
      role: session.role,
      poste: session.poste,
      permissions,
      must_change_password: false,
      token_version: newVersion,
      shop_id: session.shop_id
    });
    setAuthCookie(res, newToken);
    logSecurityEvent("password_change", session.username, getIp(req), req.headers["user-agent"]);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router.post("/api/admin/auth/logout", async (req, res) => {
  const session = await getSession(req);
  if (session) {
    const table = session.role === "staff" ? "utilisateurs" : "admin_users";
    await incrementTokenVersion(table, Number(session.id)).catch(() => {
    });
    logSecurityEvent("logout", session.username, getIp(req), req.headers["user-agent"]);
  }
  clearAuthCookie(res);
  res.json({ ok: true });
});
router.get("/api/admin/auth/me", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  res.json({ ok: true, ...session });
});
router.post("/api/admin/auth/refresh", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    let freshPermissions = null;
    if (session.role === "staff") {
      const user = await getUtilisateurById(Number(session.id));
      if (!user) return res.status(401).json({ error: "Utilisateur introuvable." });
      if (user.permissions) {
        try {
          freshPermissions = JSON.parse(user.permissions);
        } catch {
        }
      }
    } else {
      const user = await getAdminById(Number(session.id));
      if (!user) return res.status(401).json({ error: "Utilisateur introuvable." });
      if (user.permissions) {
        try {
          freshPermissions = JSON.parse(user.permissions);
        } catch {
        }
      }
    }
    const token = await signToken({
      ...session,
      permissions: freshPermissions
    });
    setAuthCookie(res, token);
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth/refresh]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});
var auth_default = router;

// routes/admin/products.ts
var import_express2 = __toESM(require("express"));

// lib/admin-events.ts
var import_events = require("events");
var adminEmitter = globalThis.__adminEmitter ?? (globalThis.__adminEmitter = new import_events.EventEmitter().setMaxListeners(200));
function emitAdminEvent(type, payload) {
  adminEmitter.emit("admin", { type, ts: Date.now(), ...payload ?? {} });
}

// ../lib/admin-permissions.ts
function hasPageAccess(role, permissions, module2, pageId) {
  if (role === "super_admin") return true;
  if (!permissions) return false;
  const perm = permissions[module2];
  if (!perm) return false;
  if (perm === "all") return true;
  return perm.some((p) => pageId === p || pageId.startsWith(p + "/"));
}

// routes/admin/products.ts
init_db();
init_admin_db();

// lib/plan-limits.ts
var PLAN_LIMITS = {
  basic: 20,
  pro: Infinity,
  business: Infinity
};
function planLimit(plan) {
  return PLAN_LIMITS[plan] ?? 20;
}
function planLimitLabel(plan) {
  const limit = planLimit(plan);
  return limit === Infinity ? "illimit\xE9" : String(limit);
}

// routes/admin/products.ts
var router2 = import_express2.default.Router();
function validateImageUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  const u = url.trim();
  if (!u.startsWith("http")) return u;
  if (u.includes("cloudinary.com")) return u;
  throw new Error(`Image externe non autoris\xE9e : ${u}. Utilisez uniquement Cloudinary.`);
}
function validateImages(imgs) {
  if (!Array.isArray(imgs)) return [];
  return imgs.map((u) => {
    const v = validateImageUrl(u);
    return v ?? "";
  }).filter(Boolean);
}
router2.get("/api/admin/products/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [stockStats, statusCounts, totalCount] = await Promise.all([
      getStockStats(),
      getProductStatusCounts(),
      db.execute("SELECT COUNT(*) AS cnt FROM produits")
    ]);
    stockStats.en_stock = Number(totalCount[0][0]?.cnt ?? stockStats.en_stock);
    res.json({ stockStats, statusCounts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router2.get("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const q = req.query.q || void 0;
  const catId = req.query.category ? Number(req.query.category) : void 0;
  const brandId = req.query.brand ? Number(req.query.brand) : void 0;
  const entrepotId = req.query.entrepot_id ? Number(req.query.entrepot_id) : void 0;
  const statut = req.query.statut || void 0;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Number(req.query.limit) || 20);
  const offset = req.query.offset !== void 0 ? Number(req.query.offset) : (page - 1) * limit;
  const statutFilter = ["disponible", "faible", "epuise"].includes(statut ?? "") ? statut : void 0;
  const shopId = session.shop_id ?? 1;
  const [products, total] = await Promise.all([
    getProducts({ search: q, categoryId: catId, marqueId: brandId, limit, offset, statut: statutFilter, includeInactive: true, entrepotId, shopId }),
    getProductCount({ search: q, categoryId: catId, marqueId: brandId, statut: statutFilter, includeInactive: true, entrepotId, shopId })
  ]);
  const ids = products.map((p) => p.id).filter(Boolean);
  const variantStockMap = {};
  if (ids.length > 0) {
    try {
      const [vrows] = await db.query(
        `SELECT produit_id, COALESCE(SUM(stock), 0) AS variants_stock
         FROM product_variants
         WHERE produit_id IN (${ids.map(() => "?").join(",")})
         GROUP BY produit_id`,
        ids
      );
      for (const row of vrows) variantStockMap[row.produit_id] = Number(row.variants_stock);
    } catch {
    }
  }
  const enriched = products.map((p) => ({
    ...p,
    variants_stock: Object.prototype.hasOwnProperty.call(variantStockMap, p.id) ? variantStockMap[p.id] : null
  }));
  res.json({ products: enriched, total, page, limit });
});
router2.post("/api/admin/products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "products")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const body = req.body;
    const {
      nom,
      description,
      description_longue,
      categorie_id,
      marque_id,
      prix_unitaire,
      stock_magasin,
      stock_boutique,
      stock_minimum,
      remise,
      neuf,
      actif,
      image_url,
      images
    } = body;
    const reference = body.reference?.trim() || "";
    const autoRef = !reference;
    const rawSlug = body.slug?.trim() || "";
    const autoSlug = rawSlug ? rawSlug.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") : "";
    if (!nom || prix_unitaire == null) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }
    const shopId = session.shop_id ?? 1;
    const shop = await getShopById(shopId);
    const limit = planLimit(shop?.plan ?? "free");
    if (limit !== Infinity) {
      const [[countRow]] = await db.execute(
        "SELECT COUNT(*) AS cnt FROM produits WHERE shop_id = ?",
        [shopId]
      );
      const currentCount = Number(countRow.cnt ?? 0);
      if (currentCount >= limit) {
        return res.status(403).json({
          error: `Limite atteinte : votre plan ${shop?.plan ?? "free"} autorise ${limit} produits maximum. Passez \xE0 un plan sup\xE9rieur pour en ajouter.`,
          plan_limit: limit,
          current: currentCount
        });
      }
    }
    try {
      validateImageUrl(image_url);
      validateImages(images);
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Image invalide." });
    }
    const cleanImages = Array.isArray(images) ? images.filter((u) => typeof u === "string" && u.trim() !== "") : [];
    const imagesJson = cleanImages.length > 0 ? JSON.stringify(cleanImages) : null;
    const stockMagasin = Number(stock_magasin ?? 0);
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN description_longue TEXT NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN slug VARCHAR(255) NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_slug (slug)`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`);
    } catch {
    }
    invalidateProduitColsCache();
    const cols = await produitCols();
    const columns = ["reference", "nom", "description", "categorie_id", "prix_unitaire"];
    const values = [
      autoRef ? "PROD-TMP" : reference,
      nom,
      description ?? null,
      categorie_id ?? null,
      Number(prix_unitaire)
    ];
    columns.push("description_longue");
    values.push(description_longue?.trim() || null);
    if (cols.stock_magasin) {
      columns.push("stock_magasin");
      values.push(stockMagasin);
    }
    if (cols.stock_boutique) {
      columns.push("stock_boutique");
      values.push(Number(stock_boutique ?? 0));
    }
    if (cols.remise) {
      columns.push("remise");
      values.push(Number(remise ?? 0));
    }
    if (cols.neuf) {
      columns.push("neuf");
      values.push(neuf ? 1 : 0);
    }
    if (cols.stock_minimum) {
      columns.push("stock_minimum");
      values.push(Number(stock_minimum ?? 5));
    }
    columns.push("actif");
    values.push(actif !== false ? 1 : 0);
    if (cols.image_url) {
      columns.push("image_url");
      values.push(image_url ?? null);
    } else if (cols.image) {
      columns.push("image");
      values.push(image_url ?? null);
    }
    if (cols.marque_id && marque_id) {
      columns.push("marque_id");
      values.push(Number(marque_id));
    }
    columns.push("images_json");
    values.push(imagesJson);
    columns.push("slug");
    values.push(autoSlug || null);
    if (body.entrepot_id != null) {
      columns.push("entrepot_id");
      values.push(Number(body.entrepot_id) || null);
    }
    if (body.prix_entrepot != null) {
      columns.push("prix_entrepot");
      values.push(Number(body.prix_entrepot) || null);
    }
    columns.push("shop_id");
    values.push(shopId);
    const placeholders = columns.map(() => "?").join(",");
    const [result] = await db.execute(
      `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    const newId = result.insertId;
    if (autoRef) {
      await db.execute(
        "UPDATE produits SET reference = ? WHERE id = ?",
        [`PROD-${newId}`, newId]
      );
    }
    if (stockMagasin > 0) {
      try {
        await db.execute(
          `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note)
           VALUES (?, 'entree', ?, ?, 'Stock initial \xE0 la cr\xE9ation du produit')`,
          [newId, stockMagasin, stockMagasin]
        );
      } catch {
      }
    }
    emitAdminEvent("produit");
    return res.json({ ok: true, id: newId });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
function toSlug(name) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_\s]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
router2.post("/api/admin/products/generate-slugs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "generate_slugs")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  const pool2 = db;
  try {
    try {
      await pool2.execute(`ALTER TABLE produits ADD COLUMN slug VARCHAR(255) NULL`);
    } catch {
    }
    try {
      await pool2.execute(`ALTER TABLE produits ADD UNIQUE INDEX idx_produits_slug (slug)`);
    } catch {
    }
    const [rows] = await pool2.query(
      "SELECT id, nom, reference FROM produits WHERE slug IS NULL OR slug = ''"
    );
    let updated = 0;
    for (const row of rows) {
      const base2 = toSlug(row.nom || row.reference);
      if (!base2) continue;
      let slug = base2;
      let attempt = 0;
      for (; ; ) {
        const candidate = attempt === 0 ? slug : `${base2}_${attempt}`;
        const [dup] = await pool2.execute(
          "SELECT id FROM produits WHERE slug = ? AND id != ? LIMIT 1",
          [candidate, row.id]
        );
        if (dup.length === 0) {
          slug = candidate;
          break;
        }
        attempt++;
      }
      await pool2.execute("UPDATE produits SET slug = ? WHERE id = ?", [slug, row.id]);
      updated++;
    }
    emitAdminEvent("produit");
    res.json({ ok: true, updated });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router2.get("/api/admin/products/export", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "export_csv")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const q = req.query.q || void 0;
    const catId = req.query.category ? Number(req.query.category) : void 0;
    const brandId = req.query.brand ? Number(req.query.brand) : void 0;
    const statut = req.query.statut || void 0;
    const statutFilter = ["disponible", "faible", "epuise"].includes(statut ?? "") ? statut : void 0;
    const products = await getProducts({
      search: q,
      categoryId: catId,
      marqueId: brandId,
      statut: statutFilter,
      includeInactive: true,
      limit: 5e3,
      offset: 0
    });
    const escape = (v) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const headers = [
      "R\xE9f\xE9rence",
      "Nom",
      "Cat\xE9gorie",
      "Marque",
      "Prix",
      "Prix promo",
      "Stock magasin",
      "Stock boutique",
      "Stock minimum",
      "Statut",
      "Actif",
      "Cr\xE9\xE9 le"
    ];
    const rows = products.map((p) => {
      const prix = Number(p.prix_unitaire ?? 0);
      const remise = Number(p.remise ?? 0);
      const promo = remise > 0 ? Math.round(prix * (1 - remise / 100)) : "";
      const stMag = Number(p.stock_magasin ?? 0);
      const stBout = Number(p.stock_boutique ?? p.stock ?? 0);
      const stMin = Number(p.stock_minimum ?? 0);
      const statut2 = stMag === 0 ? "\xC9puis\xE9" : stMag <= stMin ? "Stock faible" : "Disponible";
      const actif = p.actif ? "Oui" : "Non";
      const date = p.created_at ? String(p.created_at).slice(0, 10) : "";
      return [
        p.reference,
        p.nom,
        p.categorie_nom ?? "",
        p.marque_nom ?? p.marque ?? "",
        prix,
        promo,
        stMag,
        stBout,
        stMin,
        statut2,
        actif,
        date
      ].map(escape).join(",");
    });
    const csv = [headers.map(escape).join(","), ...rows].join("\r\n");
    const filename = `produits_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router2.get("/api/admin/products/search", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const q = req.query.q || "";
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const products = await getProducts({ search: q, limit, includeInactive: false });
  res.json({ products });
});
router2.get("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [rows] = await db.query(
      "SELECT * FROM produits WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable." });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router2.patch("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN stock_minimum INT NULL DEFAULT 5`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN description_longue TEXT NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN entrepot_id INT UNSIGNED NULL`);
    } catch {
    }
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN prix_entrepot DECIMAL(10,2) NULL`);
    } catch {
    }
    invalidateProduitColsCache();
    const cols = await produitCols();
    const body = req.body;
    const sets = [];
    const vals = [];
    const alwaysAllowed = [
      "nom",
      "description",
      "description_longue",
      "categorie_id",
      "marque_id",
      "prix_unitaire",
      "stock_magasin",
      "stock_boutique",
      "remise",
      "neuf",
      "actif",
      "reference",
      "slug",
      "entrepot_id",
      "prix_entrepot"
    ];
    for (const key of alwaysAllowed) {
      if (key in body) {
        sets.push(`${key} = ?`);
        vals.push(body[key]);
      }
    }
    try {
      if ("image_url" in body || "image" in body) {
        const imgVal = "image_url" in body ? body.image_url : body.image;
        const safe = validateImageUrl(imgVal);
        const imgCol = cols.image_url ? "image_url" : cols.image ? "image" : null;
        if (imgCol) {
          sets.push(`${imgCol} = ?`);
          vals.push(safe ?? null);
        }
      }
      if (cols.images_json && "images_json" in body) {
        const parsed = typeof body.images_json === "string" ? JSON.parse(body.images_json) : body.images_json;
        const safe = validateImages(parsed);
        sets.push("images_json = ?");
        vals.push(safe.length > 0 ? JSON.stringify(safe) : null);
      }
      if ("images" in body) {
        const safe = validateImages(body.images);
        sets.push("images_json = ?");
        vals.push(safe.length > 0 ? JSON.stringify(safe) : null);
      }
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Image invalide." });
    }
    if (!sets.length) return res.json({ ok: true });
    vals.push(req.params.id);
    await db.execute(
      `UPDATE produits SET ${sets.join(", ")} WHERE id = ?`,
      vals
    );
    if ("stock_boutique" in body) {
      const newQty = Math.max(0, Number(body.stock_boutique ?? 0));
      const produitId = Number(req.params.id);
      try {
        const pool2 = db;
        await pool2.execute(
          `INSERT INTO boutique_stock (produit_id, quantite) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE quantite = VALUES(quantite), updated_at = NOW()`,
          [produitId, newQty]
        );
        await pool2.execute(
          `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, admin_id)
           VALUES (?, 'ajustement', ?, 'Modifi\xE9 via fiche produit', ?)`,
          [produitId, newQty, session.id]
        );
      } catch {
      }
    }
    emitAdminEvent("produit");
    const [refreshed] = await db.execute(
      "SELECT slug FROM produits WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    const savedSlug = refreshed[0]?.slug ?? null;
    res.json({ ok: true, slug: savedSlug });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router2.delete("/api/admin/products/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "delete_product")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  await db.execute(
    "DELETE FROM produits WHERE id = ?",
    [req.params.id]
  );
  emitAdminEvent("produit");
  res.json({ ok: true });
});
var products_default = router2;

// routes/admin/variants.ts
var import_express3 = __toESM(require("express"));
init_db();
var router3 = import_express3.default.Router();
var _variantsReady = false;
async function ensureTable() {
  if (_variantsReady) return;
  await db.execute(`
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
  for (const ddl of [
    "ALTER TABLE product_variants ADD COLUMN remise         DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE product_variants ADD COLUMN stock_boutique INT          NOT NULL DEFAULT 0",
    "ALTER TABLE product_variants ADD COLUMN reference_sku  VARCHAR(100)",
    "ALTER TABLE product_variants ADD COLUMN image_url      VARCHAR(500)"
  ]) {
    try {
      await db.execute(ddl);
    } catch (err) {
      if (err.code !== "ER_DUP_FIELDNAME") throw err;
    }
  }
  _variantsReady = true;
}
router3.get("/api/admin/products/:productId/variants", async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await db.execute(
      "SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC",
      [req.params.productId]
    );
    const variants = rows.map((r) => ({
      ...r,
      options: (() => {
        if (!r.options) return {};
        if (typeof r.options === "object") return r.options;
        try {
          return JSON.parse(r.options);
        } catch {
          return {};
        }
      })()
    }));
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router3.post("/api/admin/products/:productId/variants", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await ensureTable();
    const { nom, options, prix, remise, stock, stock_boutique, reference_sku, image_url } = req.body;
    const [result] = await db.execute(
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
        image_url || null
      ]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router3.put("/api/admin/products/:productId/variants/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await ensureTable();
    const { nom, options, prix, remise, stock, stock_boutique, reference_sku, image_url } = req.body;
    await db.execute(
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
        req.params.productId
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router3.patch("/api/admin/products/:productId/variants/:id/boutique-transfer", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const qty = Number(req.body.qty);
  if (!qty || qty <= 0) return res.status(400).json({ error: "qty requis > 0" });
  try {
    await ensureTable();
    const [[row]] = await db.execute(
      "SELECT stock, stock_boutique FROM product_variants WHERE id = ? AND produit_id = ?",
      [req.params.id, req.params.productId]
    );
    if (!row) return res.status(404).json({ error: "Variante introuvable" });
    const available = Number(row.stock);
    if (available < qty) return res.status(400).json({ error: `Stock magasin insuffisant (dispo: ${available})` });
    await db.execute(
      "UPDATE product_variants SET stock = stock - ?, stock_boutique = stock_boutique + ? WHERE id = ?",
      [qty, qty, req.params.id]
    );
    const [[updated]] = await db.execute(
      "SELECT stock, stock_boutique FROM product_variants WHERE id = ?",
      [req.params.id]
    );
    res.json({ ok: true, stock: Number(updated?.stock ?? 0), stock_boutique: Number(updated?.stock_boutique ?? 0) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router3.delete("/api/admin/products/:productId/variants/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await db.execute(
      "DELETE FROM product_variants WHERE id=? AND produit_id=?",
      [req.params.id, req.params.productId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var variants_default = router3;

// routes/admin/stock.ts
var import_express4 = __toESM(require("express"));
init_admin_db();
var router4 = import_express4.default.Router();
router4.get("/api/admin/stock/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const produits = await getProduitsWithStock();
    res.json({ produits });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router4.get("/api/admin/stock/entrepots", (_req, res) => {
  res.json({ entrepots: [] });
});
router4.get("/api/admin/stock/mouvements", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const type = req.query.type || void 0;
    const search = req.query.q || void 0;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const [{ items, total }, counts] = await Promise.all([
      getStockMovements({ type, search, limit, offset }),
      getStockMovementCounts()
    ]);
    res.json({ items, total, counts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router4.post("/api/admin/stock/entree", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { produit_id, quantite, reference, note, variant_id } = req.body;
    if (!produit_id || !quantite || quantite <= 0) {
      return res.status(400).json({ error: "produit_id et quantite (> 0) requis." });
    }
    await createStockEntree({
      produit_id,
      quantite: Number(quantite),
      reference,
      note,
      user_id: session.id,
      ...variant_id ? { variant_id: Number(variant_id) } : {}
    });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router4.post("/api/admin/stock/sortie", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { produit_id, quantite, reference, note, variant_id } = req.body;
    if (!produit_id || !quantite || quantite <= 0) {
      return res.status(400).json({ error: "produit_id et quantite (> 0) requis." });
    }
    await createStockSortie({
      produit_id,
      quantite: Number(quantite),
      reference,
      note,
      user_id: session.id,
      ...variant_id ? { variant_id: Number(variant_id) } : {}
    });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router4.post("/api/admin/stock/ajustement", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { produit_id, quantite, motif, variant_id } = req.body;
    if (!produit_id || quantite === void 0 || quantite === null) {
      return res.status(400).json({ error: "produit_id et quantite requis." });
    }
    if (!motif?.trim()) {
      return res.status(400).json({ error: "Un motif est requis pour un ajustement." });
    }
    await createStockAjustement({
      produit_id,
      quantite: Number(quantite),
      motif,
      user_id: session.id,
      ...variant_id ? { variant_id: Number(variant_id) } : {}
    });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var stock_default = router4;

// routes/admin/stock-boutique.ts
var import_express5 = __toESM(require("express"));
init_admin_db();
init_db();
var router5 = import_express5.default.Router();
router5.get("/api/admin/stock-boutique", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const q = req.query.q || void 0;
    const filter = req.query.filter || "all";
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const shopId = session.shop_id ?? 1;
    const [stats, { items, total }, movements, prodCount] = await Promise.all([
      getStockBoutiqueStats(shopId),
      getStockBoutiqueList({ search: q, filter, limit, offset, shopId }),
      getRecentBoutiqueMovements(20, shopId),
      db.execute("SELECT COUNT(*) AS cnt FROM produits WHERE shop_id = ?", [shopId])
    ]);
    stats.total_produits = Number(prodCount[0][0]?.cnt ?? stats.total_produits);
    res.json({ stats, items, total, movements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message.includes("doesn't exist") || message.includes("ER_NO_SUCH_TABLE")) {
      return res.status(503).json({ error: "migration_needed" });
    }
    res.status(500).json({ error: message });
  }
});
router5.post("/api/admin/stock-boutique/mouvement", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "boutique", "stock_ajustement")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const { produit_id, type, quantite, motif, ref_commande } = req.body;
    if (!produit_id || !type || !quantite) {
      return res.status(400).json({ error: "produit_id, type et quantite sont requis." });
    }
    if (!["entree", "sortie", "retrait", "ajustement"].includes(type)) {
      return res.status(400).json({ error: "Type de mouvement invalide." });
    }
    if (Number(quantite) <= 0) {
      return res.status(400).json({ error: "La quantit\xE9 doit \xEAtre sup\xE9rieure \xE0 0." });
    }
    await createBoutiqueMouvement({
      produit_id: Number(produit_id),
      type,
      quantite: Number(quantite),
      motif: motif || void 0,
      ref_commande: ref_commande || void 0,
      admin_id: session.id,
      shop_id: session.shop_id ?? 1
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
router5.get("/api/admin/stock-boutique/entrees", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const q = req.query.q || "";
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const shopId2 = session.shop_id ?? 1;
    const conditions = ["bm.type = 'entree'", "p.shop_id = ?"];
    const params = [shopId2];
    if (q) {
      conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const [rows] = await db.query(
      `SELECT bm.id, bm.produit_id, p.nom AS nom_produit, p.reference,
              bm.quantite, bm.motif, bm.ref_commande, bm.created_at
       FROM boutique_mouvements bm
       JOIN produits p ON p.id = bm.produit_id
       ${where}
       ORDER BY bm.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );
    const [cnt] = await db.query(
      `SELECT COUNT(*) AS cnt FROM boutique_mouvements bm JOIN produits p ON p.id = bm.produit_id ${where}`,
      params
    );
    res.json({ items: rows, total: Number(cnt[0]?.cnt ?? 0) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var stock_boutique_default = router5;

// routes/admin/ventes.ts
var import_express6 = __toESM(require("express"));

// lib/whatsapp.ts
init_admin_db();
var WA_API = "https://graph.facebook.com/v19.0";
function cleanPhone(num) {
  return num.replace(/[\s+\-()]/g, "");
}
async function sendWaTemplate({
  to,
  templateName,
  languageCode = "fr",
  bodyParams
}) {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token = await getSetting("wa_access_token");
    if (!phoneId || !token) {
      return { success: false, error: "Credentials WhatsApp non configur\xE9s" };
    }
    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone(to),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: bodyParams.length > 0 ? [{
          type: "body",
          parameters: bodyParams.map((text) => ({ type: "text", text }))
        }] : []
      }
    };
    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
async function sendWaText({
  to,
  body
}) {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token = await getSetting("wa_access_token");
    if (!phoneId || !token) {
      return { success: false, error: "Credentials WhatsApp non configur\xE9s" };
    }
    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone(to),
        type: "text",
        text: { body }
      })
    });
    const responseData = await res.json().catch(() => ({}));
    console.log("[sendWaText] to:", cleanPhone(to), "status:", res.status, "response:", JSON.stringify(responseData));
    if (!res.ok) {
      return { success: false, error: responseData?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
async function uploadWaMedia(buffer, mimeType, filename) {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);
    const res = await fetch(`${WA_API}/${phoneId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err?.error?.message ?? `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, mediaId: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
async function sendWaImage({
  to,
  mediaId,
  caption = ""
}) {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };
    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone(to),
        type: "image",
        image: { id: mediaId, caption }
      })
    });
    const responseData = await res.json().catch(() => ({}));
    console.log("[sendWaImage] to:", cleanPhone(to), "status:", res.status, "response:", JSON.stringify(responseData));
    if (!res.ok) {
      return { success: false, error: responseData?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
async function sendWaAudio({
  to,
  mediaId
}) {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };
    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone(to),
        type: "audio",
        audio: { id: mediaId }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
async function sendBoutiqueVenteNotif({
  telephone,
  nom,
  reference,
  total,
  montant_acompte,
  statut_paiement,
  items
}) {
  try {
    const [enabled, templateFull, templateAcompte, lang, siteUrl] = await Promise.all([
      getSetting("wa_boutique_vente_enabled"),
      getSetting("wa_boutique_vente_template_full"),
      getSetting("wa_boutique_vente_template_acompte"),
      getSetting("wa_order_lang"),
      getSetting("site_url")
    ]);
    if (enabled !== "1" || !telephone) return;
    const languageCode = lang || "fr";
    const baseUrl = (siteUrl || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://togolese.tg").replace(/\/$/, "");
    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
    const articlesList = items.map((i) => `${i.qty}x ${i.nom} - ${fmt(i.total)}`).join("\n");
    if (statut_paiement === "acompte" && templateAcompte) {
      const acompte = montant_acompte ?? 0;
      const resteAPayer = total - acompte;
      await sendWaTemplate({
        to: telephone,
        templateName: templateAcompte,
        languageCode,
        bodyParams: [nom, reference, articlesList, fmt(acompte), fmt(resteAPayer), baseUrl]
      });
    } else if (templateFull) {
      await sendWaTemplate({
        to: telephone,
        templateName: templateFull,
        languageCode,
        bodyParams: [nom, reference, articlesList, fmt(total), baseUrl]
      });
    }
  } catch (e) {
    console.error("[WA] sendBoutiqueVenteNotif error:", e);
  }
}
async function sendOrderNotifications({
  id,
  reference,
  nom,
  telephone,
  items,
  total
}) {
  try {
    const [
      clientEnabled,
      adminEnabled,
      clientTemplate,
      adminTemplate,
      adminNumber,
      adminNumber2,
      lang,
      siteUrl
    ] = await Promise.all([
      getSetting("wa_order_client_enabled"),
      getSetting("wa_order_admin_enabled"),
      getSetting("wa_order_client_template"),
      getSetting("wa_order_admin_template"),
      getSetting("wa_order_admin_number"),
      getSetting("wa_order_admin_number_2"),
      getSetting("wa_order_lang"),
      getSetting("site_url")
    ]);
    if (process.env.NODE_ENV !== "production") console.log(`[WA] sendOrderNotifications \u2014 ref=${reference} tel=${telephone}`);
    const languageCode = lang || "fr";
    const baseUrl = (siteUrl || process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
    const articlesStr = items.map((item) => {
      const name = item.nom || item.nom_produit || "Produit";
      const qty = item.qty ?? item.quantite ?? 1;
      const prix = item.total ?? (item.prix ? item.prix * qty : null);
      return prix ? `${qty}x ${name} - ${fmt(prix)}` : `${qty}x ${name}`;
    }).join(", ");
    const totalStr = new Intl.NumberFormat("fr-FR").format(total) + " FCFA";
    const trackingUrl = `${baseUrl}/suivi-commande?ref=${encodeURIComponent(reference)}`;
    const adminUrl = `${baseUrl}/admin/orders`;
    if (clientEnabled === "1" && clientTemplate && telephone) {
      const result = await sendWaTemplate({
        to: telephone,
        templateName: clientTemplate,
        languageCode,
        bodyParams: [nom, reference, articlesStr, totalStr, trackingUrl]
      });
      if (process.env.NODE_ENV !== "production") console.log(`[WA] Client notif result (${reference}):`, result);
    }
    if (adminEnabled === "1" && adminTemplate && adminNumber) {
      const result = await sendWaTemplate({
        to: adminNumber,
        templateName: adminTemplate,
        languageCode,
        bodyParams: [reference, nom, telephone, articlesStr, totalStr, adminUrl]
      });
      if (process.env.NODE_ENV !== "production") console.log(`[WA] Admin notif result (${reference}):`, result);
      if (adminNumber2 && adminNumber2 !== adminNumber) {
        await sendWaTemplate({
          to: adminNumber2,
          templateName: adminTemplate,
          languageCode,
          bodyParams: [reference, nom, telephone, articlesStr, totalStr, adminUrl]
        }).catch((e) => console.error(`[WA] Admin notif #2 error (${reference}):`, e));
      }
    }
  } catch (e) {
    console.error("[WA] sendOrderNotifications error:", e);
  }
}
async function sendWaDeliveryConfirmation(order) {
  try {
    const [enabled, templateName, lang] = await Promise.all([
      getSetting("wa_delivery_template_enabled"),
      getSetting("wa_delivery_template"),
      getSetting("wa_order_lang")
    ]);
    if (enabled !== "1" || !templateName || !order.telephone) return;
    const languageCode = lang || "fr";
    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
    let items = [];
    try {
      items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch {
      items = [];
    }
    const articlesStr = items.map((item) => {
      const name = item.nom || "Produit";
      const qty = item.qty ?? item.quantite ?? 1;
      const prix = item.total ?? (item.prix_unitaire ?? item.prix ?? 0) * qty;
      return `\u2022 ${qty}x ${name} \u2014 ${fmt(prix)}`;
    }).join("\n");
    const livraisonStr = order.delivery_fee > 0 ? `${order.zone_livraison || "Livraison"} \u2014 ${fmt(order.delivery_fee)}` : `${order.zone_livraison || "Livraison"} \u2014 Gratuit`;
    const result = await sendWaTemplate({
      to: order.telephone,
      templateName,
      languageCode,
      bodyParams: [
        order.nom,
        order.reference,
        articlesStr,
        livraisonStr,
        fmt(order.total)
      ]
    });
    if (!result.success) console.error("[WA] delivery confirmation failed:", result.error);
  } catch (e) {
    console.error("[WA] sendWaDeliveryConfirmation error:", e);
  }
}

// routes/admin/ventes.ts
init_admin_db();
var router6 = import_express6.default.Router();
router6.get("/api/admin/ventes/factures", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const search = req.query.q || void 0;
    const statut = req.query.statut || void 0;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const shopId = session.shop_id ?? 1;
    const [{ items, total }, ventesStats, financeStats, stockStats] = await Promise.all([
      listFactures({ search, statut, limit, offset, shopId }),
      getVentesStats(),
      getFinanceStats(shopId).catch(() => null),
      getStockBoutiqueStats(shopId).catch(() => null)
    ]);
    const stats = {
      ...ventesStats,
      total_recettes: financeStats?.total_recettes ?? 0,
      total_depenses: financeStats?.total_depenses ?? 0,
      solde_net: financeStats?.solde_net ?? 0,
      stock_produits: stockStats?.total_produits ?? 0,
      stock_epuises: stockStats?.epuises ?? 0
    };
    res.json({ items, total, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE")) {
      return res.status(503).json({ error: "migration_needed" });
    }
    res.status(500).json({ error: msg });
  }
});
router6.post("/api/admin/ventes/factures", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "boutique", "create_vente")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const body = req.body;
    if (!body.client_nom || !body.items?.length) {
      return res.status(400).json({ error: "client_nom et items sont requis." });
    }
    const { id, reference } = await createVenteWithStock({ ...body, admin_id: session.id, shop_id: session.shop_id ?? 1 });
    emitAdminEvent("vente");
    if (body.client_tel) {
      const rawItems = typeof body.items === "string" ? JSON.parse(body.items) : body.items ?? [];
      sendBoutiqueVenteNotif({
        telephone: body.client_tel,
        nom: body.client_nom,
        reference,
        total: Number(body.total ?? 0),
        montant_acompte: body.montant_acompte ? Number(body.montant_acompte) : null,
        statut_paiement: body.statut_paiement ?? null,
        items: rawItems.map((i) => ({
          nom: i.nom ?? "Produit",
          qty: i.qty ?? 1,
          total: i.total ?? 0
        }))
      }).catch(console.error);
    }
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router6.get("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const facture = await getFactureById(Number(req.params.id));
  if (!facture) return res.status(404).json({ error: "Introuvable." });
  res.json(facture);
});
router6.patch("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const isPayment = req.body?.montant_paiement !== void 0;
  const requiredPerm = isPayment ? "add_paiement" : "edit_vente";
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "boutique", requiredPerm)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const { statut, statut_paiement, mode_paiement, montant_acompte, montant_paiement } = req.body;
    if (statut && !statut_paiement && !mode_paiement && montant_acompte === void 0) {
      await updateFactureStatut(Number(req.params.id), statut);
    } else {
      await updateFacture(Number(req.params.id), {
        statut,
        statut_paiement,
        mode_paiement,
        montant_acompte,
        montant_paiement: montant_paiement ? Number(montant_paiement) : void 0,
        admin_id: session.id,
        shop_id: session.shop_id ?? 1
      });
    }
    emitAdminEvent("vente");
    res.json({ ok: true, vendeur: session.nom });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router6.delete("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "boutique", "delete_vente")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  await deleteFacture(Number(req.params.id));
  res.json({ ok: true });
});
router6.get("/api/admin/ventes/devis", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const search = req.query.q || void 0;
    const statut = req.query.statut || void 0;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const { items, total } = await listDevis({ search, statut, limit, offset, shopId: session.shop_id ?? 1 });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router6.post("/api/admin/ventes/devis", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const body = req.body;
    if (!body.client_nom || !body.items?.length) {
      return res.status(400).json({ error: "client_nom et items sont requis." });
    }
    const id = await createDevis({ ...body, admin_id: session.id, shop_id: session.shop_id ?? 1 });
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router6.get("/api/admin/ventes/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const { items, total } = await listLivraisons({ limit, offset, shopId: session.shop_id ?? 1 });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var ventes_default = router6;

// routes/admin/livraisons.ts
var import_express7 = __toESM(require("express"));
init_admin_db();
var router7 = import_express7.default.Router();
router7.get("/api/admin/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const search = req.query.q || void 0;
  const statut = req.query.statut || void 0;
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const [{ items, total }, stats] = await Promise.all([
    listLivraisonsAdmin({ search, statut, limit, offset }),
    getLivraisonsStats()
  ]);
  res.json({ items, total, stats });
});
router7.post("/api/admin/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { client_nom, client_tel, adresse, contact_livraison, lien_localisation, note } = req.body;
    if (!client_nom?.trim()) return res.status(400).json({ error: "Nom du client requis." });
    const id = await createManualLivraison({ client_nom, client_tel, adresse, contact_livraison, lien_localisation, note });
    emitAdminEvent("livraison");
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router7.patch("/api/admin/livraisons/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await updateLivraisonAdmin(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router7.delete("/api/admin/livraisons/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteLivraison(Number(req.params.id));
  res.json({ ok: true });
});
router7.get("/api/admin/livreurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const livreurs = await listLivreurs();
  res.json({ items: livreurs });
});
router7.post("/api/admin/livreurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { nom, telephone, numero_plaque } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: "nom requis." });
    const livreur = await createLivreur({ nom: nom.trim(), telephone, numero_plaque: numero_plaque?.trim() || void 0 });
    res.json({ ok: true, livreur });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router7.patch("/api/admin/livreurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await updateLivreur(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router7.delete("/api/admin/livreurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteLivreur(Number(req.params.id));
  res.json({ ok: true });
});
var livraisons_default = router7;

// routes/admin/finance.ts
var import_express8 = __toESM(require("express"));
init_admin_db();
init_db();
var router8 = import_express8.default.Router();
router8.get("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const type = req.query.type || void 0;
    const search = req.query.q || void 0;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const shopId = session.shop_id ?? 1;
    const [{ items, total }, stats] = await Promise.all([
      listFinanceEntries({ type, search, limit, offset, shopId }),
      getFinanceStats(shopId)
    ]);
    res.json({ items, total, stats });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router8.post("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { type, mode_paiement, compte_destination, categorie, description, montant, date_entree } = req.body;
    if (!type || !montant || !date_entree) {
      return res.status(400).json({ error: "type, montant et date_entree sont requis." });
    }
    if (type === "transfert" && !compte_destination) {
      return res.status(400).json({ error: "compte_destination requis pour un transfert." });
    }
    const admin_id = typeof session.id === "number" ? session.id : void 0;
    const admin_nom = typeof session.nom === "string" ? session.nom : void 0;
    const id = await createFinanceEntry({ type, mode_paiement, compte_destination, categorie, description, montant: Number(montant), date_entree, admin_id, admin_nom, shop_id: session.shop_id ?? 1 });
    emitAdminEvent("finance");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router8.patch("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await updateFinanceEntry(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router8.delete("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await deleteFinanceEntry(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
async function recoverMixByYasEntries() {
  try {
    const [rows] = await db.execute(`
      SELECT fp.montant, fp.created_at, f.reference, f.client_nom
      FROM facture_paiements fp
      JOIN factures f ON f.id = fp.facture_id
      WHERE fp.mode_paiement = 'mix_by_yas'
        AND NOT EXISTS (
          SELECT 1 FROM finance_entries fe
          WHERE fe.description LIKE CONCAT('%', CONVERT(f.reference USING utf8mb4) COLLATE utf8mb4_unicode_ci, '%')
            AND fe.mode_paiement = 'mix_by_yas'
        )
    `);
    for (const row of rows) {
      await createFinanceEntry({
        type: "vente",
        mode_paiement: "mix_by_yas",
        categorie: "Vente boutique",
        description: `Paiement ${row.reference} \u2013 ${row.client_nom}`,
        montant: Number(row.montant),
        date_entree: new Date(row.created_at).toISOString().slice(0, 10)
      });
    }
    console.log(`[finance] recoverMixByYas: ${rows.length} entr\xE9e(s) trouv\xE9e(s) et r\xE9cup\xE9r\xE9e(s).`);
  } catch (err) {
    console.error("[finance/recoverMixByYas]", err);
  }
}
async function recoverCouponFinanceEntries() {
  try {
    const [rows] = await db.execute(`
      SELECT o.id, o.reference, o.total, o.coupon_remise, o.finance_entry_id,
             fe.montant AS entry_montant
      FROM orders o
      JOIN finance_entries fe ON fe.id = o.finance_entry_id
      WHERE o.coupon_remise > 0
        AND ABS(fe.montant - (o.total - o.coupon_remise)) > 0.01
    `);
    for (const row of rows) {
      const correct = Number(row.total) - Number(row.coupon_remise);
      await db.execute("UPDATE finance_entries SET montant = ? WHERE id = ?", [correct, row.finance_entry_id]);
    }
    console.log(`[finance] recoverCoupon: ${rows.length} entr\xE9e(s) corrig\xE9e(s).`);
  } catch (err) {
    console.error("[finance/recoverCoupon]", err);
  }
}
router8.delete("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await db.execute("TRUNCATE TABLE finance_entries");
    emitAdminEvent("finance");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var finance_default = router8;

// routes/admin/clients.ts
var import_express9 = __toESM(require("express"));
init_admin_db();
var router9 = import_express9.default.Router();
router9.get("/api/admin/clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const page = Math.max(1, Number(req.query.page) ?? 1);
  const limit = 30;
  const offset = (page - 1) * limit;
  const search = req.query.q ?? "";
  const stats = req.query.stats === "1";
  if (stats) {
    try {
      const crmStats = await getCRMStats();
      return res.json({ success: true, data: crmStats });
    } catch {
      return res.json({ success: true, data: { newClients30d: 0, topClients: [] } });
    }
  }
  try {
    const [clients, total] = await Promise.all([
      listClients(limit, offset, search),
      countClients(search)
    ]);
    res.json({ success: true, data: clients, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("doesn't exist") || msg.includes("Unknown column")) {
      return res.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    }
    res.status(500).json({ error: msg });
  }
});
router9.post("/api/admin/clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!req.body.telephone?.trim()) {
    return res.status(400).json({ error: "T\xE9l\xE9phone requis." });
  }
  const id = await upsertClient(req.body);
  res.json({ success: true, id });
});
router9.get("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const client = await getClientById(Number(req.params.id));
  if (!client) return res.status(404).json({ error: "Client introuvable." });
  const [orders, clientStats] = await Promise.all([
    getClientOrders(client.telephone),
    getClientStats(client.telephone)
  ]);
  res.json({ success: true, data: { client, orders, stats: clientStats } });
});
router9.put("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const client = await getClientById(Number(req.params.id));
  if (!client) return res.status(404).json({ error: "Client introuvable." });
  await upsertClient({ ...req.body, telephone: client.telephone });
  res.json({ success: true });
});
router9.delete("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (session.role !== "super_admin") return res.status(403).json({ error: "Droits insuffisants." });
  await deleteClient(Number(req.params.id));
  res.json({ success: true });
});
var clients_default = router9;

// routes/admin/orders.ts
var import_express10 = __toESM(require("express"));
init_db();
init_admin_db();
var _paymentColReady = false;
async function ensurePaymentColumn() {
  if (_paymentColReady) return;
  try {
    await db.execute(
      "ALTER TABLE orders ADD COLUMN statut_paiement VARCHAR(50) NULL DEFAULT 'non_paye'"
    );
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") throw err;
  }
  _paymentColReady = true;
}
var router10 = import_express10.default.Router();
router10.get("/api/admin/orders", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const shopId = session.shop_id ?? 1;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([listOrders(limit, offset, shopId), countOrders(shopId)]);
  res.json({ success: true, data: orders, total, page, limit });
});
router10.post("/api/admin/orders", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { nom, telephone, adresse, zone_livraison, delivery_fee, note, items } = req.body;
  if (!telephone?.trim() || !items?.length) {
    return res.status(400).json({ error: "T\xE9l\xE9phone et articles requis." });
  }
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = subtotal + Number(delivery_fee ?? 0);
  const id = await createOrder({ nom, telephone, adresse, zone_livraison, delivery_fee: Number(delivery_fee ?? 0), note, items, subtotal, total, shop_id: session.shop_id ?? 1 });
  await addOrderEvent(id, "pending", "Commande cr\xE9\xE9e par l'admin", session.nom);
  const [rows] = await db.execute(
    "SELECT reference, created_at FROM orders WHERE id = ? LIMIT 1",
    [id]
  );
  emitAdminEvent("commande", {
    id,
    reference: rows[0]?.reference ?? `CMD-${id}`,
    nom: nom ?? "",
    total,
    created_at: String(rows[0]?.created_at ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "))
  });
  res.json({ success: true, id });
});
router10.get("/api/admin/orders/clients-search", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const q = (req.query.q ?? "").trim();
  if (!q || q.length < 2) return res.json({ data: [] });
  try {
    const [rows] = await db.query(
      `SELECT nom, telephone, adresse
       FROM orders
       WHERE nom LIKE ? OR telephone LIKE ?
       GROUP BY nom, telephone, adresse
       ORDER BY MAX(created_at) DESC
       LIMIT 8`,
      [`%${q}%`, `%${q}%`]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router10.get("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const order = await getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ success: true, data: order });
});
router10.patch("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const id = Number(req.params.id);
  if (req.body.status !== void 0 && req.body.field !== "update") {
    const { status, note } = req.body;
    await updateOrderStatus(id, status);
    await addOrderEvent(id, status, note ?? "", session.nom);
    const actor = { id: typeof session.id === "number" ? session.id : void 0, nom: session.nom };
    await ensureOrderVente(id, actor).catch((e) => console.error("[orders] ensureOrderVente failed:", e));
    if (["delivered", "livree", "livr\xE9e", "livre", "livr\xE9"].includes(String(status))) {
      await applyOrderDeliveredEffects(id, session.nom).catch((e) => console.error("[orders] applyDelivered failed:", e));
      await ensureOrderVente(id, actor);
      await db.execute(
        `UPDATE factures SET statut_paiement = 'paye_total', statut = 'paye'
         WHERE order_id = ? AND statut != 'annule'`,
        [id]
      ).catch(() => {
      });
      invalidateVentesStats();
      const [[orderRow]] = await db.execute(
        "SELECT nom, telephone, reference, items, zone_livraison, delivery_fee, total FROM orders WHERE id = ? LIMIT 1",
        [id]
      );
      if (orderRow) {
        sendWaDeliveryConfirmation({
          nom: orderRow.nom,
          telephone: orderRow.telephone,
          reference: orderRow.reference,
          items: orderRow.items,
          zone_livraison: orderRow.zone_livraison,
          delivery_fee: Number(orderRow.delivery_fee ?? 0),
          total: Number(orderRow.total ?? 0)
        }).catch(() => {
        });
      }
      emitAdminEvent("stock");
    }
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }
  if (req.body.field === "payment") {
    await ensurePaymentColumn();
    const { payment_status } = req.body;
    await updateOrderFields(id, { statut_paiement: payment_status });
    const [[orderRow]] = await db.execute(
      "SELECT vente_facture_id FROM orders WHERE id = ? LIMIT 1",
      [id]
    );
    if (orderRow?.vente_facture_id) {
      const facturePaiement = payment_status === "paye" ? "paye_total" : payment_status;
      await db.execute(
        "UPDATE factures SET statut_paiement = ? WHERE id = ?",
        [facturePaiement, orderRow.vente_facture_id]
      );
    }
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }
  if (req.body.field === "confirm_mm") {
    await ensurePaymentColumn();
    await updateOrderFields(id, { statut_paiement: "paye" });
    const [[mmOrderRow]] = await db.execute(
      "SELECT vente_facture_id FROM orders WHERE id = ? LIMIT 1",
      [id]
    );
    if (mmOrderRow?.vente_facture_id) {
      await db.execute(
        "UPDATE factures SET statut_paiement = 'paye_total' WHERE id = ?",
        [mmOrderRow.vente_facture_id]
      );
    }
    await addOrderEvent(id, "confirm\xE9e", "Paiement Mobile Money v\xE9rifi\xE9 et confirm\xE9", session.nom);
    emitAdminEvent("finance");
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }
  if (req.body.field === "update") {
    const { nom, telephone, adresse, zone_livraison, note, delivery_fee, items, lien_localisation } = req.body;
    const parsedItems = Array.isArray(items) ? items : [];
    const subtotal = parsedItems.reduce((s, i) => s + i.total, 0);
    const deliveryFee = Number(delivery_fee ?? 0);
    const total = subtotal + deliveryFee;
    await updateOrderFields(id, {
      nom,
      telephone,
      adresse,
      zone_livraison,
      note,
      delivery_fee: deliveryFee,
      subtotal,
      total,
      items: JSON.stringify(parsedItems),
      lien_localisation: lien_localisation ?? null
    });
    await addOrderEvent(id, "modifi\xE9e", "Commande modifi\xE9e par l'admin", session.nom);
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: "Action non reconnue." });
});
router10.delete("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  await deleteOrder(Number(req.params.id));
  res.json({ ok: true });
});
var orders_default = router10;

// routes/admin/upload.ts
var import_express11 = __toESM(require("express"));
var import_cloudinary = require("cloudinary");
var MAX_SIZE = 10 * 1024 * 1024;
function detectMimeFromBuffer(buf) {
  if (buf.length < 4) return null;
  if (buf[0] === 255 && buf[1] === 216 && buf[2] === 255) return "image/jpeg";
  if (buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71) return "image/png";
  if (buf[0] === 71 && buf[1] === 73 && buf[2] === 70 && buf[3] === 56) return "image/gif";
  if (buf.length >= 12 && buf[0] === 82 && buf[1] === 73 && buf[2] === 70 && buf[3] === 70 && buf[8] === 87 && buf[9] === 69 && buf[10] === 66 && buf[11] === 80) return "image/webp";
  return null;
}
var router11 = import_express11.default.Router();
async function uploadToCloudinary(buffer, _clientType) {
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  if (buffer.length > MAX_SIZE) throw new Error("Fichier trop volumineux (max 10 Mo)");
  const realMime = detectMimeFromBuffer(buffer);
  if (!realMime) throw new Error("Format de fichier non reconnu. Utilisez JPEG, PNG, WebP ou GIF.");
  return new Promise((resolve2, reject) => {
    const stream = import_cloudinary.v2.uploader.upload_stream(
      { folder: "togolese-shop", resource_type: "image", format: "webp", quality: "auto" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload \xE9chou\xE9"));
        else resolve2(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
router11.post("/api/admin/upload", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { files: rawFiles, file: rawFile } = req.body;
  const filesToProcess = rawFiles?.length ? rawFiles : rawFile ? [rawFile] : [];
  if (!filesToProcess.length) {
    return res.status(400).json({ error: "Aucun fichier re\xE7u." });
  }
  const results = [];
  for (const f of filesToProcess) {
    try {
      const buffer = Buffer.from(f.data.replace(/^data:[^;]+;base64,/, ""), "base64");
      results.push({ url: await uploadToCloudinary(buffer, f.type) });
    } catch (err) {
      results.push({ url: "", error: err instanceof Error ? err.message : "Erreur upload" });
    }
  }
  const allOk = results.every((r) => !r.error);
  res.status(allOk ? 200 : 207).json({
    success: allOk,
    urls: results.map((r) => r.url),
    errors: results.filter((r) => r.error).map((r) => r.error)
  });
});
var upload_default = router11;

// routes/admin/settings.ts
var import_express12 = __toESM(require("express"));
init_admin_db();

// lib/vercel-domains.ts
var TOKEN = process.env.VERCEL_TOKEN;
var PROJECT_ID = process.env.VERCEL_PROJECT_ID;
var TEAM_ID = process.env.VERCEL_TEAM_ID;
function vercelApi(path, opts = {}) {
  const teamParam = TEAM_ID ? `?teamId=${TEAM_ID}` : "";
  return fetch(`https://api.vercel.com${path}${teamParam}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...opts.headers ?? {}
    }
  });
}
async function addVercelDomain(domain) {
  if (!TOKEN || !PROJECT_ID) {
    console.warn("[vercel-domains] VERCEL_TOKEN or VERCEL_PROJECT_ID not set \u2014 skipping");
    return { ok: true };
  }
  try {
    const res = await vercelApi(`/v10/projects/${PROJECT_ID}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain })
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) return { ok: true };
      return { ok: false, error: data?.error?.message ?? `Vercel error ${res.status}` };
    }
    if (data.verification?.length) {
      return { ok: true, verification: data.verification };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Vercel API unreachable" };
  }
}
async function removeVercelDomain(domain) {
  if (!TOKEN || !PROJECT_ID) return;
  try {
    await vercelApi(`/v10/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}`, {
      method: "DELETE"
    });
  } catch {
  }
}
async function checkVercelDomain(domain) {
  if (!TOKEN || !PROJECT_ID) return { configured: true };
  try {
    const res = await vercelApi(`/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}`);
    const data = await res.json();
    if (!res.ok) return { configured: false };
    return {
      configured: data.verified ?? false,
      verification: data.verification ?? []
    };
  } catch {
    return { configured: false };
  }
}

// routes/admin/settings.ts
var router12 = import_express12.default.Router();
router12.get("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const settings = await getSettings(session.shop_id ?? 1);
  res.json(settings);
});
router12.post("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  await setSettings(req.body, session.shop_id ?? 1);
  res.json({ ok: true });
});
router12.get("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const shop = await getShopById(shopId);
    if (!shop) return res.status(404).json({ error: "Boutique introuvable." });
    let vercel = { configured: false };
    if (shop.custom_domain) {
      vercel = await checkVercelDomain(shop.custom_domain);
    }
    res.json({
      custom_domain: shop.custom_domain ?? null,
      slug: shop.slug,
      vercel
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router12.post("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const raw = String(req.body.domain ?? "").trim().toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "");
    const domain = raw.split("/")[0];
    if (!domain) return res.status(400).json({ error: "Domaine requis." });
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
      return res.status(400).json({ error: "Format de domaine invalide." });
    }
    const shop = await getShopById(shopId);
    if (shop?.custom_domain && shop.custom_domain !== domain) {
      await removeVercelDomain(shop.custom_domain);
    }
    const vercelResult = await addVercelDomain(domain);
    if (!vercelResult.ok) {
      return res.status(400).json({ error: `Vercel: ${vercelResult.error}` });
    }
    await setShopDomain(shopId, domain);
    res.json({
      ok: true,
      domain,
      verification: vercelResult.verification ?? []
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    if (msg.includes("Duplicate entry")) {
      return res.status(409).json({ error: "Ce domaine est d\xE9j\xE0 utilis\xE9 par une autre boutique." });
    }
    res.status(500).json({ error: msg });
  }
});
router12.delete("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const shop = await getShopById(shopId);
    if (shop?.custom_domain) {
      await removeVercelDomain(shop.custom_domain);
    }
    await setShopDomain(shopId, null);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var settings_default = router12;

// routes/admin/fournisseurs.ts
var import_express13 = __toESM(require("express"));
init_admin_db();
var router13 = import_express13.default.Router();
router13.get("/api/admin/fournisseurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const fournisseurs = await listFournisseurs(session.shop_id ?? 1);
  res.json({ fournisseurs });
});
router13.post("/api/admin/fournisseurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { nom, contact, telephone, email, adresse, note } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: "Le nom est obligatoire." });
    const id = await createFournisseur({ nom, contact, telephone, email, adresse, note }, session.shop_id ?? 1);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router13.patch("/api/admin/fournisseurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await updateFournisseur(Number(req.params.id), req.body, session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router13.delete("/api/admin/fournisseurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteFournisseur(Number(req.params.id), session.shop_id ?? 1);
  res.json({ ok: true });
});
router13.get("/api/admin/achats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const shopId = session.shop_id ?? 1;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const [achats, total, stats] = await Promise.all([listAchats(shopId, limit, offset), countAchats(shopId), getAchatStats(shopId)]);
  res.json({ achats, total, stats, page, limit });
});
router13.post("/api/admin/achats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { fournisseur_id, reference, date_achat, statut, note, transport, items } = req.body;
    if (!date_achat) return res.status(400).json({ error: "La date est obligatoire." });
    if (!items?.length) return res.status(400).json({ error: "Au moins un article est requis." });
    const id = await createAchat({ fournisseur_id: fournisseur_id ?? null, reference: reference || void 0, date_achat, statut: statut ?? "en_attente", note: note ?? null, transport: transport ?? null, items }, session.shop_id ?? 1);
    emitAdminEvent("achat");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router13.get("/api/admin/achats/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const achat = await getAchatById(Number(req.params.id), session.shop_id ?? 1);
  if (!achat) return res.status(404).json({ error: "Achat introuvable." });
  res.json({ achat });
});
router13.patch("/api/admin/achats/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const id = Number(req.params.id);
    const shopId = session.shop_id ?? 1;
    if (req.body.action === "recevoir") {
      await recevoirAchat(id, shopId);
    } else {
      await updateAchat(id, req.body, shopId);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router13.delete("/api/admin/achats/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await deleteAchat(Number(req.params.id), session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var fournisseurs_default = router13;

// routes/admin/categories.ts
var import_express14 = __toESM(require("express"));
init_admin_db();
var router14 = import_express14.default.Router();
router14.get("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const categories = await listAdminCategories(session.shop_id ?? 1);
  res.json({ success: true, data: categories });
});
router14.post("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) return res.status(403).json({ error: "Droits insuffisants." });
  const { nom, description = "" } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createCategory(nom.trim(), description.trim(), session.shop_id ?? 1);
  res.json({ success: true, id });
});
router14.patch("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { nom, description = "" } = req.body;
  await updateCategory(Number(req.params.id), nom?.trim() ?? "", description?.trim() ?? "", session.shop_id ?? 1);
  res.json({ success: true });
});
router14.delete("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteCategory(Number(req.params.id), session.shop_id ?? 1);
  res.json({ success: true });
});
router14.get("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const marques = await listAdminMarques(session.shop_id ?? 1);
  res.json({ success: true, data: marques });
});
router14.post("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { nom, description = "" } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createMarque({ nom: nom.trim(), description: description.trim() }, session.shop_id ?? 1);
  res.json({ success: true, id });
});
router14.patch("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await updateMarque(Number(req.params.id), req.body, session.shop_id ?? 1);
  res.json({ success: true });
});
router14.delete("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteMarque(Number(req.params.id), session.shop_id ?? 1);
  res.json({ success: true });
});
var categories_default = router14;

// routes/admin/boutique-clients.ts
var import_express15 = __toESM(require("express"));
init_admin_db();
init_db();
var router15 = import_express15.default.Router();
router15.get("/api/admin/boutique-clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;
  const search = req.query.q ?? "";
  const filtre = req.query.filtre ?? "tous";
  const stats = req.query.stats === "1";
  const shopId = session.shop_id ?? 1;
  if (stats) {
    try {
      const data = await getBoutiqueClientsStats(shopId);
      return res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("doesn't exist")) return res.json({ success: true, data: null, _migrationNeeded: true });
      return res.status(500).json({ error: msg });
    }
  }
  try {
    const [clients, total] = await Promise.all([
      listBoutiqueClients(limit, offset, search, filtre, shopId),
      countBoutiqueClients(search, filtre, shopId)
    ]);
    res.json({ success: true, data: clients, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("doesn't exist")) return res.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    res.status(500).json({ error: msg });
  }
});
router15.get("/api/admin/boutique-clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const shopId = session.shop_id ?? 1;
    const client = await getBoutiqueClientById(Number(req.params.id), shopId);
    if (!client) return res.status(404).json({ error: "Client introuvable." });
    const factures = await getClientFacturesByNom(client.nom, client.telephone);
    res.json({ client, factures });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router15.post("/api/admin/boutique-clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!req.body.nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  if (!req.body.telephone?.trim()) return res.status(400).json({ error: "T\xE9l\xE9phone requis." });
  const shopId = session.shop_id ?? 1;
  const [[existing]] = await db.execute(
    "SELECT id FROM boutique_clients WHERE telephone = ? AND shop_id = ? LIMIT 1",
    [req.body.telephone.trim(), shopId]
  );
  if (existing) return res.status(400).json({ error: "Un client avec ce num\xE9ro existe d\xE9j\xE0." });
  const id = await createBoutiqueClient({ ...req.body, shop_id: shopId });
  res.json({ success: true, id });
});
router15.patch("/api/admin/boutique-clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await updateBoutiqueClient(Number(req.params.id), req.body, session.shop_id ?? 1);
  res.json({ success: true });
});
router15.delete("/api/admin/boutique-clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  await deleteBoutiqueClient(Number(req.params.id), session.shop_id ?? 1);
  res.json({ success: true });
});
var boutique_clients_default = router15;

// routes/admin/newsletter.ts
var import_express16 = __toESM(require("express"));
init_admin_db();
var router16 = import_express16.default.Router();
router16.get("/api/admin/newsletter", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const subscribers = await listNewsletterSubscribers();
    res.json({ subscribers });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});
router16.delete("/api/admin/newsletter", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID manquant." });
    await deleteNewsletterSubscriber(Number(id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});
var newsletter_default = router16;

// routes/admin/schema.ts
var import_express17 = __toESM(require("express"));
init_db();
var router17 = import_express17.default.Router();
router17.get("/api/admin/schema/columns", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const table = req.query.table || "produits";
  const [cols] = await db.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const names = new Set(cols.map((r) => r.COLUMN_NAME.toLowerCase()));
  res.json({
    columns: cols,
    hasRemise: names.has("remise"),
    hasNeuf: names.has("neuf"),
    hasImagesJson: names.has("images_json")
  });
});
router17.post("/api/admin/schema/migrate", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const results = {};
  try {
    const [cols] = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const names = new Set(cols.map((r) => r.COLUMN_NAME.toLowerCase()));
    if (!names.has("images_json")) {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
      results.images_json = "colonne ajout\xE9e";
    } else {
      results.images_json = "d\xE9j\xE0 pr\xE9sente";
    }
    if (!names.has("variations_json")) {
      await db.execute(`ALTER TABLE produits ADD COLUMN variations_json TEXT NULL`);
      results.variations_json = "colonne ajout\xE9e";
    } else {
      results.variations_json = "d\xE9j\xE0 pr\xE9sente";
    }
    invalidateProduitColsCache();
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
var schema_default = router17;

// routes/admin/events.ts
var import_express18 = __toESM(require("express"));
var router18 = import_express18.default.Router();
function sseSetup(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}
var HEARTBEAT_MS = 75e3;
var AUTO_CLOSE_MS = 5 * 6e4;
router18.get("/api/admin/sse", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end("Non autoris\xE9");
  sseSetup(res);
  res.write(`data: ${JSON.stringify({ type: "connected" })}

`);
  const handler = (event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}

`);
    } catch {
    }
  };
  adminEmitter.on("admin", handler);
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      cleanup();
    }
  }, HEARTBEAT_MS);
  const autoClose = setTimeout(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "reconnect" })}

`);
    } catch {
    }
    cleanup();
    res.end();
  }, AUTO_CLOSE_MS);
  function cleanup() {
    clearInterval(heartbeat);
    clearTimeout(autoClose);
    adminEmitter.off("admin", handler);
  }
  req.on("close", () => {
    cleanup();
    res.end();
  });
});
router18.get("/api/admin/events", async (req, res) => res.redirect(307, "/api/admin/sse"));
router18.get("/api/admin/orders/sse", async (req, res) => res.redirect(307, "/api/admin/sse"));
var events_default = router18;

// routes/admin/users.ts
var import_express19 = __toESM(require("express"));
var import_bcryptjs2 = __toESM(require("bcryptjs"));
init_admin_db();
var router19 = import_express19.default.Router();
async function requireSuperAdmin(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Non autoris\xE9." });
    return null;
  }
  if (session.role !== "super_admin") {
    try {
      const dbUser = await getAdminById(session.id);
      if (!dbUser || dbUser.role !== "super_admin") {
        res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 au super admin." });
        return null;
      }
    } catch {
      res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 au super admin." });
      return null;
    }
  }
  return session;
}
router19.get("/api/admin/users", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const users = await listAdminUsers();
  res.json({ users });
});
router19.post("/api/admin/users", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { nom, username, email, telephone, poste, password, role } = req.body;
    if (!nom || !username || !password) {
      return res.status(400).json({ error: "Nom, nom d'utilisateur et mot de passe requis." });
    }
    const existing = await getAdminByUsername(username.trim().toLowerCase());
    if (existing) return res.status(409).json({ error: "Ce nom d'utilisateur est d\xE9j\xE0 utilis\xE9." });
    const hash = await import_bcryptjs2.default.hash(password, 12);
    await createAdminUser({
      nom,
      username: username.trim().toLowerCase(),
      email: email || null,
      telephone: telephone || null,
      poste: poste || "staff",
      password_hash: hash,
      role: role === "super_admin" ? "super_admin" : poste === "Livreur" ? "livreur" : "admin",
      must_change_password: true
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.patch("/api/admin/users/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const targetId = Number(req.params.id);
  const isSelf = session.id === targetId;
  const isSuperAdmin = session.role === "super_admin";
  if (!isSuperAdmin && !isSelf) return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  try {
    const { password, permissions, ...rest } = req.body;
    if (password) {
      const hash = await import_bcryptjs2.default.hash(String(password), 12);
      await updateAdminPassword(targetId, hash);
    }
    if (isSuperAdmin) {
      const updateData = {};
      if (rest.nom !== void 0) updateData.nom = String(rest.nom);
      if (rest.username !== void 0) updateData.username = String(rest.username).trim().toLowerCase();
      if (rest.email !== void 0) updateData.email = rest.email ? String(rest.email) : null;
      if (rest.telephone !== void 0) updateData.telephone = rest.telephone ? String(rest.telephone) : null;
      if (rest.poste !== void 0) updateData.poste = String(rest.poste);
      if (rest.role !== void 0) updateData.role = String(rest.role);
      if (rest.actif !== void 0) updateData.actif = Boolean(rest.actif);
      if (permissions !== void 0) updateData.permissions = permissions ? JSON.stringify(permissions) : null;
      if (Object.keys(updateData).length) await updateAdminUser(targetId, updateData);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.delete("/api/admin/users/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const targetId = Number(req.params.id);
  if (targetId === session.id) return res.status(400).json({ error: "Impossible de se supprimer soi-m\xEAme." });
  try {
    await deleteAdminUser(targetId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.get("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const { listAdminUsers: list } = await Promise.resolve().then(() => (init_admin_db(), admin_db_exports));
  const users = await list();
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  let perms = null;
  if (user.permissions) {
    try {
      perms = JSON.parse(user.permissions);
    } catch {
    }
  }
  res.json({ permissions: perms });
});
router19.put("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { permissions } = req.body;
    await updateAdminUser(Number(req.params.id), {
      permissions: permissions ? JSON.stringify(permissions) : null
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.get("/api/admin/team", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const [utilisateurs, permissions] = await Promise.all([listUtilisateurs(), listPermissions()]);
  res.json({ utilisateurs, permissions });
});
router19.post("/api/admin/team", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { nom, poste, email, telephone, numero_plaque, username, motDePasse } = req.body;
    if (!nom || !poste || !motDePasse) return res.status(400).json({ error: "Champs manquants." });
    if (poste === "Livreur" && !telephone) return res.status(400).json({ error: "Le t\xE9l\xE9phone est obligatoire pour un livreur." });
    const hash = await import_bcryptjs2.default.hash(motDePasse, 12);
    const id = await createUtilisateur({ nom, poste, email, telephone, numero_plaque: numero_plaque || void 0, username: username?.trim().toLowerCase() || void 0, motDePasse: hash, mustChangePassword: true });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.patch("/api/admin/team/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { motDePasse, ...rest } = req.body;
    const data = {};
    if (rest.nom !== void 0) data.nom = String(rest.nom);
    if (rest.username !== void 0) data.username = rest.username ? String(rest.username).trim().toLowerCase() : void 0;
    if (rest.email !== void 0) data.email = rest.email ? String(rest.email) : void 0;
    if (rest.telephone !== void 0) data.telephone = rest.telephone ? String(rest.telephone) : void 0;
    if (rest.numero_plaque !== void 0) data.numero_plaque = rest.numero_plaque ? String(rest.numero_plaque) : void 0;
    if (rest.poste !== void 0) data.poste = String(rest.poste);
    if (rest.actif !== void 0) data.actif = Number(rest.actif);
    if (motDePasse) data.motDePasse = await import_bcryptjs2.default.hash(String(motDePasse), 12);
    await updateUtilisateur(Number(req.params.id), data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.delete("/api/admin/team/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    await deleteUtilisateur(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router19.get("/api/admin/team/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const user = await getUtilisateurById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Introuvable." });
  let perms = null;
  if (user.permissions) {
    try {
      perms = JSON.parse(user.permissions);
    } catch {
    }
  }
  res.json({ permissions: perms });
});
router19.put("/api/admin/team/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { permissions } = req.body;
    await updateUtilisateur(Number(req.params.id), {
      permissions: permissions ? JSON.stringify(permissions) : null
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var users_default = router19;

// routes/admin/reviews.ts
var import_express20 = __toESM(require("express"));
init_admin_db();
var router20 = import_express20.default.Router();
router20.post("/api/admin/reviews", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { id, approved, _delete } = req.body;
  if (!id) return res.status(400).json({ error: "id requis" });
  try {
    if (_delete) {
      await deleteReview(Number(id));
    } else {
      await approveReview(Number(id), Boolean(approved));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var reviews_default = router20;

// routes/admin/payment-plans.ts
var import_express21 = __toESM(require("express"));
init_admin_db();
init_db();
var router21 = import_express21.default.Router();
var _paymentTablesReady = false;
async function ensurePaymentTables() {
  if (_paymentTablesReady) return;
  const pool2 = db;
  await pool2.execute(`
    CREATE TABLE IF NOT EXISTS payment_plans (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      order_id        INT NOT NULL,
      nb_tranches     INT NOT NULL DEFAULT 4,
      montant_total   DECIMAL(10,2) NOT NULL,
      montant_tranche DECIMAL(10,2) NOT NULL,
      statut          ENUM('en_cours','solde','annule') DEFAULT 'en_cours',
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool2.execute(`
    CREATE TABLE IF NOT EXISTS payment_tranches (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      plan_id        INT NOT NULL,
      numero         INT NOT NULL,
      montant        DECIMAL(10,2) NOT NULL,
      date_echeance  DATE NOT NULL,
      date_paiement  DATETIME NULL,
      statut         ENUM('en_attente','payee','en_retard') DEFAULT 'en_attente',
      mode_paiement  VARCHAR(30) NULL,
      note           VARCHAR(255) NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await pool2.execute(`ALTER TABLE payment_tranches ADD COLUMN mode_paiement VARCHAR(30) NULL`);
  } catch (e) {
    if (e?.code !== "ER_DUP_FIELDNAME") throw e;
  }
  _paymentTablesReady = true;
}
router21.get("/api/admin/payment-plans", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    await ensurePaymentTables();
    const plans = await listPaymentPlans();
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router21.get("/api/admin/payment-plans/order/:orderId", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    await ensurePaymentTables();
    const plan = await getPaymentPlanByOrderId(Number(req.params.orderId));
    if (!plan) return res.status(404).json({ error: "Plan introuvable" });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router21.patch("/api/admin/payment-tranches/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    const { paid, note, mode_paiement } = req.body;
    if (paid) {
      await markTranchePaid(Number(req.params.id), note, mode_paiement);
    } else {
      await markTrancheUnpaid(Number(req.params.id));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router21.delete("/api/admin/payment-plans/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    await cancelPaymentPlan(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var payment_plans_default = router21;

// routes/admin/verifications.ts
var import_express22 = __toESM(require("express"));
init_db();
var router22 = import_express22.default.Router();
router22.get("/api/admin/verifications", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    const pool2 = db;
    const [rows] = await pool2.execute(
      `SELECT av.id, av.user_id, av.id_card_url, av.selfie_url,
              av.statut, av.note_admin, av.created_at,
              cu.nom, cu.email, cu.telephone
       FROM account_verifications av
       JOIN client_users cu ON cu.id = av.user_id
       ORDER BY FIELD(av.statut, 'en_attente', 'rejete', 'verifie'), av.created_at DESC`
    );
    return res.json({ verifications: rows });
  } catch (err) {
    console.error("[admin/verifications GET]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router22.patch("/api/admin/verifications/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  try {
    const pool2 = db;
    const id = Number(req.params.id);
    const { statut, note_admin } = req.body;
    if (!["verifie", "rejete"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide." });
    }
    const [rows] = await pool2.execute(
      "SELECT user_id FROM account_verifications WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "V\xE9rification introuvable." });
    const userId = rows[0].user_id;
    await pool2.execute(
      "UPDATE account_verifications SET statut = ?, note_admin = ? WHERE id = ?",
      [statut, note_admin ?? null, id]
    );
    await pool2.execute(
      "UPDATE client_users SET verifie = ? WHERE id = ?",
      [statut === "verifie" ? 1 : 0, userId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("[admin/verifications PATCH]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
var verifications_default = router22;

// routes/admin/commerciaux.ts
var import_express23 = __toESM(require("express"));
init_db();
var router23 = import_express23.default.Router();
var pool = db;
async function ensureCommerciauxTables() {
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
router23.get("/api/admin/commerciaux", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [rows] = await pool.execute(`
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
router23.get("/api/admin/commerciaux/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [[stats]] = await pool.execute(`
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
router23.post("/api/admin/commerciaux", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { nom, email, telephone, taux_commission } = req.body;
  if (!nom?.trim() || !email?.trim()) return res.status(400).json({ error: "Nom et email requis." });
  try {
    const [result] = await pool.execute(
      "INSERT INTO commerciaux (nom, email, telephone, taux_commission) VALUES (?, ?, ?, ?)",
      [nom.trim(), email.trim().toLowerCase(), telephone ?? null, parseFloat(taux_commission ?? "5")]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
router23.patch("/api/admin/commerciaux/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { nom, email, telephone, taux_commission, actif } = req.body;
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
router23.get("/api/admin/commerciaux/commissions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [rows] = await pool.execute(`
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
router23.patch("/api/admin/commerciaux/commissions/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
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
router23.get("/api/admin/commerciaux/:id/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [rows] = await pool.execute(`
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
router23.put("/api/admin/commerciaux/:id/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { produit_ids } = req.body;
  try {
    await pool.execute("DELETE FROM commercial_produits WHERE commercial_id = ?", [req.params.id]);
    if (Array.isArray(produit_ids) && produit_ids.length > 0) {
      const values = produit_ids.map((pid) => [Number(req.params.id), Number(pid)]);
      await pool.query("INSERT INTO commercial_produits (commercial_id, produit_id) VALUES ?", [values]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
var commerciaux_default = router23;

// routes/livreur.ts
var import_express24 = __toESM(require("express"));
init_admin_db();
init_db();
var router24 = import_express24.default.Router();
async function requireLivreur(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Non autoris\xE9." });
    return null;
  }
  if (session.role === "staff") {
    const member = await getUtilisateurById(Number(session.id));
    if (!member || member.poste !== "Livreur") {
      res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 aux livreurs." });
      return null;
    }
    return { session, member: { id: member.id, nom: member.nom } };
  }
  if (session.role === "livreur") {
    const { getAdminById: getAdminById2 } = await Promise.resolve().then(() => (init_admin_db(), admin_db_exports));
    const admin = await getAdminById2(Number(session.id));
    if (!admin || admin.poste !== "Livreur") {
      res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 aux livreurs." });
      return null;
    }
    return { session, member: { id: admin.id, nom: admin.nom } };
  }
  res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 aux livreurs." });
  return null;
}
router24.get("/api/livreur/profile", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  try {
    const member = await getUtilisateurById(ctx.member.id);
    if (member) {
      res.json({ nom: member.nom, telephone: member.telephone, numero_plaque: member.numero_plaque, poste: member.poste });
    } else {
      const { getAdminById: getAdminById2 } = await Promise.resolve().then(() => (init_admin_db(), admin_db_exports));
      const admin = await getAdminById2(ctx.member.id);
      res.json({ nom: admin?.nom ?? ctx.member.nom, telephone: admin?.telephone ?? null, numero_plaque: null, poste: "Livreur" });
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.get("/api/livreur/stats", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  const id = ctx.member.id;
  async function q(sql, params) {
    try {
      const [[row]] = await pool2.execute(sql, params);
      return Number(row?.cnt ?? row?.gain ?? 0);
    } catch {
      return 0;
    }
  }
  try {
    const todayOrders = await q(`SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND DATE(updated_at) = CURDATE()`, [id]);
    const todayLiv = await q(`SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre' AND DATE(livree_le) = CURDATE()`, [id]);
    const weekOrders = await q(`SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]);
    const weekLiv = await q(`SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre' AND livree_le >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]);
    const totalOrders = await q(`SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre'`, [id]);
    const totalLiv = await q(`SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre'`, [id]);
    const enCoursOrders = await q(`SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'en_cours'`, [id]);
    const enCoursLiv = await q(`SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'acceptee'`, [id]);
    const assignedOrders = await q(`SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ?`, [id]);
    const assignedLiv = await q(`SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ?`, [id]);
    const gainToday = await q(`SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND DATE(updated_at) = CURDATE()`, [id]);
    const gainWeek = await q(`SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]);
    const gainTotal = await q(`SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre'`, [id]);
    const today = todayOrders + todayLiv;
    const week = weekOrders + weekLiv;
    const total = totalOrders + totalLiv;
    const enCours = enCoursOrders + enCoursLiv;
    const assigned = assignedOrders + assignedLiv;
    const tauxReussite = assigned > 0 ? Math.round(total / assigned * 100) : 0;
    res.json({ today, week, total, enCours, tauxReussite, gainToday, gainWeek, gainTotal });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.get("/api/livreur/orders/available", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  try {
    const [orderRows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, lien_localisation, 'order' AS source
       FROM orders
       WHERE status = 'confirmed' AND livreur_id IS NULL
       ORDER BY created_at ASC`
    );
    const [livRows] = await pool2.execute(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.lien_localisation, 'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.statut = 'en_attente' AND lv.livreur_id IS NULL AND lv.order_id IS NULL
       ORDER BY lv.created_at ASC`
    );
    const data = [...orderRows, ...livRows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.get("/api/livreur/orders/mine", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  try {
    const [orderRows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, lien_localisation, 'order' AS source
       FROM orders
       WHERE livreur_id = ? AND livraison_statut = 'en_cours'
       ORDER BY created_at ASC`,
      [ctx.member.id]
    );
    const [livRows] = await pool2.execute(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.lien_localisation, 'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.livreur_id = ? AND lv.statut = 'acceptee' AND lv.order_id IS NULL
       ORDER BY lv.created_at ASC`,
      [ctx.member.id]
    );
    const data = [...orderRows, ...livRows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.get("/api/livreur/orders/history", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  try {
    const [orderRows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, livraison_statut, livraison_note, 'order' AS source
       FROM orders
       WHERE livreur_id = ? AND livraison_statut IN ('livre', 'echec')
       ORDER BY created_at DESC LIMIT ${limit}`,
      [ctx.member.id]
    );
    const [livRows] = await pool2.execute(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.statut AS livraison_statut,
              COALESCE(lv.note, '') AS livraison_note,
              'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.livreur_id = ? AND lv.statut IN ('livre', 'echoue') AND lv.order_id IS NULL
       ORDER BY lv.created_at DESC LIMIT ${limit}`,
      [ctx.member.id]
    );
    const data = [...orderRows, ...livRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.patch("/api/livreur/orders/:id/accept", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  const entityId = Number(req.params.id);
  const src = req.query.src;
  try {
    if (src === "livraison") {
      const [[row]] = await pool2.execute(
        "SELECT id, statut, livreur_id FROM livraisons_ventes WHERE id = ? LIMIT 1",
        [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (row.statut !== "en_attente" || row.livreur_id != null) {
        return res.status(409).json({ error: "Cette livraison n'est plus disponible." });
      }
      await pool2.execute(
        "UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ? WHERE id = ?",
        [ctx.member.id, ctx.member.nom, entityId]
      );
    } else {
      const [[order]] = await pool2.execute(
        "SELECT id, status, livreur_id, delivery_fee FROM orders WHERE id = ? LIMIT 1",
        [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (order.status !== "confirmed" || order.livreur_id != null) {
        return res.status(409).json({ error: "Cette livraison n'est plus disponible." });
      }
      await pool2.execute(
        "UPDATE orders SET livreur_id = ?, livraison_statut = 'en_cours', status = 'shipped' WHERE id = ?",
        [ctx.member.id, entityId]
      );
      await addOrderEvent(entityId, "shipped", `Pris en charge par ${ctx.member.nom}`, ctx.member.nom);
      await pool2.execute(
        `UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ?, montant_livraison = ?
         WHERE order_id = ?`,
        [ctx.member.id, ctx.member.nom, Number(order.delivery_fee ?? 0), entityId]
      ).catch(() => {
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.patch("/api/livreur/orders/:id/deliver", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  const entityId = Number(req.params.id);
  const src = req.query.src;
  try {
    if (src === "livraison") {
      const [[row]] = await pool2.execute(
        "SELECT lv.id, lv.livreur_id, lv.facture_id, f.total, f.mode_paiement, f.statut_paiement FROM livraisons_ventes lv LEFT JOIN factures f ON f.id = lv.facture_id WHERE lv.id = ? LIMIT 1",
        [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (Number(row.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assign\xE9e." });
      }
      await pool2.execute(
        "UPDATE livraisons_ventes SET statut = 'livre', livree_le = NOW() WHERE id = ?",
        [entityId]
      );
      if (row.facture_id && row.statut_paiement !== "paye_total") {
        try {
          await pool2.execute(
            `UPDATE factures SET statut = 'paye', statut_paiement = 'paye_total'
             WHERE id = ? AND statut != 'annule'`,
            [row.facture_id]
          );
          const montant = Number(row.total ?? 0);
          if (montant > 0) {
            await createFinanceEntry({
              type: "vente",
              montant,
              mode_paiement: row.mode_paiement || "especes",
              description: `Livraison confirm\xE9e \u2014 facture #${row.facture_id}`,
              date_entree: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
            });
          }
        } catch (e) {
          console.error("[livreur] finance entry failed:", e);
        }
      }
    } else {
      const [[order]] = await pool2.execute(
        "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1",
        [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (Number(order.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assign\xE9e." });
      }
      await pool2.execute(
        "UPDATE orders SET livraison_statut = 'livre', status = 'delivered', statut_paiement = 'paye_total' WHERE id = ?",
        [entityId]
      );
      await addOrderEvent(entityId, "delivered", `Livr\xE9 par ${ctx.member.nom}`, ctx.member.nom);
      await pool2.execute(
        "UPDATE livraisons_ventes SET statut = 'livre', livree_le = NOW() WHERE order_id = ?",
        [entityId]
      ).catch(() => {
      });
      const factureId = await ensureOrderVente(entityId, { id: ctx.member.id, nom: ctx.member.nom }).catch(() => null);
      if (factureId) {
        await pool2.execute(
          "UPDATE factures SET statut_paiement = 'paye_total', statut = 'paye' WHERE id = ? AND statut != 'annule'",
          [factureId]
        ).catch(() => {
        });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router24.patch("/api/livreur/orders/:id/fail", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool2 = db;
  const entityId = Number(req.params.id);
  const src = req.query.src;
  const note = String(req.body.note ?? "").trim() || "Tentative de livraison \xE9chou\xE9e";
  try {
    if (src === "livraison") {
      const [[row]] = await pool2.execute(
        "SELECT id, livreur_id FROM livraisons_ventes WHERE id = ? LIMIT 1",
        [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (Number(row.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assign\xE9e." });
      }
      await pool2.execute(
        "UPDATE livraisons_ventes SET statut = 'en_attente', livreur_id = NULL, livreur = NULL, note = ? WHERE id = ?",
        [note, entityId]
      );
    } else {
      const [[order]] = await pool2.execute(
        "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1",
        [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (Number(order.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assign\xE9e." });
      }
      await pool2.execute(
        "UPDATE orders SET livraison_statut = 'echec', livraison_note = ?, status = 'confirmed', livreur_id = NULL WHERE id = ?",
        [note, entityId]
      );
      await addOrderEvent(entityId, "confirmed", `Tentative \xE9chou\xE9e par ${ctx.member.nom} \u2014 ${note}`, ctx.member.nom);
      await pool2.execute(
        "UPDATE livraisons_ventes SET statut = 'en_attente', livreur_id = NULL, livreur = NULL, note = ? WHERE order_id = ?",
        [note, entityId]
      ).catch(() => {
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var livreur_default = router24;

// routes/public.ts
var import_express25 = __toESM(require("express"));
init_db();
init_admin_db();
var router25 = import_express25.default.Router();
var _shopCache = /* @__PURE__ */ new Map();
var SHOP_CACHE_TTL = 6e4;
async function resolveShopId(req) {
  const slug = req.headers["x-shop-slug"]?.trim();
  if (slug && slug !== "default") {
    const cacheKey = `slug:${slug}`;
    const cached = _shopCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SHOP_CACHE_TTL) return cached.id;
    try {
      const shop = await getShopBySlug(slug);
      const id = shop?.id ?? 1;
      _shopCache.set(cacheKey, { id, slug, ts: Date.now() });
      return id;
    } catch {
      return 1;
    }
  }
  const customDomain = req.headers["x-custom-domain"]?.trim();
  if (customDomain) {
    const cacheKey = `domain:${customDomain}`;
    const cached = _shopCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < SHOP_CACHE_TTL) return cached.id;
    try {
      const shop = await getShopByDomain(customDomain);
      const id = shop?.id ?? 1;
      _shopCache.set(cacheKey, { id, slug: shop?.slug ?? "", ts: Date.now() });
      return id;
    } catch {
      return 1;
    }
  }
  return 1;
}
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed | 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
var _bsCacheMap = /* @__PURE__ */ new Map();
var BS_TTL = 6e4;
async function loadBestsellerProducts(limit, shopId = 1) {
  const cached = _bsCacheMap.get(shopId);
  if (cached && Date.now() - cached.ts < BS_TTL) return cached.data;
  const pool2 = db;
  const salesMap = /* @__PURE__ */ new Map();
  try {
    const [factRows] = await pool2.execute(
      `SELECT jt.produit_id, SUM(jt.qty) AS total_sold
       FROM factures f,
       JSON_TABLE(
         f.items, '$[*]'
         COLUMNS (
           produit_id INT PATH '$.produit_id',
           qty        INT PATH '$.qty'
         )
       ) AS jt
       WHERE f.statut IN ('valide', 'paye')
         AND NOT EXISTS (
           SELECT 1 FROM livraisons_ventes lv
           WHERE lv.facture_id = f.id AND lv.statut NOT IN ('livre', 'echoue')
         )
         AND jt.produit_id IS NOT NULL
       GROUP BY jt.produit_id
       ORDER BY total_sold DESC
       LIMIT 50`
    );
    for (const r of factRows) {
      salesMap.set(r.produit_id, Number(r.total_sold));
    }
  } catch (e) {
    console.error("[BS] step1 factures error:", e);
  }
  try {
    const [orderRows] = await pool2.execute(
      `SELECT p.id AS produit_id, SUM(jt.qty) AS total_sold
       FROM orders o,
       JSON_TABLE(
         o.items, '$[*]'
         COLUMNS (
           reference VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PATH '$.reference',
           qty       INT          PATH '$.qty'
         )
       ) AS jt
       JOIN produits p ON p.reference = jt.reference
       WHERE o.status = 'delivered'
         AND jt.reference IS NOT NULL
         AND jt.reference <> ''
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 50`
    );
    for (const r of orderRows) {
      const pid = r.produit_id;
      salesMap.set(pid, (salesMap.get(pid) ?? 0) + Number(r.total_sold));
    }
  } catch (e) {
    console.error("[BS] step2 orders error:", e);
  }
  let products = [];
  if (salesMap.size > 0) {
    const ranked = [...salesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
    const ids = ranked.map(([id]) => id);
    const placeholders = ids.map(() => "?").join(",");
    const [prodRows] = await pool2.execute(
      `SELECT p.*, c.nom AS categorie_nom
       FROM produits p
       LEFT JOIN categories c ON c.id = p.categorie_id
       WHERE p.id IN (${placeholders})
         AND p.actif = 1
         AND p.shop_id = ?`,
      [...ids, shopId]
    );
    prodRows.sort((a, b) => (salesMap.get(b.id) ?? 0) - (salesMap.get(a.id) ?? 0));
    const poolSize = Math.min(prodRows.length, Math.max(limit + 8, 16));
    const topPool = prodRows.slice(0, poolSize);
    for (let i = topPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topPool[i], topPool[j]] = [topPool[j], topPool[i]];
    }
    products = topPool.slice(0, limit);
  }
  _bsCacheMap.set(shopId, { data: products, ts: Date.now() });
  return products;
}
router25.get("/api/health", async (_req, res) => {
  let dbStatus = "untested";
  let tables = [];
  try {
    const [rows] = await db.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    tables = rows.map((r) => r.TABLE_NAME);
    dbStatus = "connected";
  } catch (e) {
    dbStatus = `error: ${e instanceof Error ? e.message : String(e)}`;
  }
  res.json({ status: "ok", db_status: dbStatus, tables });
});
router25.get("/api/products", async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    const idsParam = req.query.ids;
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0).slice(0, 50);
      if (!ids.length) return res.json({ success: true, data: [] });
      const products2 = await getProductsByIds(ids);
      return res.json({ success: true, data: products2 });
    }
    const categoryId = req.query.category ? Number(req.query.category) : void 0;
    const search = req.query.q || void 0;
    const referenceExact = req.query.reference || void 0;
    const slugExact = req.query.slug || void 0;
    const promoOnly = req.query.promo === "true";
    const newOnly = req.query.new === "true";
    const bestOnly = req.query.best === "true";
    const inStock = req.query.inStock === "true";
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : void 0;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : void 0;
    const limit = req.query.limit ? Number(req.query.limit) : 60;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    if (bestOnly) {
      const products2 = await loadBestsellerProducts(limit, shopId);
      return res.json({ success: true, data: products2, total: products2.length });
    }
    if (slugExact) {
      const { getProductBySlug: getProductBySlug2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const product = await getProductBySlug2(slugExact, shopId);
      return res.json({ success: true, data: product ? [product] : [], total: product ? 1 : 0 });
    }
    const [products, total] = await Promise.all([
      getProducts({ categoryId, search, referenceExact, promoOnly, newOnly, inStock, minPrice, maxPrice, limit, offset, shopId }),
      referenceExact ? Promise.resolve(1) : getProductCount({ categoryId, search, promoOnly, newOnly, inStock, minPrice, maxPrice, shopId })
    ]);
    const isFiltered = search || categoryId || promoOnly || newOnly || inStock || minPrice != null || maxPrice != null || referenceExact;
    const data = isFiltered ? products : seededShuffle(products, Math.floor(Date.now() / (1e3 * 60 * 60)));
    res.json({ success: true, data, total });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});
router25.get("/api/categories", async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    const categories = await getCategories(shopId);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});
router25.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: "Email requis." });
    await subscribeNewsletter(email.trim().toLowerCase());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router25.get("/api/reviews/ratings", async (req, res) => {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) return res.json({ ratings: {} });
    const ids = idsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0).slice(0, 100);
    if (!ids.length) return res.json({ ratings: {} });
    const hasReviews = await checkReviewsTable();
    if (!hasReviews) return res.json({ ratings: {} });
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await db.execute(
      `SELECT product_id,
              ROUND(AVG(rating), 1) AS avg_rating,
              COUNT(*)              AS review_count
       FROM reviews
       WHERE product_id IN (${placeholders}) AND approved = 1
       GROUP BY product_id`,
      ids
    );
    const ratings = {};
    for (const r of rows) {
      ratings[String(r.product_id)] = {
        avg: Number(r.avg_rating),
        count: Number(r.review_count)
      };
    }
    res.json({ ratings });
  } catch {
    res.json({ ratings: {} });
  }
});
router25.get("/api/reviews", async (req, res) => {
  try {
    const produit_id = req.query.produit_id ? Number(req.query.produit_id) : void 0;
    const reviews = await listReviews({ produit_id });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router25.post("/api/reviews", async (req, res) => {
  try {
    const { produit_id, nom, note, commentaire } = req.body;
    if (!produit_id || !nom || !note) return res.status(400).json({ error: "Champs requis." });
    await checkReviewsTable();
    await createReview({ produit_id: Number(produit_id), nom, note: Number(note), commentaire });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router25.get("/api/settings/public", async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    const settings = await getSettings(shopId);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router25.get("/api/products/bestsellers", async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit ?? 8)));
    const products = await loadBestsellerProducts(limit, shopId);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Erreur" });
  }
});
router25.get("/api/orders/track", async (req, res) => {
  try {
    const q = (req.query.q ?? "").trim();
    if (!q || q.length < 3) {
      return res.status(400).json({ error: "Veuillez saisir au moins 3 caract\xE8res." });
    }
    const pool2 = db;
    const [rows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, zone_livraison, delivery_fee,
              subtotal, total, status, statut_paiement, payment_mode,
              items, created_at
       FROM orders
       WHERE telephone = ? OR reference = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [q, q]
    );
    if (!rows.length) {
      return res.json({ success: true, data: [] });
    }
    const orderIds = rows.map((r) => r.id);
    const plansMap = {};
    if (orderIds.length > 0) {
      try {
        const placeholders = orderIds.map(() => "?").join(",");
        const [planRows] = await pool2.execute(
          `SELECT pp.order_id, pp.montant_tranche, pt.numero, pt.montant, pt.statut, pt.date_echeance
           FROM payment_plans pp
           JOIN payment_tranches pt ON pt.plan_id = pp.id
           WHERE pp.order_id IN (${placeholders})
           ORDER BY pp.order_id, pt.numero`,
          orderIds
        );
        for (const pr of planRows) {
          const oid = pr.order_id;
          if (!plansMap[oid]) plansMap[oid] = { montant_tranche: pr.montant_tranche, tranches: [] };
          plansMap[oid].tranches.push({
            numero: pr.numero,
            montant: pr.montant,
            statut: pr.statut,
            date_echeance: pr.date_echeance
          });
        }
      } catch {
      }
    }
    const data = rows.map((r) => {
      let itemCount = 0;
      let itemNames = [];
      try {
        const parsed = typeof r.items === "string" ? JSON.parse(r.items) : r.items;
        if (Array.isArray(parsed)) {
          itemCount = parsed.reduce((s, i) => s + (i.qty ?? 1), 0);
          itemNames = parsed.slice(0, 3).map((i) => i.nom ?? "");
        }
      } catch {
      }
      return {
        id: r.id,
        reference: r.reference,
        nom: r.nom,
        zone_livraison: r.zone_livraison,
        total: r.total,
        status: r.status,
        statut_paiement: r.statut_paiement ?? null,
        payment_mode: r.payment_mode ?? null,
        created_at: r.created_at,
        item_count: itemCount,
        item_names: itemNames,
        tranches: plansMap[r.id]?.tranches ?? null
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router25.get("/api/public/coupons/validate", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    const total = Number(req.query.total ?? 0);
    if (!code) return res.status(400).json({ valid: false, error: "Code manquant." });
    const [rows] = await db.execute(
      `SELECT id, code, type, valeur, min_order, max_uses, uses_count, expires_at, actif
       FROM coupons WHERE code = ? LIMIT 1`,
      [code]
    );
    const c = rows[0];
    if (!c || !c.actif) return res.json({ valid: false, error: "Code invalide ou inactif." });
    if (c.expires_at && new Date(c.expires_at) < /* @__PURE__ */ new Date()) return res.json({ valid: false, error: "Ce code a expir\xE9." });
    if (c.max_uses > 0 && c.uses_count >= c.max_uses) return res.json({ valid: false, error: "Ce code a atteint sa limite d'utilisation." });
    if (total > 0 && total < Number(c.min_order)) return res.json({ valid: false, error: `Commande minimum requise : ${Number(c.min_order).toLocaleString("fr-FR")} FCFA.` });
    const remise = c.type === "fixed" ? Math.min(Number(c.valeur), total) : Math.round(total * Number(c.valeur) / 100);
    res.json({ valid: true, type: c.type, valeur: Number(c.valeur), remise, code: c.code });
  } catch (err) {
    res.status(500).json({ valid: false, error: "Erreur serveur." });
  }
});
router25.get("/api/public/delivery-zones", async (req, res) => {
  try {
    const shopId = await resolveShopId(req);
    const zones = await getDeliveryZones(true, shopId);
    res.json(zones);
  } catch {
    res.json([]);
  }
});
router25.get("/api/resolve-domain", async (req, res) => {
  const h = String(req.query.h ?? "").toLowerCase().trim().replace(/^www\./, "");
  if (!h) return res.json({ slug: null });
  try {
    const shop = await getShopByDomain(h);
    if (!shop) return res.json({ slug: null });
    res.json({ slug: shop.slug, shop_id: shop.id });
  } catch {
    res.json({ slug: null });
  }
});
var public_default = router25;

// routes/account.ts
var import_express26 = __toESM(require("express"));
var import_bcryptjs3 = __toESM(require("bcryptjs"));
init_db();
init_admin_db();

// lib/client-auth.ts
var import_jose2 = require("jose");
var SECRET2 = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);
var CLIENT_COOKIE = "ts_client_token";
var TTL2 = 60 * 60 * 24 * 30;
async function signClientToken(payload) {
  return new import_jose2.SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${TTL2}s`).sign(SECRET2);
}
async function verifyClientToken(token) {
  try {
    const { payload } = await (0, import_jose2.jwtVerify)(token, SECRET2);
    return payload;
  } catch {
    return null;
  }
}
async function getClientSession(req) {
  const token = req.cookies?.[CLIENT_COOKIE];
  if (!token) return null;
  return verifyClientToken(token);
}
function setClientCookie(res, token) {
  res.cookie(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: TTL2 * 1e3,
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });
}
function clearClientCookie(res) {
  res.clearCookie(CLIENT_COOKIE, { path: "/" });
}

// routes/account.ts
var router26 = import_express26.default.Router();
var tableReady = false;
async function ensureTable2() {
  if (tableReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      nom          VARCHAR(255) NOT NULL,
      email        VARCHAR(255) UNIQUE NULL,
      telephone    VARCHAR(50)  UNIQUE NULL,
      password_hash VARCHAR(255) NULL,
      photo_url    TEXT NULL,
      google_id    VARCHAR(255) UNIQUE NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}
function isEmail(s) {
  return s.includes("@");
}
async function findUser(identifier) {
  const pool2 = db;
  const field = isEmail(identifier) ? "email" : "telephone";
  const [rows] = await pool2.execute(
    `SELECT * FROM client_users WHERE ${field} = ? LIMIT 1`,
    [identifier.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}
function toPayload(row) {
  return {
    id: row.id,
    nom: row.nom,
    email: row.email ?? null,
    telephone: row.telephone ?? null,
    photo_url: row.photo_url ?? null
  };
}
router26.post("/api/account/register", async (req, res) => {
  try {
    await ensureTable2();
    const { nom, identifier, password } = req.body;
    if (!nom?.trim() || !identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Nom, identifiant et mot de passe requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res." });
    }
    const existing = await findUser(identifier);
    if (existing) {
      return res.status(409).json({ error: "Ce compte existe d\xE9j\xE0. Connectez-vous." });
    }
    const hash = await import_bcryptjs3.default.hash(password.trim(), 12);
    const field = isEmail(identifier) ? "email" : "telephone";
    const pool2 = db;
    const [result] = await pool2.execute(
      `INSERT INTO client_users (nom, ${field}, password_hash) VALUES (?, ?, ?)`,
      [nom.trim(), identifier.trim().toLowerCase(), hash]
    );
    const user = {
      id: result.insertId,
      nom: nom.trim(),
      email: field === "email" ? identifier.trim().toLowerCase() : null,
      telephone: field === "telephone" ? identifier.trim().toLowerCase() : null,
      photo_url: null
    };
    const token = await signClientToken(user);
    setClientCookie(res, token);
    return res.json({ user });
  } catch (err) {
    console.error("[account/register]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router26.post("/api/account/login", async (req, res) => {
  try {
    await ensureTable2();
    const { identifier, password } = req.body;
    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis." });
    }
    const user = await findUser(identifier);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }
    const ok = await import_bcryptjs3.default.compare(password.trim(), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }
    const payload = toPayload(user);
    const token = await signClientToken(payload);
    setClientCookie(res, token);
    return res.json({ user: payload });
  } catch (err) {
    console.error("[account/login]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router26.get("/api/account/me", async (req, res) => {
  try {
    await ensureTable2();
    const session = await getClientSession(req);
    if (!session) return res.json({ user: null });
    const pool2 = db;
    const [rows] = await pool2.execute(
      "SELECT * FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    if (!rows[0]) return res.json({ user: null });
    return res.json({ user: toPayload(rows[0]) });
  } catch (err) {
    console.error("[account/me]", err);
    return res.json({ user: null });
  }
});
router26.post("/api/account/logout", (_req, res) => {
  clearClientCookie(res);
  return res.json({ ok: true });
});
router26.get("/api/account/google", (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(503).json({ error: "Google OAuth non configur\xE9." });
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account"
  });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});
router26.get("/api/account/google/callback", async (req, res) => {
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003";
  try {
    await ensureTable2();
    const code = req.query.code;
    if (!code) return res.redirect(`${siteUrl}/?auth_error=no_code`);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[google/callback] token exchange failed:", tokenData);
      return res.redirect(`${siteUrl}/?auth_error=token_failed`);
    }
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const info = await infoRes.json();
    if (!info.id || !info.email) {
      return res.redirect(`${siteUrl}/?auth_error=no_profile`);
    }
    const pool2 = db;
    const [byGoogle] = await pool2.execute(
      "SELECT * FROM client_users WHERE google_id = ? LIMIT 1",
      [info.id]
    );
    let dbUser = byGoogle[0];
    if (!dbUser) {
      const [byEmail] = await pool2.execute(
        "SELECT * FROM client_users WHERE email = ? LIMIT 1",
        [info.email.toLowerCase()]
      );
      if (byEmail[0]) {
        await pool2.execute(
          "UPDATE client_users SET google_id = ?, photo_url = COALESCE(photo_url, ?) WHERE id = ?",
          [info.id, info.picture ?? null, byEmail[0].id]
        );
        dbUser = { ...byEmail[0], google_id: info.id };
      } else {
        const [result] = await pool2.execute(
          "INSERT INTO client_users (nom, email, google_id, photo_url) VALUES (?, ?, ?, ?)",
          [info.name, info.email.toLowerCase(), info.id, info.picture ?? null]
        );
        dbUser = {
          id: result.insertId,
          nom: info.name,
          email: info.email.toLowerCase(),
          telephone: null,
          photo_url: info.picture ?? null,
          google_id: info.id
        };
      }
    }
    const payload = toPayload(dbUser);
    const token = await signClientToken(payload);
    setClientCookie(res, token);
    return res.redirect(`${siteUrl}/account`);
  } catch (err) {
    console.error("[google/callback]", err);
    const siteUrl2 = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003";
    return res.redirect(`${siteUrl2}/?auth_error=server`);
  }
});
router26.get("/api/account/orders", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connect\xE9." });
    const pool2 = db;
    const [userRows] = await pool2.execute(
      "SELECT telephone FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    const telephone = userRows[0]?.telephone;
    try {
      await pool2.execute("ALTER TABLE orders ADD COLUMN client_user_id INT NULL");
    } catch (e) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
    const conditions = ["client_user_id = ?"];
    const params = [session.id];
    if (telephone) {
      conditions.push("telephone = ?");
      params.push(telephone);
    }
    const [rows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, total, subtotal, delivery_fee,
              status, items, adresse, zone_livraison, created_at
       FROM orders WHERE ${conditions.join(" OR ")} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    return res.json({ orders: rows });
  } catch (err) {
    console.error("[account/orders]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router26.get("/api/account/orders/:ref", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connect\xE9." });
    const pool2 = db;
    const [userRows] = await pool2.execute(
      "SELECT telephone FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    const telephone = userRows[0]?.telephone;
    const [orderRows] = await pool2.execute(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, lien_localisation,
              delivery_fee, subtotal, total, status, statut_paiement, payment_mode,
              items, created_at, updated_at
       FROM orders WHERE reference = ? LIMIT 1`,
      [req.params.ref]
    );
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (telephone && order.telephone !== telephone) {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
    }
    const events = await getOrderEvents(order.id);
    let paymentPlan = null;
    try {
      const { getPaymentPlanByOrderId: getPaymentPlanByOrderId2 } = await Promise.resolve().then(() => (init_admin_db(), admin_db_exports));
      paymentPlan = await getPaymentPlanByOrderId2(order.id);
    } catch {
    }
    return res.json({ order, events, paymentPlan });
  } catch (err) {
    console.error("[account/orders/:ref]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
var verifTableReady = false;
async function ensureVerifTable() {
  if (verifTableReady) return;
  const pool2 = db;
  await pool2.execute(`
    CREATE TABLE IF NOT EXISTS account_verifications (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      id_card_url TEXT NOT NULL,
      selfie_url  TEXT NOT NULL,
      statut      ENUM('en_attente','verifie','rejete') DEFAULT 'en_attente',
      note_admin  TEXT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await pool2.execute("ALTER TABLE client_users ADD COLUMN verifie TINYINT NOT NULL DEFAULT 0");
  } catch {
  }
  verifTableReady = true;
}
router26.get("/api/account/verification", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connect\xE9." });
    await ensureVerifTable();
    const pool2 = db;
    const [rows] = await pool2.execute(
      "SELECT statut, note_admin FROM account_verifications WHERE user_id = ? LIMIT 1",
      [session.id]
    );
    if (!rows[0]) return res.json({ statut: null });
    return res.json({ statut: rows[0].statut, note_admin: rows[0].note_admin ?? null });
  } catch (err) {
    console.error("[account/verification GET]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router26.post("/api/account/verification", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connect\xE9." });
    await ensureVerifTable();
    const { id_card, selfie } = req.body;
    if (!id_card?.data || !selfie?.data) {
      return res.status(400).json({ error: "Les deux photos sont requises." });
    }
    const { v2: cloudinary3 } = await import("cloudinary");
    cloudinary3.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    async function uploadImg(b64) {
      const buffer = Buffer.from(b64.replace(/^data:[^;]+;base64,/, ""), "base64");
      return new Promise((resolve2, reject) => {
        const stream = cloudinary3.uploader.upload_stream(
          { folder: "togolese-shop/verifications", resource_type: "image" },
          (err, result) => err || !result ? reject(err) : resolve2(result.secure_url)
        );
        stream.end(buffer);
      });
    }
    const [idCardUrl, selfieUrl] = await Promise.all([
      uploadImg(id_card.data),
      uploadImg(selfie.data)
    ]);
    const pool2 = db;
    await pool2.execute(
      `INSERT INTO account_verifications (user_id, id_card_url, selfie_url, statut)
       VALUES (?, ?, ?, 'en_attente')
       ON DUPLICATE KEY UPDATE
         id_card_url = VALUES(id_card_url),
         selfie_url  = VALUES(selfie_url),
         statut      = 'en_attente',
         note_admin  = NULL`,
      [session.id, idCardUrl, selfieUrl]
    );
    return res.json({ ok: true, statut: "en_attente" });
  } catch (err) {
    console.error("[account/verification POST]", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi des documents." });
  }
});
var addressTableReady = false;
async function ensureAddressTable() {
  if (addressTableReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_addresses (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      client_user_id  INT NOT NULL,
      nom             VARCHAR(255) NOT NULL,
      telephone       VARCHAR(50)  NOT NULL,
      adresse         VARCHAR(500) NOT NULL,
      zone_livraison  VARCHAR(255) NOT NULL,
      is_default      TINYINT(1) DEFAULT 0,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (client_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  addressTableReady = true;
}
router26.get("/api/account/addresses", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    await ensureAddressTable();
    const pool2 = db;
    const [rows] = await pool2.execute(
      "SELECT * FROM client_addresses WHERE client_user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 20",
      [session.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router26.post("/api/account/addresses", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    await ensureAddressTable();
    const { nom, telephone, adresse, zone_livraison, is_default } = req.body;
    if (!nom?.trim() || !telephone?.trim() || !adresse?.trim() || !zone_livraison?.trim()) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    const pool2 = db;
    if (is_default) {
      await pool2.execute(
        "UPDATE client_addresses SET is_default = 0 WHERE client_user_id = ?",
        [session.id]
      );
    }
    const [result] = await pool2.execute(
      `INSERT INTO client_addresses (client_user_id, nom, telephone, adresse, zone_livraison, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.id, nom.trim(), telephone.trim(), adresse.trim(), zone_livraison.trim(), is_default ? 1 : 0]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router26.delete("/api/account/addresses/:id", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    const pool2 = db;
    await pool2.execute(
      "DELETE FROM client_addresses WHERE id = ? AND client_user_id = ?",
      [Number(req.params.id), session.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var account_default = router26;

// routes/orders.ts
var import_express27 = __toESM(require("express"));
init_admin_db();
init_db();
var router27 = import_express27.default.Router();
function normalizeTogoPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const local = digits.startsWith("228") ? digits.slice(3) : digits;
  return local.length === 8 ? `+228 ${local}` : null;
}
var _orderColsReady = false;
async function ensureOrderCols() {
  if (_orderColsReady) return;
  const pool2 = db;
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN lien_localisation VARCHAR(500) NULL",
    "ALTER TABLE orders ADD COLUMN client_user_id INT NULL",
    "ALTER TABLE orders ADD COLUMN mm_transaction_ref VARCHAR(100) NULL",
    "ALTER TABLE orders ADD COLUMN payment_mode VARCHAR(30) NULL",
    "ALTER TABLE orders ADD COLUMN ref_code VARCHAR(20) NULL",
    "ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL",
    "ALTER TABLE orders ADD COLUMN coupon_remise INT NULL"
  ]) {
    try {
      await pool2.execute(ddl);
    } catch (e) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }
  _orderColsReady = true;
}
router27.post("/api/orders", async (req, res) => {
  try {
    await ensureOrderCols();
    await ensurePaymentTables();
    const {
      nom,
      telephone,
      adresse,
      zone_livraison,
      delivery_fee,
      note,
      lien_localisation,
      items,
      subtotal,
      total,
      payment_mode,
      nb_tranches,
      mm_transaction_ref,
      ref_code,
      coupon_code,
      coupon_remise
    } = req.body;
    if (!telephone?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "T\xE9l\xE9phone et articles requis." });
    }
    const cleanTelephone = normalizeTogoPhone(telephone);
    if (!cleanTelephone) {
      return res.status(400).json({ error: "Le num\xE9ro WhatsApp doit contenir exactement 8 chiffres togolais." });
    }
    if ((payment_mode === "moov_direct" || payment_mode === "yas_direct") && !String(mm_transaction_ref ?? "").trim()) {
      return res.status(400).json({ error: "La r\xE9f\xE9rence de transaction est obligatoire pour ce paiement." });
    }
    const isEchelonne = ["2x", "3x", "4x"].includes(payment_mode);
    const tranches = isEchelonne ? Math.max(2, Math.min(4, Number(nb_tranches) || 4)) : null;
    const id = await createOrder({
      nom: nom ?? "",
      telephone: cleanTelephone,
      adresse: adresse ?? "",
      zone_livraison: zone_livraison ?? "",
      delivery_fee: Number(delivery_fee ?? 0),
      note: note ?? "",
      items,
      subtotal: Number(subtotal ?? 0),
      total: Number(total ?? 0)
    });
    const pool2 = db;
    const clientSession = await getClientSession(req).catch(() => null);
    if (clientSession?.id) {
      await pool2.execute(
        "UPDATE orders SET client_user_id = ? WHERE id = ?",
        [clientSession.id, id]
      );
    }
    if (ref_code) {
      pool2.execute(
        `UPDATE referrals SET uses_count = uses_count + 1 WHERE code = ?`,
        [String(ref_code).trim().toUpperCase()]
      ).catch(() => {
      });
    }
    if (coupon_code) {
      pool2.execute(
        `UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?`,
        [String(coupon_code).trim().toUpperCase()]
      ).catch(() => {
      });
    }
    const extraUpdates = [];
    const extraValues = [];
    if (lien_localisation) {
      extraUpdates.push("lien_localisation = ?");
      extraValues.push(lien_localisation);
    }
    if (payment_mode) {
      extraUpdates.push("payment_mode = ?");
      extraValues.push(payment_mode);
    }
    if (mm_transaction_ref) {
      extraUpdates.push("mm_transaction_ref = ?");
      extraValues.push(mm_transaction_ref);
    }
    if (ref_code) {
      extraUpdates.push("ref_code = ?");
      extraValues.push(String(ref_code).trim().toUpperCase());
    }
    if (coupon_code) {
      extraUpdates.push("coupon_code = ?");
      extraValues.push(String(coupon_code).trim().toUpperCase());
    }
    if (coupon_remise) {
      extraUpdates.push("coupon_remise = ?");
      extraValues.push(Number(coupon_remise));
    }
    if (extraUpdates.length > 0) {
      await pool2.execute(
        `UPDATE orders SET ${extraUpdates.join(", ")} WHERE id = ?`,
        [...extraValues, id]
      );
    }
    if (isEchelonne && tranches) {
      await pool2.execute(
        "UPDATE orders SET status = 'plan_paiement' WHERE id = ?",
        [id]
      );
      await createPaymentPlan({
        order_id: id,
        nb_tranches: tranches,
        montant_total: Number(total ?? 0)
      });
      await addOrderEvent(
        id,
        "plan_paiement",
        `Paiement en ${tranches} fois \u2014 tranche 1 \xE0 r\xE9gler pour confirmer`
      );
    } else if (payment_mode === "moov_direct" || payment_mode === "yas_direct") {
      await addOrderEvent(id, "pending", "Commande pass\xE9e en ligne \u2014 v\xE9rification paiement mobile money en attente");
    } else {
      await pool2.execute("UPDATE orders SET status = 'confirmed' WHERE id = ?", [id]);
      await addOrderEvent(id, "confirmed", "Confirm\xE9 automatiquement (paiement \xE0 la livraison)");
      try {
        const [[existingLiv]] = await pool2.execute(
          "SELECT id FROM livraisons_ventes WHERE order_id = ? LIMIT 1",
          [id]
        );
        if (!existingLiv) {
          const [[orderRow]] = await pool2.execute(
            "SELECT reference FROM orders WHERE id = ? LIMIT 1",
            [id]
          );
          const livRef = `LV-${orderRow?.reference ?? id}`;
          await pool2.execute(
            `INSERT IGNORE INTO livraisons_ventes
               (reference, facture_id, client_nom, client_tel, adresse, contact_livraison,
                lien_localisation, statut, note, order_id)
             VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', NULL, ?)`,
            [
              livRef,
              nom ?? null,
              cleanTelephone ?? null,
              adresse ?? null,
              cleanTelephone ?? null,
              lien_localisation ?? null,
              id
            ]
          );
        }
      } catch (e) {
        console.error("[orders] auto livraison creation failed:", e);
      }
    }
    await ensureOrderVente(id);
    const [rows] = await pool2.execute(
      "SELECT reference, created_at FROM orders WHERE id = ? LIMIT 1",
      [id]
    );
    const reference = rows[0]?.reference ?? `CMD-${id}`;
    emitAdminEvent("commande", {
      id,
      reference,
      nom: nom ?? "",
      total: Number(total ?? 0),
      created_at: String(rows[0]?.created_at ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "))
    });
    sendOrderNotifications({
      id,
      reference,
      nom: nom ?? "",
      telephone: cleanTelephone,
      items: items ?? [],
      total: Number(total ?? 0)
    }).catch(console.error);
    return res.json({ success: true, id, reference, payment_mode: payment_mode ?? "comptant" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var orders_default2 = router27;

// routes/mobile-money.ts
var import_express28 = __toESM(require("express"));
init_db();
init_admin_db();
var router28 = import_express28.default.Router();
var FEDAPAY_BASE = "https://api.fedapay.com/v1";
function fedapayHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.FEDAPAY_SECRET_KEY}`
  };
}
var OPERATOR_MODE = {
  flooz: "moov",
  yas: "moov"
};
router28.get("/api/debug/fedapay-test", async (req, res) => {
  const phone = String(req.query.phone || "90000000");
  const log = { phone };
  try {
    const custRes = await fetch(`${FEDAPAY_BASE}/customers`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({ firstname: "Test", lastname: "Debug", phone_number: { number: phone, country: "tg" } })
    });
    const custData = await custRes.json();
    log.step1_status = custRes.status;
    log.step1_customer = custData;
    const customerId = custData?.["v1/customer"]?.id;
    if (!customerId) return res.json({ ok: false, error: "customer creation failed", log });
    const txRes = await fetch(`${FEDAPAY_BASE}/transactions`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        description: "Test diagnostic",
        amount: 100,
        currency: { iso: "XOF" },
        callback_url: "https://example.com/webhook",
        customer: { id: customerId }
      })
    });
    const txData = await txRes.json();
    log.step2_status = txRes.status;
    log.step2_transaction = txData;
    const txId = txData?.["v1/transaction"]?.id;
    if (!txId) return res.json({ ok: false, error: "transaction creation failed", log });
    const tokenRes = await fetch(`${FEDAPAY_BASE}/transactions/${txId}/token`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({})
    });
    const tokenData = await tokenRes.json();
    log.step3_status = tokenRes.status;
    log.step3_token = tokenData;
    const token = tokenData.token;
    if (!token) return res.json({ ok: false, error: "no token", log });
    const pushRes = await fetch(`${FEDAPAY_BASE}/moov`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({ token })
    });
    const pushData = await pushRes.json();
    log.step4_status = pushRes.status;
    log.step4_push = pushData;
    return res.json({ ok: pushRes.ok, log });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err), log });
  }
});
router28.post("/api/orders/pay/mobile-money", async (req, res) => {
  try {
    const { orderId, orderRef, operator, phone, total, nom } = req.body;
    if (!orderId || !operator || !phone || !total) {
      return res.status(400).json({ error: "Param\xE8tres manquants." });
    }
    const mode = OPERATOR_MODE[operator];
    if (!mode) return res.status(400).json({ error: "Op\xE9rateur non support\xE9." });
    const cleanPhone2 = phone.replace(/\D/g, "").replace(/^228/, "");
    const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://togolese.tg";
    const parts = (nom || "Client").trim().split(/\s+/);
    const firstname = parts[0];
    const lastname = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
    const custRes = await fetch(`${FEDAPAY_BASE}/customers`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        firstname,
        lastname,
        phone_number: { number: cleanPhone2, country: "tg" }
      })
    });
    const custData = await custRes.json();
    const customerId = custData?.["v1/customer"]?.id;
    if (!customerId) {
      console.error("[fedapay] create customer failed:", JSON.stringify(custData));
      return res.status(502).json({ error: "Impossible de cr\xE9er le client FedaPay." });
    }
    const txRes = await fetch(`${FEDAPAY_BASE}/transactions`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        description: `Commande ${orderRef}`,
        amount: Math.round(total),
        currency: { iso: "XOF" },
        callback_url: `${process.env.BACKEND_URL || ""}/api/webhooks/fedapay`,
        return_url: `${siteUrl}/account/commandes`,
        customer: { id: customerId }
      })
    });
    const txData = await txRes.json();
    const tx = txData?.["v1/transaction"];
    const txId = tx?.id;
    const token = tx?.payment_token;
    if (!txId || !token) {
      console.error("[fedapay] create transaction failed:", JSON.stringify(txData));
      return res.status(502).json({ error: "Impossible de cr\xE9er la transaction FedaPay." });
    }
    const pushRes = await fetch(`${FEDAPAY_BASE}/${mode}`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({ token })
    });
    const pushData = await pushRes.json();
    if (!pushRes.ok) {
      console.error("[fedapay] USSD push failed:", JSON.stringify(pushData));
      return res.status(502).json({ error: pushData.message || "Erreur lors de l'envoi du push USSD." });
    }
    const pool2 = db;
    try {
      await pool2.execute("ALTER TABLE orders ADD COLUMN fedapay_tx_id INT NULL", []);
    } catch {
    }
    try {
      await pool2.execute("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'non_paye'", []);
    } catch {
    }
    await pool2.execute(
      "UPDATE orders SET fedapay_tx_id = ?, payment_status = 'en_attente' WHERE id = ?",
      [txId, orderId]
    );
    return res.json({ ok: true, transactionId: txId });
  } catch (err) {
    console.error("[mobile-money pay]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
router28.get("/api/orders/pay/status/:txId", async (req, res) => {
  try {
    const txId = Number(req.params.txId);
    const pool2 = db;
    const [rows] = await pool2.execute(
      "SELECT payment_status FROM orders WHERE fedapay_tx_id = ? LIMIT 1",
      [txId]
    );
    const paymentStatus = rows[0]?.payment_status;
    return res.json({ status: paymentStatus === "paye" ? "approved" : "pending" });
  } catch (err) {
    console.error("[mobile-money status]", err);
    return res.status(500).json({ error: "Erreur statut." });
  }
});
router28.post("/api/webhooks/fedapay", async (req, res) => {
  try {
    const event = req.body;
    if (event.name !== "transaction.approved") {
      return res.json({ received: true });
    }
    const txId = event.entity?.id;
    const amount = event.entity?.amount;
    if (!txId) return res.json({ received: true });
    const pool2 = db;
    const [rows] = await pool2.execute(
      "SELECT id, reference, nom, total FROM orders WHERE fedapay_tx_id = ? LIMIT 1",
      [txId]
    );
    const order = rows[0];
    if (!order) return res.json({ received: true });
    await pool2.execute(
      "UPDATE orders SET payment_status = 'paye', status = 'confirm\xE9e' WHERE id = ?",
      [order.id]
    );
    await addOrderEvent(order.id, "confirm\xE9e", `Paiement Mobile Money confirm\xE9 \u2014 ${amount ? `${amount} FCFA` : ""}`);
    emitAdminEvent("paiement", {
      orderId: order.id,
      reference: order.reference,
      nom: order.nom,
      total: order.total
    });
    return res.json({ received: true });
  } catch (err) {
    console.error("[webhook/fedapay]", err);
    return res.status(500).json({ error: "Erreur webhook." });
  }
});
var mobile_money_default = router28;

// index.ts
init_admin_db();

// routes/admin/security-logs.ts
var import_express29 = __toESM(require("express"));
var router29 = import_express29.default.Router();
router29.get("/api/admin/security-logs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 aux administrateurs." });
  }
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const shopId = session.role === "super_admin" ? void 0 : session.shop_id;
  const logs = await getSecurityLogs(limit, shopId);
  res.json({ logs });
});
var security_logs_default = router29;

// routes/admin/rapports.ts
var import_express30 = __toESM(require("express"));
init_db();
var router30 = import_express30.default.Router();
function periodClause(col, periode) {
  switch (periode) {
    case "aujourd_hui":
      return `DATE(${col}) = CURDATE()`;
    case "cette_semaine":
      return `YEARWEEK(${col}, 1) = YEARWEEK(NOW(), 1)`;
    case "ce_mois":
      return `YEAR(${col}) = YEAR(NOW()) AND MONTH(${col}) = MONTH(NOW())`;
    case "ce_trimestre":
      return `QUARTER(${col}) = QUARTER(NOW()) AND YEAR(${col}) = YEAR(NOW())`;
    case "cette_annee":
      return `YEAR(${col}) = YEAR(NOW())`;
    default:
      return "1=1";
  }
}
router30.get("/api/admin/rapports", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const type = req.query.type || "ventes";
  const periode = req.query.periode || "ce_mois";
  const statut = req.query.statut || "all";
  const utilisateur = req.query.utilisateur || "all";
  try {
    let rows = [];
    let utilisateurs = [];
    const [uRows] = await db.execute(
      `SELECT id, nom FROM admin_users WHERE actif = 1 ORDER BY nom`
    );
    utilisateurs = uRows;
    const pc = periodClause;
    if (type === "ventes") {
      const conditions = [
        pc("f.created_at", periode),
        "(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)"
      ];
      const params = [];
      if (statut !== "all") {
        if (statut === "paye") {
          conditions.push("f.statut_paiement = 'paye_total'");
        } else {
          conditions.push("f.statut = ?");
          params.push(statut);
        }
      }
      if (utilisateur !== "all") {
        conditions.push("f.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT f.id, f.reference, f.created_at, f.client_nom,
                CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web'
                     ELSE COALESCE(au.nom, util.nom) END AS vendeur,
                f.total,
                CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS montant_paye,
                f.total - CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS reste,
                f.statut_paiement, f.statut
         FROM factures f
         LEFT JOIN orders _so        ON _so.id   = f.order_id AND _so.status = 'delivered'
         LEFT JOIN admin_users au    ON au.id     = f.admin_id
         LEFT JOIN utilisateurs util ON util.id   = f.admin_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "achats") {
      const conditions = [pc("a.date_achat", periode)];
      const params = [];
      if (statut !== "all") {
        conditions.push("a.statut = ?");
        params.push(statut);
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT a.id,
                a.reference,
                a.date_achat   AS created_at,
                f.nom          AS client_nom,
                a.fournisseur_id AS vendeur,
                a.montant_total AS total,
                a.montant_total AS montant_paye,
                0               AS reste,
                a.statut        AS statut_paiement,
                a.statut
         FROM achats a
         LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
         ${where}
         ORDER BY a.date_achat DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "depenses") {
      const conditions = ["fe.type = 'depense'", pc("fe.date_entree", periode)];
      const params = [];
      if (utilisateur !== "all") {
        conditions.push("fe.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                fe.description AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "rentrees") {
      const conditions = ["fe.type = 'rentree'", pc("fe.date_entree", periode)];
      const params = [];
      if (utilisateur !== "all") {
        conditions.push("fe.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                fe.description AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "combine") {
      const conditions = ["fe.type IN ('depense','rentree')", pc("fe.date_entree", periode)];
      const params = [];
      if (utilisateur !== "all") {
        conditions.push("fe.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                CONCAT('[', UPPER(fe.type), '] ', COALESCE(fe.description, '')) AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "financier") {
      const conditions = [pc("fe.date_entree", periode)];
      const params = [];
      if (utilisateur !== "all") {
        conditions.push("fe.admin_id = ?");
        params.push(Number(utilisateur));
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT fe.id,
                fe.reference,
                fe.date_entree AS created_at,
                CONCAT('[', UPPER(fe.type), '] ', COALESCE(fe.description, '')) AS client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                fe.montant     AS total,
                fe.montant     AS montant_paye,
                0              AS reste,
                'paye_total'   AS statut_paiement,
                fe.type        AS statut
         FROM finance_entries fe
         LEFT JOIN admin_users au    ON au.id   = fe.admin_id
         LEFT JOIN utilisateurs util ON util.id = fe.admin_id
         ${where}
         ORDER BY fe.date_entree DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "mobile_money") {
      const conditions = [
        "f.mode_paiement IN ('moov_money','tmoney','mobile_money')",
        pc("f.created_at", periode),
        "(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)"
      ];
      const params = [];
      if (statut !== "all") {
        conditions.push("f.statut_paiement = ?");
        params.push(statut === "paye" ? "paye_total" : statut);
      }
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT f.id, f.reference, f.created_at, f.client_nom,
                COALESCE(au.nom, util.nom) AS vendeur,
                f.total,
                CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS montant_paye,
                f.total - CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END AS reste,
                f.statut_paiement, f.statut
         FROM factures f
         LEFT JOIN orders _so        ON _so.id   = f.order_id AND _so.status = 'delivered'
         LEFT JOIN admin_users au    ON au.id   = f.admin_id
         LEFT JOIN utilisateurs util ON util.id = f.admin_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "clients") {
      const conditions = [pc("bc.created_at", periode)];
      const params = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT bc.id,
                CONCAT('CLI-', LPAD(bc.id, 4, '0')) AS reference,
                bc.created_at,
                bc.nom    AS client_nom,
                bc.telephone AS vendeur,
                COALESCE(bc.solde, 0) AS total,
                COALESCE(bc.solde, 0) AS montant_paye,
                0 AS reste,
                bc.type_client AS statut_paiement,
                bc.type_client AS statut
         FROM boutique_clients bc
         ${where}
         ORDER BY bc.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "produits") {
      const conditions = [pc("p.created_at", periode)];
      const params = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT p.id,
                CONCAT('PRD-', LPAD(p.id, 4, '0')) AS reference,
                p.created_at,
                p.nom AS client_nom,
                c.nom AS vendeur,
                p.prix AS total,
                p.prix AS montant_paye,
                0 AS reste,
                CASE WHEN p.stock > 0 THEN 'en_stock' ELSE 'rupture' END AS statut_paiement,
                CASE WHEN p.stock > 0 THEN 'en_stock' ELSE 'rupture' END AS statut
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "stock") {
      const conditions = [pc("sm.created_at", periode)];
      const params = [];
      const where = "WHERE " + conditions.join(" AND ");
      const [r] = await db.execute(
        `SELECT sm.id,
                CONCAT('STK-', LPAD(sm.id, 4, '0')) AS reference,
                sm.created_at,
                p.nom AS client_nom,
                sm.type AS vendeur,
                sm.quantite AS total,
                sm.quantite AS montant_paye,
                0 AS reste,
                sm.type AS statut_paiement,
                sm.type AS statut
         FROM stock_boutique_mouvements sm
         LEFT JOIN products p ON p.id = sm.product_id
         ${where}
         ORDER BY sm.created_at DESC
         LIMIT 500`,
        params
      );
      rows = r;
    } else if (type === "activites") {
      const pVentes = pc("f.created_at", periode);
      const pFinance = pc("fe.date_entree", periode);
      const pAchats = pc("a.date_achat", periode);
      const [r] = await db.execute(
        `(SELECT f.reference, f.created_at, f.client_nom,
                 COALESCE(au.nom, util.nom) AS vendeur,
                 f.total, f.statut
          FROM factures f
          LEFT JOIN orders _so        ON _so.id = f.order_id AND _so.status = 'delivered'
          LEFT JOIN admin_users au    ON au.id  = f.admin_id
          LEFT JOIN utilisateurs util ON util.id = f.admin_id
          WHERE ${pVentes}
            AND (f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL))
         UNION ALL
         (SELECT fe.reference, fe.date_entree AS created_at,
                 CONCAT('[',UPPER(fe.type),'] ',COALESCE(fe.description,'')) AS client_nom,
                 COALESCE(au2.nom, util2.nom) AS vendeur,
                 fe.montant AS total, fe.type AS statut
          FROM finance_entries fe
          LEFT JOIN admin_users au2 ON au2.id = fe.admin_id
          LEFT JOIN utilisateurs util2 ON util2.id = fe.admin_id
          WHERE ${pFinance})
         UNION ALL
         (SELECT a.reference, a.date_achat AS created_at,
                 frs.nom AS client_nom, NULL AS vendeur,
                 a.montant_total AS total, a.statut
          FROM achats a
          LEFT JOIN fournisseurs frs ON frs.id = a.fournisseur_id
          WHERE ${pAchats})
         ORDER BY created_at DESC
         LIMIT 500`
      );
      rows = r;
    }
    res.json({ rows, utilisateurs });
  } catch (err) {
    console.error("[rapports]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
var rapports_default = router30;

// routes/admin/tendances.ts
var import_express31 = __toESM(require("express"));
init_db();
var router31 = import_express31.default.Router();
var MOIS_LABELS = ["Jan", "F\xE9v", "Mar", "Avr", "Mai", "Jun", "Jul", "Ao\xFB", "Sep", "Oct", "Nov", "D\xE9c"];
var SITE_JOIN = `LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status = 'delivered'`;
var SITE_COND = `(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)`;
router31.get("/api/admin/tendances", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const periode = req.query.periode || "mensuelle";
  const annee = Number(req.query.annee) || (/* @__PURE__ */ new Date()).getFullYear();
  const prevAnnee = annee - 1;
  try {
    const [[statsRow]] = await db.execute(
      `SELECT
         COUNT(*) AS nb_ventes,
         COALESCE(SUM(f.total), 0) AS ca,
         COALESCE(AVG(f.total), 0) AS panier_moyen,
         COALESCE(SUM(CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END), 0) AS montant_paye_total
       FROM factures f
       ${SITE_JOIN}
       WHERE YEAR(f.created_at) = ? AND f.statut != 'annule'
         AND ${SITE_COND}`,
      [annee]
    );
    const stats = {
      nb_ventes: Number(statsRow?.nb_ventes ?? 0),
      ca: Math.round(Number(statsRow?.ca ?? 0)),
      panier_moyen: Math.round(Number(statsRow?.panier_moyen ?? 0)),
      annee
    };
    let evolutionRows = [];
    if (periode === "mensuelle") {
      const [rows] = await db.execute(
        `SELECT
           MONTH(f.created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(f.total), 0) AS ca,
           COALESCE(AVG(f.total), 0) AS panier_moyen,
           COALESCE(SUM(CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END), 0) AS montant_paye
         FROM factures f
         ${SITE_JOIN}
         WHERE YEAR(f.created_at) = ? AND f.statut != 'annule'
           AND ${SITE_COND}
         GROUP BY MONTH(f.created_at)
         ORDER BY mois`,
        [annee]
      );
      evolutionRows = rows;
    } else if (periode === "trimestrielle") {
      const [rows] = await db.execute(
        `SELECT
           QUARTER(f.created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(f.total), 0) AS ca,
           COALESCE(AVG(f.total), 0) AS panier_moyen,
           COALESCE(SUM(CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END), 0) AS montant_paye
         FROM factures f
         ${SITE_JOIN}
         WHERE YEAR(f.created_at) = ? AND f.statut != 'annule'
           AND ${SITE_COND}
         GROUP BY QUARTER(f.created_at)
         ORDER BY mois`,
        [annee]
      );
      evolutionRows = rows;
    } else {
      const [rows] = await db.execute(
        `SELECT
           YEAR(f.created_at) AS mois,
           COUNT(*) AS nb_ventes,
           COALESCE(SUM(f.total), 0) AS ca,
           COALESCE(AVG(f.total), 0) AS panier_moyen,
           COALESCE(SUM(CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END), 0) AS montant_paye
         FROM factures f
         ${SITE_JOIN}
         WHERE f.statut != 'annule'
           AND ${SITE_COND}
         GROUP BY YEAR(f.created_at)
         ORDER BY mois`
      );
      evolutionRows = rows;
    }
    const evolution = evolutionRows.map((r) => {
      let label;
      if (periode === "mensuelle") label = `${MOIS_LABELS[Number(r.mois) - 1]} ${annee}`;
      else if (periode === "trimestrielle") label = `T${r.mois} ${annee}`;
      else label = String(r.mois);
      return {
        label,
        mois: Number(r.mois),
        nb_ventes: Number(r.nb_ventes),
        ca: Math.round(Number(r.ca)),
        panier_moyen: Math.round(Number(r.panier_moyen)),
        montant_paye: Math.round(Number(r.montant_paye))
      };
    });
    const details = evolution.map((e) => ({
      periode: e.label,
      nb_ventes: e.nb_ventes,
      ca: e.ca,
      panier_moyen: e.panier_moyen,
      montant_paye: e.montant_paye
    }));
    let topProduits = [];
    try {
      const [prodRows] = await db.execute(
        `SELECT
           jt.nom,
           SUM(jt.qty) AS quantite,
           SUM(jt.total) AS ca
         FROM factures f
         ${SITE_JOIN},
         JSON_TABLE(
           f.items, '$[*]'
           COLUMNS (
             nom   VARCHAR(255) PATH '$.nom',
             qty   INT          PATH '$.qty',
             total DECIMAL(12,2) PATH '$.total'
           )
         ) AS jt
         WHERE YEAR(f.created_at) = ? AND f.statut != 'annule' AND jt.nom IS NOT NULL
           AND ${SITE_COND}
         GROUP BY jt.nom
         ORDER BY ca DESC
         LIMIT 10`,
        [annee]
      );
      const totalCA = prodRows.reduce((s, r) => s + Number(r.ca), 0) || 1;
      topProduits = prodRows.map((r) => ({
        nom: String(r.nom),
        quantite: Number(r.quantite),
        ca: Math.round(Number(r.ca)),
        pourcentage: Math.round(Number(r.ca) / totalCA * 1e3) / 10
      }));
    } catch {
    }
    const [methRows] = await db.execute(
      `SELECT
         COALESCE(f.mode_paiement, 'especes') AS methode,
         COUNT(*) AS nb_ventes,
         COALESCE(SUM(CASE WHEN f.statut_paiement = 'paye_total' THEN f.total ELSE COALESCE(f.montant_acompte, 0) END), 0) AS montant
       FROM factures f
       ${SITE_JOIN}
       WHERE YEAR(f.created_at) = ? AND f.statut != 'annule' AND f.statut_paiement != 'non_paye'
         AND ${SITE_COND}
       GROUP BY f.mode_paiement
       ORDER BY montant DESC`,
      [annee]
    );
    const totalMeth = methRows.reduce((s, r) => s + Number(r.montant), 0) || 1;
    const METH_LABELS = {
      especes: "Esp\xE8ces",
      moov_money: "Moov Money",
      tmoney: "TMoney",
      virement_bancaire: "Virement bancaire",
      mix_by_yas: "Mix by Yas"
    };
    const methodesPaiement = methRows.map((r) => ({
      methode: METH_LABELS[String(r.methode)] ?? String(r.methode),
      nb_ventes: Number(r.nb_ventes),
      montant: Math.round(Number(r.montant)),
      pourcentage: Math.round(Number(r.montant) / totalMeth * 1e3) / 10
    }));
    const [compRows] = await db.execute(
      `SELECT YEAR(f.created_at) AS annee, MONTH(f.created_at) AS mois,
              COALESCE(SUM(f.total), 0) AS ca
       FROM factures f
       ${SITE_JOIN}
       WHERE YEAR(f.created_at) IN (?, ?) AND f.statut != 'annule'
         AND ${SITE_COND}
       GROUP BY annee, mois
       ORDER BY annee, mois`,
      [prevAnnee, annee]
    );
    const caByYearMonth = {
      [prevAnnee]: {},
      [annee]: {}
    };
    for (const r of compRows) {
      const y = Number(r.annee);
      const m = Number(r.mois);
      if (caByYearMonth[y]) caByYearMonth[y][m] = Math.round(Number(r.ca));
    }
    const comparaison = {
      labels: MOIS_LABELS,
      annee_courante: MOIS_LABELS.map((_, i) => caByYearMonth[annee]?.[i + 1] ?? 0),
      annee_precedente: MOIS_LABELS.map((_, i) => caByYearMonth[prevAnnee]?.[i + 1] ?? 0)
    };
    res.json({ stats, evolution, details, top_produits: topProduits, methodes_paiement: methodesPaiement, comparaison });
  } catch (err) {
    console.error("[tendances]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
var tendances_default = router31;

// routes/admin/performance-produits.ts
var import_express32 = __toESM(require("express"));
init_db();
var router32 = import_express32.default.Router();
async function ensurePrixAchat() {
  try {
    await db.execute(`ALTER TABLE products ADD COLUMN prix_achat DECIMAL(12,2) NULL DEFAULT NULL`);
  } catch {
  }
}
ensurePrixAchat().catch(console.error);
router32.get("/api/admin/performance-produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const dateDebut = req.query.date_debut || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1).toISOString().slice(0, 10);
  const dateFin = req.query.date_fin || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const top = Math.min(50, Math.max(5, Number(req.query.top) || 10));
  try {
    let produits = [];
    try {
      const [rows] = await db.execute(
        `SELECT
           jt.nom,
           jt.ref AS reference,
           COALESCE(
             (SELECT p.prix_unitaire FROM products p WHERE p.reference = jt.ref LIMIT 1),
             jt.prix_u,
             0
           ) AS prix,
           (SELECT p.prix_achat FROM products p WHERE p.reference = jt.ref LIMIT 1) AS prix_achat,
           SUM(jt.qty)           AS quantite,
           SUM(jt.total)         AS ca,
           COUNT(DISTINCT f.id)  AS nb_ventes
         FROM factures f,
         JSON_TABLE(
           f.items, '$[*]'
           COLUMNS (
             nom    VARCHAR(255)   PATH '$.nom',
             ref    VARCHAR(100)   PATH '$.reference',
             qty    INT            PATH '$.qty',
             prix_u DECIMAL(12,2)  PATH '$.prix',
             total  DECIMAL(12,2)  PATH '$.total'
           )
         ) AS jt
         WHERE f.statut != 'annule'
           AND DATE(f.created_at) BETWEEN ? AND ?
           AND jt.nom IS NOT NULL
           AND (
             f.source IS NULL
             OR f.source != 'site_order'
             OR EXISTS (SELECT 1 FROM orders _so WHERE _so.id = f.order_id AND _so.status = 'delivered')
           )
         GROUP BY jt.nom, jt.ref
         ORDER BY ca DESC
         LIMIT ${top}`,
        [dateDebut, dateFin]
      );
      produits = rows.map((r) => {
        const ca = Math.round(Number(r.ca ?? 0));
        const qty = Number(r.quantite ?? 0);
        const prixAchat = r.prix_achat != null ? Number(r.prix_achat) : null;
        const coutTotal = prixAchat != null ? prixAchat * qty : 0;
        const margeBrute = prixAchat != null ? ca - coutTotal : ca;
        const tauxMarge = ca > 0 ? Math.round(margeBrute / ca * 1e3) / 10 : 0;
        return {
          nom: String(r.nom),
          reference: String(r.reference ?? ""),
          prix: Math.round(Number(r.prix ?? 0)),
          prix_achat: prixAchat,
          quantite: qty,
          ca,
          marge_brute: Math.round(margeBrute),
          taux_marge: tauxMarge,
          nb_ventes: Number(r.nb_ventes ?? 0)
        };
      });
    } catch (e) {
      console.error("[performance-produits] JSON_TABLE error:", e);
    }
    const stats = {
      nb_produits: produits.length,
      ca: produits.reduce((s, p) => s + p.ca, 0),
      marge_brute: produits.reduce((s, p) => s + p.marge_brute, 0),
      quantite_vendue: produits.reduce((s, p) => s + p.quantite, 0)
    };
    let evolution = [];
    try {
      const [evRows] = await db.execute(
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
           AND (
             f.source IS NULL
             OR f.source != 'site_order'
             OR EXISTS (SELECT 1 FROM orders _so WHERE _so.id = f.order_id AND _so.status = 'delivered')
           )
         GROUP BY DATE(f.created_at)
         ORDER BY date`,
        [dateDebut, dateFin]
      );
      evolution = evRows.map((r) => ({
        date: String(r.date).slice(0, 10),
        quantite: Number(r.quantite ?? 0),
        ca: Math.round(Number(r.ca ?? 0))
      }));
    } catch {
    }
    res.json({ stats, produits, evolution });
  } catch (err) {
    console.error("[performance-produits]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
var performance_produits_default = router32;

// routes/admin/whatsapp-inbox.ts
var import_express33 = __toESM(require("express"));
init_db();
init_admin_db();
var router33 = import_express33.default.Router();
var WA_GRAPH = "https://graph.facebook.com/v18.0";
async function ensureWaMessagesCols() {
  const alters = [
    "ALTER TABLE wa_messages ADD COLUMN media_id    VARCHAR(100) NULL",
    "ALTER TABLE wa_messages ADD COLUMN media_type  VARCHAR(30)  NOT NULL DEFAULT 'text'",
    "ALTER TABLE wa_messages ADD COLUMN mime_type   VARCHAR(100) NULL",
    "ALTER TABLE wa_messages ADD COLUMN notre_numero VARCHAR(30) NULL",
    "ALTER TABLE wa_messages ADD COLUMN shop_id     INT UNSIGNED NOT NULL DEFAULT 1"
  ];
  for (const sql of alters) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
}
router33.get("/api/admin/whatsapp/webhook", async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const savedToken = await getSetting("wa_webhook_verify_token", 1).catch(() => null);
  const expected = savedToken || process.env.WA_VERIFY_TOKEN || "";
  if (mode === "subscribe" && token === expected && expected) {
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});
router33.post("/api/admin/whatsapp/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return;
    const contactName = value.contacts?.[0]?.profile?.name ?? null;
    const notreNumero = value.metadata?.display_phone_number ? String(value.metadata.display_phone_number) : null;
    for (const msg of value.messages) {
      const from = String(msg.from ?? "");
      const waId = String(msg.id ?? "");
      const type = String(msg.type ?? "text");
      if (!from) continue;
      let body = "";
      let mediaId = null;
      let mimeType = null;
      if (type === "text") {
        body = String(msg.text?.body ?? "");
        if (!body) continue;
      } else if (type === "image") {
        const img = msg.image;
        body = String(img?.caption ?? "[Image]");
        mediaId = String(img?.id ?? "");
        mimeType = String(img?.mime_type ?? "image/jpeg");
      } else if (type === "audio") {
        const aud = msg.audio;
        body = "[Message vocal]";
        mediaId = String(aud?.id ?? "");
        mimeType = String(aud?.mime_type ?? "audio/ogg");
      } else if (type === "document") {
        const doc = msg.document;
        body = String(doc?.filename ?? "[Document]");
        mediaId = String(doc?.id ?? "");
        mimeType = String(doc?.mime_type ?? "application/octet-stream");
      } else {
        continue;
      }
      await db.execute(
        `INSERT IGNORE INTO wa_messages
           (telephone, direction, body, wa_message_id, contact_name, media_id, media_type, mime_type, notre_numero)
         VALUES (?, 'inbound', ?, ?, ?, ?, ?, ?, ?)`,
        [from, body, waId, contactName, mediaId || null, type, mimeType || null, notreNumero]
      );
      emitAdminEvent("message", { from, body, nom: contactName ?? from });
    }
  } catch (err) {
    console.error("[webhook/whatsapp/inbound]", err);
  }
});
router33.get("/api/admin/whatsapp/threads", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const shopId = session.shop_id ?? 1;
  try {
    const [rows] = await db.execute(`
      SELECT
        m.telephone,
        m.contact_name,
        m.body           AS dernier_message,
        m.direction      AS dernier_direction,
        m.media_type     AS dernier_type,
        m.created_at     AS last_at,
        m.notre_numero,
        t.total_messages,
        t.unread
      FROM wa_messages m
      INNER JOIN (
        SELECT
          telephone,
          MAX(id)                                                            AS last_id,
          COUNT(*)                                                           AS total_messages,
          SUM(CASE WHEN direction = 'inbound' AND lu = 0 THEN 1 ELSE 0 END) AS unread
        FROM wa_messages
        WHERE shop_id = ?
        GROUP BY telephone
      ) t ON t.telephone = m.telephone AND t.last_id = m.id
      WHERE m.shop_id = ?
      ORDER BY last_at DESC
      LIMIT 200
    `, [shopId, shopId]);
    res.json({ threads: rows });
  } catch (err) {
    console.error("[whatsapp/threads]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router33.get("/api/admin/whatsapp/threads/:phone", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { phone } = req.params;
  const shopId2 = session.shop_id ?? 1;
  try {
    const [rows] = await db.execute(
      `SELECT id, direction, body, sent_by, contact_name, lu, media_id, media_type, mime_type, created_at
       FROM wa_messages
       WHERE telephone = ? AND shop_id = ?
       ORDER BY created_at ASC
       LIMIT 500`,
      [phone, shopId2]
    );
    res.json({ messages: rows });
    await db.execute(
      "UPDATE wa_messages SET lu = 1 WHERE telephone = ? AND shop_id = ? AND direction = 'inbound' AND lu = 0",
      [phone, shopId2]
    ).catch(() => {
    });
  } catch (err) {
    console.error("[whatsapp/thread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router33.get("/api/admin/whatsapp/media/:mediaId", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end();
  try {
    const token = await getSetting("wa_access_token", session.shop_id ?? 1);
    if (!token) return res.status(503).end();
    const infoRes = await fetch(`${WA_GRAPH}/${req.params.mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!infoRes.ok) return res.status(404).end();
    const { url } = await infoRes.json();
    if (!url) return res.status(404).end();
    const mediaRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!mediaRes.ok) return res.status(404).end();
    const ct = mediaRes.headers.get("content-type") ?? "application/octet-stream";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "private, max-age=3600");
    const buf = await mediaRes.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error("[whatsapp/media]", err);
    res.status(500).end();
  }
});
router33.post("/api/admin/whatsapp/threads/:phone/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { phone } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "Message vide" });
  const result = await sendWaText({ to: phone, body: body.trim() });
  if (!result.success) return res.status(502).json({ error: result.error });
  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_type, shop_id)
     VALUES (?, 'outbound', ?, ?, 'text', ?)`,
    [phone, body.trim(), session.nom ?? session.username ?? "admin", session.shop_id ?? 1]
  ).catch(() => {
  });
  emitAdminEvent("message", { type_action: "sent", to: phone });
  res.json({ ok: true });
});
router33.post("/api/admin/whatsapp/threads/:phone/send-image", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { phone } = req.params;
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  await new Promise((r) => req.on("end", r));
  const buffer = Buffer.concat(chunks);
  const mimeType = (req.headers["content-type"] ?? "image/jpeg").split(";")[0];
  const caption = String(req.headers["x-caption"] ?? "");
  if (buffer.length === 0) return res.status(400).json({ error: "Fichier vide" });
  if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ error: "Image > 5 Mo" });
  const up = await uploadWaMedia(buffer, mimeType, `image.${mimeType.split("/")[1] ?? "jpg"}`);
  if (!up.success || !up.mediaId) return res.status(502).json({ error: up.error });
  const send = await sendWaImage({ to: phone, mediaId: up.mediaId, caption });
  if (!send.success) return res.status(502).json({ error: send.error });
  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_id, media_type, mime_type, shop_id)
     VALUES (?, 'outbound', ?, ?, ?, 'image', ?, ?)`,
    [phone, caption || "[Image]", session.nom ?? "admin", up.mediaId, mimeType, session.shop_id ?? 1]
  ).catch(() => {
  });
  res.json({ ok: true });
});
router33.post("/api/admin/whatsapp/threads/:phone/send-audio", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { phone } = req.params;
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  await new Promise((r) => req.on("end", r));
  const buffer = Buffer.concat(chunks);
  const mimeType = (req.headers["content-type"] ?? "audio/ogg").split(";")[0];
  if (buffer.length === 0) return res.status(400).json({ error: "Audio vide" });
  if (buffer.length > 16 * 1024 * 1024) return res.status(413).json({ error: "Audio > 16 Mo" });
  const up = await uploadWaMedia(buffer, mimeType, `voice.${mimeType.split("/")[1] ?? "ogg"}`);
  if (!up.success || !up.mediaId) return res.status(502).json({ error: up.error });
  const send = await sendWaAudio({ to: phone, mediaId: up.mediaId });
  if (!send.success) return res.status(502).json({ error: send.error });
  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_id, media_type, mime_type, shop_id)
     VALUES (?, 'outbound', '[Message vocal]', ?, ?, 'audio', ?, ?)`,
    [phone, session.nom ?? "admin", up.mediaId, mimeType, session.shop_id ?? 1]
  ).catch(() => {
  });
  res.json({ ok: true });
});
router33.delete("/api/admin/whatsapp/threads/:phone", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9" });
  const { phone } = req.params;
  try {
    await db.execute("DELETE FROM wa_messages WHERE telephone = ? AND shop_id = ?", [phone, session.shop_id ?? 1]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp/delete thread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var whatsapp_inbox_default = router33;

// routes/whatsapp-webhook.ts
var import_express34 = __toESM(require("express"));
init_db();
var router34 = import_express34.default.Router();
var VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN ?? "togolese_webhook";
async function ensureWaMessagesTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wa_messages (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        telephone     VARCHAR(30)  NOT NULL,
        direction     ENUM('inbound','outbound') NOT NULL,
        body          TEXT         NOT NULL,
        wa_message_id VARCHAR(100) NULL,
        contact_name  VARCHAR(100) NULL,
        lu            TINYINT(1)   NOT NULL DEFAULT 0,
        sent_by       VARCHAR(100) NULL,
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_telephone  (telephone),
        INDEX idx_created_at (created_at)
      )
    `);
  } catch (err) {
    console.error("[ensureWaMessagesTable]", err);
  }
}
router34.get("/api/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});
router34.post("/api/webhooks/whatsapp", async (req, res) => {
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return;
    const contactName = value.contacts?.[0]?.profile?.name ?? null;
    for (const msg of value.messages) {
      if (msg.type !== "text") continue;
      const from = String(msg.from ?? "");
      const body = String(msg.text?.body ?? "");
      const waId = String(msg.id ?? "");
      if (!from || !body) continue;
      await db.execute(
        `INSERT INTO wa_messages (telephone, direction, body, wa_message_id, contact_name)
         VALUES (?, 'inbound', ?, ?, ?)`,
        [from, body, waId, contactName]
      );
      emitAdminEvent("message", {
        from,
        body,
        nom: contactName ?? from
      });
    }
  } catch (err) {
    console.error("[webhook/whatsapp]", err);
  }
});
var whatsapp_webhook_default = router34;

// routes/analytics.ts
var import_express35 = __toESM(require("express"));
init_db();
var import_http = __toESM(require("http"));
var router35 = import_express35.default.Router();
async function ensurePageViewsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS page_views (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      page        VARCHAR(500)  NOT NULL,
      referrer    VARCHAR(500)  NULL,
      device      ENUM('mobile','tablet','desktop') NOT NULL DEFAULT 'desktop',
      session_id  VARCHAR(64)   NOT NULL,
      visitor_id  VARCHAR(64)   NULL,
      pays        VARCHAR(100)  NULL,
      ville       VARCHAR(100)  NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_page       (page(100)),
      INDEX idx_session    (session_id),
      INDEX idx_visitor    (visitor_id),
      INDEX idx_pays       (pays)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const cols = [
    `ALTER TABLE page_views ADD COLUMN visitor_id VARCHAR(64) NULL`,
    `ALTER TABLE page_views ADD COLUMN pays       VARCHAR(100) NULL`,
    `ALTER TABLE page_views ADD COLUMN ville      VARCHAR(100) NULL`,
    `ALTER TABLE page_views ADD INDEX idx_visitor (visitor_id)`,
    `ALTER TABLE page_views ADD INDEX idx_pays    (pays)`
  ];
  for (const sql of cols) {
    try {
      await db.execute(sql);
    } catch {
    }
  }
}
ensurePageViewsTable().catch(console.error);
async function purgeOldPageViews() {
  await db.execute(
    `DELETE FROM page_views WHERE created_at < NOW() - INTERVAL 90 DAY`
  );
}
purgeOldPageViews().catch(() => {
});
var ipCache = /* @__PURE__ */ new Map();
var IP_CACHE_TTL = 24 * 60 * 60 * 1e3;
function geoFromIp(ip) {
  return new Promise((resolve2) => {
    const cached = ipCache.get(ip);
    if (cached && Date.now() - cached.ts < IP_CACHE_TTL) {
      return resolve2({ pays: cached.pays, ville: cached.ville });
    }
    if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return resolve2({ pays: "Local", ville: "" });
    }
    const url = `http://ip-api.com/json/${ip}?fields=status,country,city&lang=fr`;
    import_http.default.get(url, (res) => {
      let raw = "";
      res.on("data", (d) => {
        raw += d;
      });
      res.on("end", () => {
        try {
          const j = JSON.parse(raw);
          const result = j.status === "success" ? { pays: j.country ?? "Inconnu", ville: j.city ?? "" } : { pays: "Inconnu", ville: "" };
          ipCache.set(ip, { ...result, ts: Date.now() });
          resolve2(result);
        } catch {
          resolve2({ pays: "Inconnu", ville: "" });
        }
      });
    }).on("error", () => resolve2({ pays: "Inconnu", ville: "" }));
  });
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = String(forwarded).split(",");
    return ips[0].trim();
  }
  return req.socket?.remoteAddress ?? "";
}
router35.post("/api/analytics/hit", async (req, res) => {
  try {
    const { page, referrer, device, session_id, visitor_id } = req.body;
    if (!page || !session_id) return res.status(400).json({ ok: false });
    const safeDevice = ["mobile", "tablet", "desktop"].includes(device ?? "") ? device : "desktop";
    const safePage = String(page).slice(0, 500);
    const safeReferrer = referrer ? String(referrer).slice(0, 500) : null;
    const safeSessionId = String(session_id).slice(0, 64);
    const safeVisitorId = visitor_id ? String(visitor_id).slice(0, 64) : null;
    const ip = getClientIp(req);
    await db.execute(
      `INSERT INTO page_views (page, referrer, device, session_id, visitor_id) VALUES (?, ?, ?, ?, ?)`,
      [safePage, safeReferrer, safeDevice, safeSessionId, safeVisitorId]
    );
    res.json({ ok: true });
    const [insertResult] = await db.execute(
      `SELECT LAST_INSERT_ID() AS id`
    );
    const insertId = insertResult[0]?.id;
    if (insertId && ip) {
      geoFromIp(ip).then(({ pays, ville }) => {
        db.execute(
          `UPDATE page_views SET pays = ?, ville = ? WHERE id = ?`,
          [pays, ville || null, insertId]
        ).catch(() => {
        });
      });
    }
  } catch (err) {
    console.error("[analytics/hit]", err);
    res.status(500).json({ ok: false });
  }
});
var JOURS = ["", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
router35.get("/api/admin/analytics", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [[kpi]] = await db.execute(`
      SELECT
        COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE()
              THEN session_id END)                                      AS sessions_today,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 7 DAY
              THEN session_id END)                                      AS sessions_7j,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 30 DAY
              THEN session_id END)                                      AS sessions_30j,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END)          AS vues_today,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 END)  AS vues_7j,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN 1 END) AS vues_30j,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 5 MINUTE
              THEN session_id END)                                      AS actifs_maintenant
      FROM page_views
    `);
    const [evolution] = await db.execute(`
      SELECT
        DATE(created_at)            AS date,
        COUNT(*)                    AS vues,
        COUNT(DISTINCT session_id)  AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    const [topPages] = await db.execute(`
      SELECT
        page,
        COUNT(*)                   AS vues,
        COUNT(DISTINCT session_id) AS sessions_uniques
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY page
      ORDER BY vues DESC
      LIMIT 10
    `);
    const [sources] = await db.execute(`
      SELECT
        CASE
          WHEN referrer IS NULL OR referrer = ''   THEN 'Direct'
          WHEN referrer LIKE '%google%'            THEN 'Google'
          WHEN referrer LIKE '%facebook%'
            OR referrer LIKE '%fb.com%'            THEN 'Facebook'
          WHEN referrer LIKE '%instagram%'         THEN 'Instagram'
          WHEN referrer LIKE '%tiktok%'            THEN 'TikTok'
          WHEN referrer LIKE '%whatsapp%'          THEN 'WhatsApp'
          ELSE 'Autre'
        END                         AS source,
        COUNT(*)                    AS vues,
        COUNT(DISTINCT session_id)  AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY source
      ORDER BY vues DESC
    `);
    const [devices] = await db.execute(`
      SELECT
        device,
        COUNT(*)                   AS vues,
        COUNT(DISTINCT session_id) AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY device
      ORDER BY vues DESC
    `);
    const [recent] = await db.execute(`
      SELECT page, referrer, device, pays, ville, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const [heuresRaw] = await db.execute(`
      SELECT HOUR(created_at) AS heure, COUNT(*) AS vues
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY HOUR(created_at)
      ORDER BY heure
    `);
    const heuresMap = {};
    heuresRaw.forEach((r) => {
      heuresMap[Number(r.heure)] = Number(r.vues);
    });
    const heures = Array.from({ length: 24 }, (_, h) => ({
      heure: `${String(h).padStart(2, "0")}h`,
      vues: heuresMap[h] ?? 0
    }));
    const [joursRaw] = await db.execute(`
      SELECT DAYOFWEEK(created_at) AS dow, COUNT(*) AS vues
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DAYOFWEEK(created_at)
      ORDER BY dow
    `);
    const joursMap = {};
    joursRaw.forEach((r) => {
      joursMap[Number(r.dow)] = Number(r.vues);
    });
    const joursOrdre = [2, 3, 4, 5, 6, 7, 1];
    const jours = joursOrdre.map((dow) => ({
      jour: JOURS[dow],
      vues: joursMap[dow] ?? 0
    }));
    const [[nvRaw]] = await db.execute(`
      SELECT
        SUM(CASE WHEN first_seen >= CURDATE() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS nouveaux,
        SUM(CASE WHEN first_seen < CURDATE()  - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS recurrents
      FROM (
        SELECT visitor_id, MIN(created_at) AS first_seen
        FROM page_views
        WHERE visitor_id IS NOT NULL
          AND visitor_id IN (
            SELECT DISTINCT visitor_id FROM page_views
            WHERE created_at >= NOW() - INTERVAL 30 DAY AND visitor_id IS NOT NULL
          )
        GROUP BY visitor_id
      ) t
    `);
    const [topPays] = await db.execute(`
      SELECT
        COALESCE(pays, 'Inconnu') AS pays,
        COUNT(*)                  AS vues,
        COUNT(DISTINCT session_id) AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY pays
      ORDER BY vues DESC
      LIMIT 10
    `);
    res.json({
      kpi: {
        sessions_today: Number(kpi.sessions_today ?? 0),
        sessions_7j: Number(kpi.sessions_7j ?? 0),
        sessions_30j: Number(kpi.sessions_30j ?? 0),
        vues_today: Number(kpi.vues_today ?? 0),
        vues_7j: Number(kpi.vues_7j ?? 0),
        vues_30j: Number(kpi.vues_30j ?? 0),
        actifs_maintenant: Number(kpi.actifs_maintenant ?? 0)
      },
      evolution: evolution.map((r) => ({
        date: String(r.date).slice(0, 10),
        vues: Number(r.vues),
        sessions: Number(r.sessions)
      })),
      topPages: topPages.map((r) => ({
        page: String(r.page),
        vues: Number(r.vues),
        sessions_uniques: Number(r.sessions_uniques)
      })),
      sources: sources.map((r) => ({
        source: String(r.source),
        vues: Number(r.vues),
        sessions: Number(r.sessions)
      })),
      devices: devices.map((r) => ({
        device: String(r.device),
        vues: Number(r.vues),
        sessions: Number(r.sessions)
      })),
      recent: recent.map((r) => ({
        page: String(r.page),
        referrer: r.referrer ? String(r.referrer) : null,
        device: String(r.device),
        pays: r.pays ? String(r.pays) : null,
        ville: r.ville ? String(r.ville) : null,
        created_at: String(r.created_at)
      })),
      heures,
      jours,
      visiteurs: {
        nouveaux: Number(nvRaw?.nouveaux ?? 0),
        recurrents: Number(nvRaw?.recurrents ?? 0)
      },
      topPays: topPays.map((r) => ({
        pays: String(r.pays),
        vues: Number(r.vues),
        sessions: Number(r.sessions)
      }))
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});
var analytics_default = router35;

// routes/referrals.ts
var import_express36 = __toESM(require("express"));
init_db();
var router36 = import_express36.default.Router();
async function ensureReferralsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS referrals (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom         VARCHAR(100) NOT NULL,
      telephone   VARCHAR(30)  NOT NULL,
      code        VARCHAR(20)  NOT NULL UNIQUE,
      uses_count  INT UNSIGNED NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code      (code),
      INDEX idx_telephone (telephone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
ensureReferralsTable().catch(console.error);
function generateCode2(nom) {
  const base2 = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base2}${suffix}`;
}
async function uniqueCode(nom) {
  for (let i = 0; i < 10; i++) {
    const code = generateCode2(nom);
    const [[row]] = await db.execute(
      `SELECT id FROM referrals WHERE code = ? LIMIT 1`,
      [code]
    );
    if (!row) return code;
  }
  return generateCode2(nom) + Date.now().toString(36).slice(-3).toUpperCase();
}
router36.post("/api/referrals", async (req, res) => {
  try {
    const { nom, telephone } = req.body;
    if (!nom?.trim() || !telephone?.trim()) {
      return res.status(400).json({ error: "Nom et t\xE9l\xE9phone obligatoires." });
    }
    const safeName = String(nom).trim().slice(0, 100);
    const safePhone = String(telephone).trim().replace(/\s+/g, "").slice(0, 30);
    const [[existing]] = await db.execute(
      `SELECT code, nom, uses_count FROM referrals WHERE telephone = ? LIMIT 1`,
      [safePhone]
    );
    if (existing) {
      return res.json({
        code: existing.code,
        nom: existing.nom,
        uses_count: existing.uses_count,
        already: true
      });
    }
    const code = await uniqueCode(safeName);
    await db.execute(
      `INSERT INTO referrals (nom, telephone, code) VALUES (?, ?, ?)`,
      [safeName, safePhone, code]
    );
    res.json({ code, nom: safeName, uses_count: 0, already: false });
  } catch (err) {
    console.error("[referrals/post]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});
router36.get("/api/referrals", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Code manquant." });
    const [[row]] = await db.execute(
      `SELECT nom, uses_count FROM referrals WHERE code = ? LIMIT 1`,
      [code]
    );
    if (!row) return res.status(404).json({ error: "Code introuvable." });
    res.json({ nom: String(row.nom), uses_count: Number(row.uses_count) });
  } catch (err) {
    console.error("[referrals/get]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});
router36.get("/api/referrals/validate", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    if (!code) return res.status(400).json({ valid: false });
    const [[row]] = await db.execute(
      `SELECT nom, uses_count FROM referrals WHERE code = ? LIMIT 1`,
      [code]
    );
    if (!row) return res.json({ valid: false });
    res.json({ valid: true, nom: String(row.nom), uses_count: Number(row.uses_count) });
  } catch (err) {
    console.error("[referrals/validate]", err);
    res.status(500).json({ valid: false });
  }
});
var referrals_default = router36;

// routes/admin/delivery-zones.ts
var import_express37 = __toESM(require("express"));
init_admin_db();
init_db();
var router37 = import_express37.default.Router();
async function ensureDeliveryZonesTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(100) NOT NULL,
      fee        INT UNSIGNED NOT NULL DEFAULT 0,
      actif      TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      prix_libre TINYINT(1)   NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await db.execute("ALTER TABLE delivery_zones ADD COLUMN prix_libre TINYINT(1) NOT NULL DEFAULT 0");
  } catch (e) {
    if (e?.code !== "ER_DUP_FIELDNAME") throw e;
  }
}
ensureDeliveryZonesTable().catch(console.error);
router37.get("/api/admin/delivery-zones", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    const zones = await getDeliveryZones(false, session.shop_id ?? 1);
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router37.post("/api/admin/delivery-zones", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
    }
    const body = req.body;
    const shopId = session.shop_id ?? 1;
    if (body._delete && body.id) {
      await deleteDeliveryZone(Number(body.id), shopId);
      return res.json({ ok: true, deleted: true });
    }
    if (!body.nom?.trim()) {
      return res.status(400).json({ error: "Nom de zone requis." });
    }
    await upsertDeliveryZone({
      id: body.id ? Number(body.id) : void 0,
      nom: String(body.nom).trim(),
      fee: Number(body.fee ?? 0),
      actif: body.actif !== false && body.actif !== 0,
      sort_order: Number(body.sort_order ?? 0),
      prix_libre: Boolean(body.prix_libre)
    }, shopId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router37.delete("/api/admin/delivery-zones/:id", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
    }
    await deleteDeliveryZone(Number(req.params.id), session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var delivery_zones_default = router37;

// routes/admin/coupons.ts
var import_express38 = __toESM(require("express"));
init_admin_db();
init_db();
var router38 = import_express38.default.Router();
async function ensureCouponsTable2() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code       VARCHAR(50)   NOT NULL UNIQUE,
      type       ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
      valeur     DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order  DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_uses   INT UNSIGNED  NOT NULL DEFAULT 0,
      uses_count INT UNSIGNED  NOT NULL DEFAULT 0,
      expires_at DATETIME      NULL,
      actif      TINYINT(1)    NOT NULL DEFAULT 1,
      created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  for (const ddl of [
    "ALTER TABLE coupons ADD COLUMN max_uses   INT UNSIGNED  NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN uses_count INT UNSIGNED  NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN min_order  DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN expires_at DATETIME      NULL",
    "ALTER TABLE coupons ADD COLUMN actif      TINYINT(1)    NOT NULL DEFAULT 1"
  ]) {
    try {
      await db.execute(ddl);
    } catch (e) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }
}
ensureCouponsTable2().catch(console.error);
router38.get("/api/admin/coupons", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    const coupons = await listCoupons(session.shop_id ?? 1);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router38.post("/api/admin/coupons", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
    }
    await ensureCouponsTable2();
    const body = req.body;
    const shopId = session.shop_id ?? 1;
    if (body._delete && body.id) {
      await deleteCoupon(Number(body.id), shopId);
      return res.json({ ok: true, deleted: true });
    }
    if (!body.code?.trim()) {
      return res.status(400).json({ error: "Code coupon requis." });
    }
    await upsertCoupon({
      id: body.id ? Number(body.id) : void 0,
      code: String(body.code).trim().toUpperCase(),
      type: body.type === "fixed" ? "fixed" : "percent",
      valeur: Number(body.valeur ?? 0),
      min_order: Number(body.min_order ?? 0),
      max_uses: Number(body.max_uses ?? 0),
      expires_at: body.expires_at || null,
      actif: body.actif !== false && body.actif !== 0
    }, shopId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var coupons_default = router38;

// routes/admin/social.ts
var import_express39 = __toESM(require("express"));
var router39 = import_express39.default.Router();
var N8N_WEBHOOK = "https://n8n.togolese.fr/webhook/facebook-publisher";
var AD_ACCOUNT_ID = "act_976291178146381";
var PAGE_ID = "1110500725482756";
var FB_API_VERSION = "v21.0";
var FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;
async function fbPost(path, body, token) {
  const url = `${FB_API_BASE}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data?.error?.message || `Meta API error on ${path}: HTTP ${res.status}`);
  }
  return data;
}
async function boostPost(postId, budgetPerDay, days) {
  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new Error("META_ADS_TOKEN non configur\xE9.");
  const now = Math.floor(Date.now() / 1e3);
  const endTime = now + days * 86400 + 3600;
  const campaign = await fbPost(`${AD_ACCOUNT_ID}/campaigns`, {
    name: `Boost ${postId}`,
    objective: "OUTCOME_AWARENESS",
    buying_type: "AUCTION",
    status: "ACTIVE",
    special_ad_categories: ["NONE"],
    is_adset_budget_sharing_enabled: false
  }, token);
  const adset = await fbPost(`${AD_ACCOUNT_ID}/adsets`, {
    name: "Acheteurs Togo \u2014 Mobile",
    campaign_id: campaign.id,
    daily_budget: budgetPerDay,
    billing_event: "IMPRESSIONS",
    optimization_goal: "REACH",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      geo_locations: {
        countries: ["TG"]
      },
      age_min: 22,
      age_max: 50,
      device_platforms: ["mobile"],
      publisher_platforms: ["facebook"],
      facebook_positions: ["feed"],
      targeting_automation: { advantage_audience: 0 }
    },
    start_time: now,
    end_time: endTime,
    status: "ACTIVE"
  }, token);
  const waNumber = process.env.WHATSAPP_NUMBER || "22890527912";
  const creative = await fbPost(`${AD_ACCOUNT_ID}/adcreatives`, {
    name: `Creative \u2014 ${postId}`,
    object_story_id: `${PAGE_ID}_${postId}`,
    call_to_action: {
      type: "CONTACT_US",
      value: { link: `https://wa.me/${waNumber}` }
    }
  }, token);
  const ad = await fbPost(`${AD_ACCOUNT_ID}/ads`, {
    name: "Boost Togo",
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: "ACTIVE"
  }, token);
  return ad.id;
}
router39.post("/api/admin/social/publish", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
    const { type, products, boost, boostBudget, boostDays } = req.body;
    if (!type || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Payload invalide." });
    }
    const n8nRes = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, products })
    });
    const data = await n8nRes.json().catch(() => ({}));
    if (!n8nRes.ok) {
      return res.status(502).json({ error: data?.error || `n8n a retourn\xE9 HTTP ${n8nRes.status}` });
    }
    let boostAdId = null;
    let boostError = null;
    console.log("[social] n8n response:", JSON.stringify(data));
    if (boost === true) {
      const rawPostId = data?.post_id || data?.id || data?.[0]?.id || "";
      const postId = String(rawPostId).includes("_") ? String(rawPostId).split("_").pop() : String(rawPostId);
      if (postId) {
        const budget = Number(boostBudget) > 0 ? Number(boostBudget) : 2e3;
        const days = Number(boostDays) > 0 ? Number(boostDays) : 3;
        boostAdId = await boostPost(postId, budget, days).catch((err) => {
          boostError = err instanceof Error ? err.message : "Erreur boost.";
          return null;
        });
      } else {
        boostError = "post_id introuvable dans la r\xE9ponse n8n \u2014 boost impossible.";
      }
    }
    res.json({ ok: true, ...data, boostAdId, boostError });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var social_default = router39;

// routes/admin/whatsapp-campagne.ts
var import_express40 = __toESM(require("express"));
init_db();
var router40 = import_express40.default.Router();
function formatTgPhone(num) {
  const digits = num.replace(/[\s+\-()]/g, "");
  if (digits.startsWith("228")) return digits;
  if (digits.startsWith("0")) return `228${digits.slice(1)}`;
  return `228${digits}`;
}
router40.get("/api/admin/whatsapp-campagne/test-credentials", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { getSetting: getSetting2 } = await Promise.resolve().then(() => (init_admin_db(), admin_db_exports));
  const phoneId = await getSetting2("wa_phone_number_id");
  const token = await getSetting2("wa_access_token");
  if (!phoneId || !token) return res.json({ ok: false, error: "Credentials manquants en DB" });
  const r = await fetch(`https://graph.facebook.com/v19.0/${phoneId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json();
  res.json({ status: r.status, phoneId, tokenPreview: token.slice(0, 20) + "...", data });
});
router40.get("/api/admin/whatsapp-campagne/preview", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const clientIds = req.query.ids ?? "";
  try {
    let count = 0;
    if (clientIds) {
      const ids = clientIds.split(",").map(Number).filter(Boolean);
      if (ids.length === 0) return res.json({ count: 0 });
      const placeholders = ids.map(() => "?").join(",");
      const [[row]] = await db.execute(
        `SELECT COUNT(*) AS cnt FROM boutique_clients WHERE id IN (${placeholders}) AND telephone IS NOT NULL AND telephone != ''`,
        ids
      );
      count = Number(row?.cnt ?? 0);
    } else {
      const [[row]] = await db.execute(
        `SELECT COUNT(*) AS cnt FROM boutique_clients WHERE telephone IS NOT NULL AND telephone != ''`
      );
      count = Number(row?.cnt ?? 0);
    }
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router40.post("/api/admin/whatsapp-campagne/send", async (req, res) => {
  console.log("[campagne] POST /send received, body:", JSON.stringify(req.body).slice(0, 200));
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { message, client_ids, image_url } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message requis." });
  try {
    let rows;
    if (client_ids && client_ids.length > 0) {
      const placeholders = client_ids.map(() => "?").join(",");
      [rows] = await db.execute(
        `SELECT id, nom, telephone FROM boutique_clients WHERE id IN (${placeholders}) AND telephone IS NOT NULL AND telephone != '' ORDER BY id ASC`,
        client_ids
      );
    } else {
      [rows] = await db.execute(
        `SELECT id, nom, telephone FROM boutique_clients WHERE telephone IS NOT NULL AND telephone != '' ORDER BY id ASC`
      );
    }
    let mediaId = null;
    if (image_url?.trim()) {
      console.log("[campagne] fetching image:", image_url.slice(0, 80));
      const imgRes = await fetch(image_url).catch((e) => {
        console.log("[campagne] fetch image error:", e);
        return null;
      });
      console.log("[campagne] image fetch status:", imgRes?.status, imgRes?.ok);
      if (imgRes?.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const mime = imgRes.headers.get("content-type") ?? "image/jpeg";
        const filename = image_url.split("/").pop()?.split("?")[0] ?? "product.jpg";
        console.log("[campagne] uploading to WA media, mime:", mime, "size:", buffer.length);
        const upload = await uploadWaMedia(buffer, mime, filename);
        console.log("[campagne] upload result:", JSON.stringify(upload));
        if (upload.success && upload.mediaId) mediaId = upload.mediaId;
      }
    }
    console.log("[campagne] mediaId:", mediaId, "rows:", rows.length);
    let sent = 0;
    let failed = 0;
    const errors = [];
    for (const client of rows) {
      await new Promise((r) => setTimeout(r, 600));
      const to = formatTgPhone(String(client.telephone));
      const result = mediaId ? await sendWaImage({ to, mediaId, caption: message }) : await sendWaText({ to, body: message });
      if (result.success) sent++;
      else {
        failed++;
        if (result.error && !errors.includes(result.error)) errors.push(result.error);
      }
    }
    res.json({ success: true, sent, failed, total: rows.length, errors });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var whatsapp_campagne_default = router40;

// routes/admin/livreur-inscriptions.ts
var import_express41 = __toESM(require("express"));
var import_bcryptjs4 = __toESM(require("bcryptjs"));
var import_cloudinary2 = require("cloudinary");
init_admin_db();
init_db();
import_cloudinary2.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var router41 = import_express41.default.Router();
async function requireAdmin(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Non autoris\xE9." });
    return null;
  }
  if (!["admin", "super_admin"].includes(session.role)) {
    res.status(403).json({ error: "Acc\xE8s r\xE9serv\xE9 aux admins." });
    return null;
  }
  return session;
}
async function uploadBase64ToCloudinary(base64) {
  return new Promise((resolve2, reject) => {
    import_cloudinary2.v2.uploader.upload(
      base64,
      { folder: "togolese-shop/livreurs-cni", resource_type: "image", format: "webp", quality: "auto" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload \xE9chou\xE9"));
        else resolve2(result.secure_url);
      }
    );
  });
}
router41.post("/api/livreur/inscription", async (req, res) => {
  try {
    await ensureLivreurInscriptionsTable();
    const { nom, telephone, numero_plaque, password, carte_identite } = req.body;
    if (!nom?.trim() || !telephone?.trim() || !password) {
      return res.status(400).json({ error: "Nom, t\xE9l\xE9phone et mot de passe requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caract\xE8res." });
    }
    if (!carte_identite) {
      return res.status(400).json({ error: "La photo de la carte d'identit\xE9 est obligatoire." });
    }
    const pool2 = db;
    const [existing] = await pool2.execute(
      "SELECT id, statut FROM livreur_inscriptions WHERE telephone = ? LIMIT 1",
      [telephone.trim()]
    );
    if (existing.length > 0) {
      const prev = existing[0];
      if (prev.statut === "en_attente") return res.status(409).json({ error: "Une demande avec ce num\xE9ro est d\xE9j\xE0 en attente." });
      if (prev.statut === "approuve") return res.status(409).json({ error: "Ce num\xE9ro est d\xE9j\xE0 enregistr\xE9 comme livreur." });
    }
    const [existingUser] = await pool2.execute(
      "SELECT id FROM utilisateurs WHERE telephone = ? AND actif = 1 LIMIT 1",
      [telephone.trim()]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Ce num\xE9ro est d\xE9j\xE0 associ\xE9 \xE0 un compte actif." });
    }
    let carteUrl;
    try {
      carteUrl = await uploadBase64ToCloudinary(carte_identite);
    } catch {
      return res.status(400).json({ error: "Impossible d'envoyer la photo. V\xE9rifiez le format (JPEG, PNG, max 10 Mo)." });
    }
    const hash = await import_bcryptjs4.default.hash(password, 12);
    const id = await createLivreurInscription({
      nom: nom.trim(),
      telephone: telephone.trim(),
      numero_plaque: numero_plaque?.trim() || void 0,
      carte_identite_url: carteUrl,
      password_hash: hash
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router41.get("/api/admin/livreur-inscriptions", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const statut = typeof req.query.statut === "string" ? req.query.statut : void 0;
    const items = await listLivreurInscriptions(statut);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router41.post("/api/admin/livreur-inscriptions/:id/approve", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const id = Number(req.params.id);
    const inscription = await getLivreurInscriptionById(id);
    if (!inscription) return res.status(404).json({ error: "Demande introuvable." });
    if (inscription.statut !== "en_attente") {
      return res.status(409).json({ error: "Cette demande a d\xE9j\xE0 \xE9t\xE9 trait\xE9e." });
    }
    const note = String(req.body.note ?? "").trim() || null;
    const username = inscription.telephone.toLowerCase().replace(/\s+/g, "");
    await createUtilisateur({
      nom: inscription.nom,
      username,
      telephone: inscription.telephone,
      numero_plaque: inscription.numero_plaque ?? void 0,
      poste: "Livreur",
      motDePasse: inscription.password_hash,
      mustChangePassword: false
    });
    await updateLivreurInscriptionStatut(id, "approuve", note ?? void 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
router41.post("/api/admin/livreur-inscriptions/:id/reject", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const id = Number(req.params.id);
    const inscription = await getLivreurInscriptionById(id);
    if (!inscription) return res.status(404).json({ error: "Demande introuvable." });
    if (inscription.statut !== "en_attente") {
      return res.status(409).json({ error: "Cette demande a d\xE9j\xE0 \xE9t\xE9 trait\xE9e." });
    }
    const note = String(req.body.note ?? "").trim() || null;
    await updateLivreurInscriptionStatut(id, "rejete", note ?? void 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});
var livreur_inscriptions_default = router41;

// routes/admin/entrepots.ts
var import_express42 = __toESM(require("express"));
init_admin_db();
var router42 = import_express42.default.Router();
router42.get("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    const entrepots = await listEntrepots(session.shop_id ?? 1);
    res.json({ entrepots });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router42.post("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  const { id, nom, telephone, adresse, notes, actif } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom obligatoire." });
  try {
    const newId = await upsertEntrepot({ id: id ? Number(id) : void 0, nom: nom.trim(), telephone: telephone || null, adresse: adresse || null, notes: notes || null, actif: actif !== false }, session.shop_id ?? 1);
    res.json({ ok: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router42.delete("/api/admin/entrepots/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role) && !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  }
  try {
    await deleteEntrepot(Number(req.params.id), session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var entrepots_default = router42;

// routes/admin/tombola.ts
var import_express43 = __toESM(require("express"));
init_admin_db();
var router43 = import_express43.default.Router();
router43.get("/api/admin/tombola", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  try {
    const sessions = await listTombolaSessions();
    res.json({ data: sessions });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router43.post("/api/admin/tombola", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  const { id, nom, min_montant, min_participants, prize_description, statut } = req.body;
  if (!nom) return res.status(400).json({ error: "nom requis" });
  try {
    if (id) {
      await updateTombolaSession(Number(id), {
        nom,
        min_montant: Number(min_montant),
        min_participants: Number(min_participants),
        prize_description: prize_description ?? null,
        statut
      });
      res.json({ ok: true });
    } else {
      const newId = await createTombolaSession({
        nom,
        min_montant: Number(min_montant) || 5e4,
        min_participants: Number(min_participants) || 10,
        prize_description: prize_description ?? null
      });
      res.json({ ok: true, id: newId });
    }
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router43.get("/api/admin/tombola/:id/participants", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola) return res.status(404).json({ error: "Tombola introuvable" });
    const participants = await getTombolaParticipants(tombola.min_montant);
    res.json({
      data: participants,
      ready: participants.length >= tombola.min_participants
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router43.post("/api/admin/tombola/:id/spin", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  const { winner_facture_id } = req.body;
  if (!winner_facture_id) return res.status(400).json({ error: "winner_facture_id requis" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola) return res.status(404).json({ error: "Tombola introuvable" });
    if (tombola.statut === "termine") return res.status(400).json({ error: "Tombola d\xE9j\xE0 termin\xE9e" });
    await spinTombola(Number(req.params.id), Number(winner_facture_id));
    const updated = await getTombolaSession(Number(req.params.id));
    res.json({ ok: true, winner: updated });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
});
router43.post("/api/admin/tombola/:id/notify", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola) return res.status(404).json({ error: "Tombola introuvable" });
    if (!tombola.winner_tel) return res.status(400).json({ error: "Pas de t\xE9l\xE9phone gagnant" });
    if (!tombola.winner_nom) return res.status(400).json({ error: "Pas de nom gagnant" });
    const prize = tombola.prize_description ?? "votre lot";
    await sendWaText({
      to: tombola.winner_tel,
      body: `\u{1F389} F\xE9licitations ${tombola.winner_nom} ! Vous avez gagn\xE9 la tombola Togolese Shop et remportez ${prize} ! Contactez-nous pour r\xE9cup\xE9rer votre lot. \u{1F4DE} +22890527912`
    });
    await markTombolaNotified(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Erreur envoi WhatsApp" });
  }
});
router43.delete("/api/admin/tombola/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifi\xE9" });
  try {
    await deleteTombolaSession(Number(req.params.id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var tombola_default = router43;

// routes/admin/onboarding.ts
var import_express44 = __toESM(require("express"));
var import_bcryptjs5 = __toESM(require("bcryptjs"));
init_admin_db();

// lib/mailer.ts
var import_resend = require("resend");
var RESEND_API_KEY = process.env.RESEND_API_KEY;
var FROM_ADDRESS = process.env.RESEND_FROM || "onboarding@resend.dev";
var _client = null;
function getClient() {
  if (!_client) {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
    _client = new import_resend.Resend(RESEND_API_KEY);
  }
  return _client;
}
async function sendMail(opts) {
  if (!RESEND_API_KEY) {
    console.warn("[mailer] RESEND_API_KEY not set \u2014 email skipped:", opts.subject);
    return;
  }
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text
  });
  if (error) {
    console.error("[mailer] Resend error:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

// lib/email-templates.ts
var BRAND_COLOR = "#6366f1";
function base(title, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">ShopSaaS</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 28px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ShopSaaS \xB7 Votre boutique en ligne, simplement<br/>
              Pour toute question : <a href="mailto:support@togolese.tg" style="color:${BRAND_COLOR};">support@togolese.tg</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
function welcomeShopEmail(opts) {
  const { adminNom, shopNom, shopSlug, adminUrl, loginUrl, plan } = opts;
  const planLabel = plan === "pro" ? "Pro" : plan === "basic" ? "Basic" : "Gratuit";
  const html = base(
    `Bienvenue sur ShopSaaS \u2014 ${shopNom}`,
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Bienvenue, ${adminNom} \u{1F44B}</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">Votre boutique <strong>${shopNom}</strong> est pr\xEAte !</p>

    <table width="100%" cellpadding="12" style="background:#f9fafb;border-radius:8px;margin-bottom:28px;border:1px solid #e5e7eb;">
      <tr>
        <td style="font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Nom de la boutique</td>
        <td style="font-size:14px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;">${shopNom}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Identifiant (slug)</td>
        <td style="font-size:14px;color:#111827;font-family:monospace;border-bottom:1px solid #e5e7eb;">${shopSlug}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b7280;">Plan</td>
        <td style="font-size:14px;color:#111827;font-weight:600;">${planLabel}</td>
      </tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#374151;">Connectez-vous \xE0 votre interface admin pour commencer \xE0 g\xE9rer vos produits, ventes et clients.</p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td>
          <a href="${loginUrl}"
             style="display:inline-block;background:${BRAND_COLOR};color:#fff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Acc\xE9der \xE0 mon admin \u2192
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9ca3af;">
      URL directe : <a href="${adminUrl}" style="color:${BRAND_COLOR};">${adminUrl}</a>
    </p>
    `
  );
  const text = `Bienvenue ${adminNom} !

Votre boutique "${shopNom}" (${shopSlug}) est pr\xEAte sur le plan ${planLabel}.

Connectez-vous ici : ${loginUrl}

Pour toute aide : support@togolese.tg`;
  return { subject: `\u{1F389} Votre boutique ${shopNom} est pr\xEAte \u2014 ShopSaaS`, html, text };
}

// routes/admin/onboarding.ts
var router44 = import_express44.default.Router();
var SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
router44.post("/api/admin/onboarding", async (req, res) => {
  try {
    const {
      shop_nom,
      shop_slug,
      shop_email,
      shop_plan,
      admin_nom,
      admin_username,
      admin_email,
      admin_password
    } = req.body;
    if (!shop_nom?.trim()) return res.status(400).json({ error: "Nom de boutique requis." });
    if (!shop_slug?.trim()) return res.status(400).json({ error: "Slug requis." });
    if (!shop_email?.trim()) return res.status(400).json({ error: "Email boutique requis." });
    if (!admin_nom?.trim()) return res.status(400).json({ error: "Nom admin requis." });
    if (!admin_username?.trim()) return res.status(400).json({ error: "Nom d'utilisateur requis." });
    if (!admin_password || admin_password.length < 8) {
      return res.status(400).json({ error: "Mot de passe : 8 caract\xE8res minimum." });
    }
    const slug = shop_slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return res.status(400).json({ error: "Slug invalide. Lettres minuscules, chiffres et tirets uniquement (3\u201350 caract\xE8res)." });
    }
    if (["admin", "api", "www", "mail", "default", "app"].includes(slug)) {
      return res.status(400).json({ error: "Ce slug est r\xE9serv\xE9." });
    }
    const existing = await getShopBySlug(slug);
    if (existing) return res.status(409).json({ error: "Ce slug est d\xE9j\xE0 utilis\xE9. Choisissez-en un autre." });
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(admin_username.trim())) {
      return res.status(400).json({ error: "Nom d'utilisateur : 3\u201330 caract\xE8res, lettres/chiffres/underscore." });
    }
    const plan = ["free", "basic", "pro"].includes(shop_plan) ? shop_plan : "free";
    const shopId = await createShop({ nom: shop_nom.trim(), slug, email: shop_email.trim(), plan });
    const password_hash = await import_bcryptjs5.default.hash(admin_password, 12);
    await createAdminUser({
      nom: admin_nom.trim(),
      username: admin_username.trim().toLowerCase(),
      email: admin_email?.trim() || null,
      role: "admin",
      password_hash,
      shop_id: shopId
    });
    const siteBase = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const adminUrl = `${siteBase}/admin`;
    const loginUrl = `${siteBase}/admin/login`;
    const emailTo = admin_email?.trim() || shop_email.trim();
    const { subject, html, text } = welcomeShopEmail({
      adminNom: admin_nom.trim(),
      shopNom: shop_nom.trim(),
      shopSlug: slug,
      adminUrl,
      loginUrl,
      plan
    });
    sendMail({ to: emailTo, subject, html, text }).catch(
      (e) => console.error("[onboarding] welcome email failed:", e)
    );
    res.status(201).json({ ok: true, shop_id: shopId, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    if (msg.includes("Duplicate entry") && msg.includes("slug")) {
      return res.status(409).json({ error: "Ce slug est d\xE9j\xE0 utilis\xE9." });
    }
    res.status(500).json({ error: msg });
  }
});
router44.get("/api/admin/onboarding/check-slug", async (req, res) => {
  const slug = String(req.query.slug ?? "").toLowerCase();
  if (!SLUG_RE.test(slug)) return res.json({ available: false, reason: "format" });
  if (["admin", "api", "www", "mail", "default", "app"].includes(slug)) {
    return res.json({ available: false, reason: "reserved" });
  }
  const existing = await getShopBySlug(slug);
  res.json({ available: !existing });
});
var onboarding_default = router44;

// routes/admin/saas-dashboard.ts
var import_express45 = __toESM(require("express"));
init_db();
var router45 = import_express45.default.Router();
function requireSuperAdmin2(session, res) {
  if (!session) {
    res.status(401).json({ error: "Non autoris\xE9." });
    return false;
  }
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "R\xE9serv\xE9 au super-admin." });
    return false;
  }
  return true;
}
router45.get("/api/admin/saas/shops", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  try {
    const shops = await listShopsWithStats();
    const data = shops.map((s) => ({
      ...s,
      plan_limit: planLimitLabel(s.plan)
    }));
    res.json({ shops: data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.patch("/api/admin/saas/shops/:id", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  if (id === 1 && req.body.actif === false) {
    return res.status(400).json({ error: "La boutique par d\xE9faut ne peut pas \xEAtre suspendue." });
  }
  try {
    const { plan, actif, nom, email } = req.body;
    const update = {};
    if (nom !== void 0) update.nom = String(nom);
    if (email !== void 0) update.email = String(email);
    if (plan !== void 0 && ["basic", "pro", "business"].includes(String(plan))) {
      update.plan = plan;
    }
    if (actif !== void 0) {
      update.actif = Boolean(actif);
      update.subscription_status = Boolean(actif) ? "active" : "suspended";
    }
    await updateShop(id, update);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.get("/api/admin/saas/stats", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  try {
    const [rows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM shops)                                   AS total_shops,
        (SELECT COUNT(*) FROM shops WHERE actif = 1)                  AS active_shops,
        (SELECT COUNT(*) FROM shops WHERE plan = 'basic')             AS plan_basic,
        (SELECT COUNT(*) FROM shops WHERE plan = 'pro')               AS plan_pro,
        (SELECT COUNT(*) FROM shops WHERE plan = 'business')          AS plan_business,
        (SELECT COUNT(*) FROM produits)                               AS total_products,
        (SELECT COUNT(*) FROM admin_users WHERE role != 'super_admin') AS total_admins
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.get("/api/admin/saas/payments", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  try {
    const [rows] = await db.execute(`
      SELECT sp.*, s.nom AS shop_nom, s.slug AS shop_slug, s.email AS shop_email
      FROM shop_payments sp
      JOIN shops s ON s.id = sp.shop_id
      WHERE sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `);
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.patch("/api/admin/saas/payments/:id/approve", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  try {
    const [rows] = await db.execute(
      "SELECT * FROM shop_payments WHERE id = ? LIMIT 1",
      [id]
    );
    const payment = rows[0];
    if (!payment) return res.status(404).json({ error: "Paiement introuvable." });
    if (payment.status === "paid") return res.status(400).json({ error: "D\xE9j\xE0 valid\xE9." });
    await activateShopSubscription(payment.shop_id, payment.plan, payment.duration_months);
    await db.execute(
      "UPDATE shop_payments SET status = 'paid', paid_at = NOW() WHERE id = ?",
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.patch("/api/admin/saas/payments/:id/reject", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  const id = Number(req.params.id);
  try {
    await db.execute(
      "UPDATE shop_payments SET status = 'failed' WHERE id = ? AND status = 'pending'",
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.get("/api/admin/workspace-stats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const [rows] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM produits WHERE actif = 1)                                                     AS produits,
        (SELECT COUNT(*) FROM factures WHERE DATE(created_at) = CURDATE())                                  AS ventes_today,
        (SELECT COUNT(*) FROM orders WHERE status NOT IN ('cancelled','delivered'))                         AS commandes,
        (SELECT COUNT(*) FROM boutique_clients)                                                             AS clients,
        (SELECT COUNT(*) FROM utilisateurs WHERE actif = 1)                                                 AS equipiers
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.post("/api/admin/saas/shops", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  const { nom, email, plan = "basic", pays } = req.body;
  if (!nom || !email) return res.status(400).json({ error: "nom et email requis." });
  const slug = nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const [result] = await db.execute(
      `INSERT INTO shops (nom, slug, email, plan, actif, subscription_status, trial_ends_at, pays)
       VALUES (?, ?, ?, ?, 1, 'trial', DATE_ADD(NOW(), INTERVAL 14 DAY), ?)`,
      [nom, slug, email, plan, pays ?? null]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.get("/api/admin/workspace-settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    await db.execute(
      `ALTER TABLE shops ADD COLUMN disabled_workspaces TEXT NULL`
    ).catch(() => {
    });
    const [[row]] = await db.execute(
      `SELECT disabled_workspaces FROM shops WHERE id = ? LIMIT 1`,
      [session.shop_id ?? 1]
    );
    const disabled = JSON.parse(row?.disabled_workspaces || "[]");
    res.json({ disabled });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.patch("/api/admin/workspace-settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  if (!["super_admin", "admin"].includes(session.role)) return res.status(403).json({ error: "Acc\xE8s refus\xE9." });
  const { id, active } = req.body;
  if (!id) return res.status(400).json({ error: "id requis." });
  try {
    const [[row]] = await db.execute(
      `SELECT disabled_workspaces FROM shops WHERE id = ? LIMIT 1`,
      [session.shop_id ?? 1]
    );
    let disabled = JSON.parse(row?.disabled_workspaces || "[]");
    if (active) {
      disabled = disabled.filter((w) => w !== id);
    } else {
      if (!disabled.includes(id)) disabled.push(id);
    }
    await db.execute(
      `UPDATE shops SET disabled_workspaces = ? WHERE id = ?`,
      [JSON.stringify(disabled), session.shop_id ?? 1]
    );
    res.json({ ok: true, disabled });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router45.delete("/api/admin/saas/shops/:id", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin2(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  if (id === 1) return res.status(400).json({ error: "La boutique par d\xE9faut ne peut pas \xEAtre supprim\xE9e." });
  try {
    await db.execute("DELETE FROM shop_payments WHERE shop_id = ?", [id]);
    await db.execute("DELETE FROM shops WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var saas_dashboard_default = router45;

// routes/admin/billing.ts
var import_express46 = __toESM(require("express"));

// lib/cinetpay.ts
var PLAN_PRICES = {
  basic: 9900,
  pro: 24900
};

// routes/admin/billing.ts
var router46 = import_express46.default.Router();
var MERCHANT_NUMBERS = {
  moov: process.env.MERCHANT_MOOV ?? "98165380",
  yas: process.env.MERCHANT_YAS ?? "90226491"
};
router46.get("/api/admin/billing", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  try {
    const shop = await getShopById(session.shop_id);
    if (!shop) return res.status(404).json({ error: "Boutique introuvable." });
    const payments = await getShopPayments(session.shop_id);
    res.json({
      shop_id: shop.id,
      nom: shop.nom,
      plan: shop.plan,
      subscription_status: shop.subscription_status,
      trial_ends_at: shop.trial_ends_at,
      current_period_end: shop.current_period_end,
      actif: shop.actif,
      merchant_moov: MERCHANT_NUMBERS.moov,
      merchant_yas: MERCHANT_NUMBERS.yas,
      payments
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
router46.post("/api/admin/billing/initiate", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autoris\xE9." });
  const { plan, duration_months = 1, operator, mm_reference } = req.body;
  if (!plan || !["basic", "pro"].includes(plan)) {
    return res.status(400).json({ error: "Plan invalide." });
  }
  if (!operator || !["moov", "yas"].includes(operator)) {
    return res.status(400).json({ error: "Op\xE9rateur invalide (moov ou yas)." });
  }
  if (!mm_reference || mm_reference.trim().length < 3) {
    return res.status(400).json({ error: "R\xE9f\xE9rence de transaction requise." });
  }
  const months = Math.min(Math.max(Number(duration_months) || 1, 1), 12);
  const planKey = plan;
  const amount = PLAN_PRICES[planKey] * months;
  const transactionId = `SAAS-${session.shop_id}-${planKey.toUpperCase()}-${Date.now()}`;
  try {
    await recordShopPayment({
      shopId: session.shop_id,
      transactionId,
      plan: planKey,
      amount,
      durationMonths: months,
      status: "pending",
      operator,
      mmReference: mm_reference.trim()
    });
    res.json({ ok: true, transactionId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});
var billing_default = router46;

// lib/review-notifier.ts
init_db();
var SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togolese.tg";
var DELAY_HOURS = 48;
async function ensureReviewNotifierCols() {
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN delivered_at   TIMESTAMP NULL    AFTER status",
    "ALTER TABLE orders ADD COLUMN review_wa_sent TINYINT(1) NOT NULL DEFAULT 0"
  ]) {
    try {
      await db.execute(ddl);
    } catch (e) {
      const code = e.code;
      if (code !== "ER_DUP_FIELDNAME") {
        console.warn("[review-notifier] migration warn:", e.message);
      }
    }
  }
  console.log("[review-notifier] columns OK");
}
async function runReviewNotifier() {
  try {
    const [rows] = await db.query(
      `SELECT id, reference, nom, client_tel, items
       FROM orders
       WHERE status = 'delivered'
         AND delivered_at IS NOT NULL
         AND delivered_at <= NOW() - INTERVAL ${DELAY_HOURS} HOUR
         AND review_wa_sent = 0
         AND client_tel IS NOT NULL
         AND client_tel != ''
       LIMIT 50`
    );
    if (rows.length === 0) return;
    console.log(`[review-notifier] ${rows.length} order(s) to notify`);
    for (const row of rows) {
      const nom = String(row.nom || "Client");
      const ref = String(row.reference);
      const tel = String(row.client_tel);
      const trackUrl = `${SITE_URL}/suivi-commande?ref=${encodeURIComponent(ref)}`;
      let reviewUrl = trackUrl;
      try {
        const items = typeof row.items === "string" ? JSON.parse(row.items) : row.items;
        if (Array.isArray(items) && items.length > 0) {
          const firstSlug = items[0].slug ?? items[0].reference;
          if (firstSlug) reviewUrl = `${SITE_URL}/products/${firstSlug}#reviews`;
        }
      } catch {
      }
      const body = `\u{1F44B} Bonjour ${nom} !

Votre commande *${ref}* a bien \xE9t\xE9 livr\xE9e. Nous esp\xE9rons qu'elle vous a plu ! \u{1F60A}

\u2B50 Donnez votre avis sur votre achat :
${reviewUrl}

Merci pour votre confiance \u2014 Togolese Shop \u{1F6CD}\uFE0F`;
      try {
        await sendWaText({ to: tel, body });
        await db.execute(
          "UPDATE orders SET review_wa_sent = 1 WHERE id = ?",
          [row.id]
        );
        console.log(`[review-notifier] sent to ${tel} for ${ref}`);
      } catch (e) {
        console.error(`[review-notifier] failed for ${ref}:`, e.message);
      }
    }
  } catch (e) {
    console.error("[review-notifier] job error:", e.message);
  }
}
function startReviewNotifier() {
  const INTERVAL_MS = 60 * 60 * 1e3;
  ensureReviewNotifierCols().then(() => {
    runReviewNotifier();
    setInterval(runReviewNotifier, INTERVAL_MS);
    console.log("[review-notifier] scheduler started (interval: 1h)");
  }).catch((e) => console.error("[review-notifier] startup error:", e));
}

// index.ts
(0, import_dotenv.config)({ path: (0, import_path.resolve)(process.cwd(), "../.env.local") });
(0, import_dotenv.config)({ path: (0, import_path.resolve)(process.cwd(), ".env") });
(0, import_dotenv.config)({ path: (0, import_path.resolve)(__dirname, "../.env.local") });
(0, import_dotenv.config)({ path: (0, import_path.resolve)(__dirname, "../.env") });
var app = (0, import_express47.default)();
var PORT = Number(process.env.PORT) || 4e3;
function splitEnvList(value) {
  return value?.split(",").map((v) => v.trim()).filter(Boolean) ?? [];
}
function originFromUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
var allowedOrigins = new Set(
  [
    ...splitEnvList(process.env.FRONTEND_URL),
    ...splitEnvList(process.env.NEXT_PUBLIC_SITE_URL),
    ...splitEnvList(process.env.CORS_ORIGINS),
    "https://togolese.tg",
    "https://www.togolese.tg",
    "https://store.togolese.fr",
    "http://localhost:3000",
    "http://localhost:3003"
  ].map(originFromUrl).filter(Boolean)
);
function isAllowedOrigin(origin) {
  const parsed = originFromUrl(origin);
  if (!parsed) return false;
  if (allowedOrigins.has(parsed)) return true;
  return /^https:\/\/([a-z0-9-]+\.)?togolese\.(tg|fr)$/i.test(parsed);
}
app.use((0, import_helmet.default)({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    }
  }
}));
app.use((0, import_cors.default)({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return cb(null, true);
    if (isAllowedOrigin(origin)) return cb(null, true);
    cb(new Error(`CORS: origine non autoris\xE9e \u2014 ${origin}`));
  },
  credentials: true
}));
app.set("trust proxy", 1);
var loginLimiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. R\xE9essayez dans 15 minutes." },
  keyGenerator: (req) => (0, import_express_rate_limit.ipKeyGenerator)(req.ip ?? "unknown")
});
app.use("/api/admin/auth/login", loginLimiter);
var generalLimiter = (0, import_express_rate_limit.rateLimit)({
  windowMs: 60 * 1e3,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requ\xEAtes. Ralentissez." },
  skip: (req) => req.path.startsWith("/api/admin/upload")
  // uploads exempt
});
app.use(generalLimiter);
app.use(import_express47.default.json({ limit: "5mb" }));
app.use(import_express47.default.urlencoded({ extended: true, limit: "5mb" }));
app.use((0, import_cookie_parser.default)());
app.use(auth_default);
app.use(products_default);
app.use(variants_default);
app.use(stock_default);
app.use(stock_boutique_default);
app.use(ventes_default);
app.use(livraisons_default);
app.use(finance_default);
app.use(clients_default);
app.use(orders_default);
app.use(upload_default);
app.use(settings_default);
app.use(fournisseurs_default);
app.use(categories_default);
app.use(boutique_clients_default);
app.use(newsletter_default);
app.use(schema_default);
app.use(events_default);
app.use(users_default);
app.use(reviews_default);
app.use(payment_plans_default);
app.use(verifications_default);
app.use(commerciaux_default);
app.use(security_logs_default);
app.use(rapports_default);
app.use(tendances_default);
app.use(performance_produits_default);
app.use(livreur_default);
app.use(public_default);
app.use(account_default);
app.use(orders_default2);
app.use(mobile_money_default);
app.use(whatsapp_inbox_default);
app.use(whatsapp_webhook_default);
app.use(analytics_default);
app.use(referrals_default);
app.use(delivery_zones_default);
app.use(coupons_default);
app.use(social_default);
app.use(whatsapp_campagne_default);
app.use(livreur_inscriptions_default);
app.use(entrepots_default);
app.use(tombola_default);
app.use(onboarding_default);
app.use(saas_dashboard_default);
app.use(billing_default);
app.listen(PORT, async () => {
  console.log(`[backend] Serveur d\xE9marr\xE9 sur le port ${PORT}`);
  try {
    await ensureAdminUsersCols();
    console.log("[backend] admin_users schema OK");
  } catch (e) {
    console.error("[backend] ensureAdminUsersCols failed:", e);
  }
  try {
    await ensureUtilisateursCols();
    console.log("[backend] utilisateurs schema OK");
  } catch (e) {
    console.error("[backend] ensureUtilisateursCols failed:", e);
  }
  try {
    await ensureOrderLivreurCols();
    console.log("[backend] orders livreur cols OK");
  } catch (e) {
    console.error("[backend] ensureOrderLivreurCols failed:", e);
  }
  try {
    await ensureCommerciauxTables();
    console.log("[backend] commerciaux tables OK");
  } catch (e) {
    console.error("[backend] ensureCommerciauxTables failed:", e);
  }
  try {
    await ensureLivraisonCols();
    console.log("[backend] livraisons_ventes FK migration OK");
  } catch (e) {
    console.error("[backend] ensureLivraisonCols failed:", e);
  }
  try {
    await ensureTokenVersionCols();
    console.log("[backend] token_version cols OK");
  } catch (e) {
    console.error("[backend] ensureTokenVersionCols failed:", e);
  }
  try {
    await ensureSecurityLogsTable();
    console.log("[backend] security_logs table OK");
  } catch (e) {
    console.error("[backend] ensureSecurityLogsTable failed:", e);
  }
  try {
    await ensureIndexes();
    console.log("[backend] indexes OK");
  } catch (e) {
    console.error("[backend] ensureIndexes failed:", e);
  }
  try {
    await fixSiteOrderFinanceEntries();
    console.log("[backend] site order finance entries OK");
  } catch (e) {
    console.error("[backend] fixSiteOrderFinanceEntries failed:", e);
  }
  try {
    await ensureWaMessagesTable();
    console.log("[backend] wa_messages table OK");
  } catch (e) {
    console.error("[backend] ensureWaMessagesTable failed:", e);
  }
  try {
    await ensureWaMessagesCols();
    console.log("[backend] wa_messages media cols OK");
  } catch (e) {
    console.error("[backend] ensureWaMessagesCols failed:", e);
  }
  try {
    await ensureEntrepotsTable();
    console.log("[backend] entrepots table OK");
  } catch (e) {
    console.error("[backend] ensureEntrepotsTable failed:", e);
  }
  try {
    await ensureShopIdCols();
    console.log("[backend] shop_id cols OK");
  } catch (e) {
    console.error("[backend] ensureShopIdCols failed:", e);
  }
  recoverMixByYasEntries();
  recoverCouponFinanceEntries();
  startReviewNotifier();
  expireShopSubscriptions().catch((e) => console.error("[billing] expireShopSubscriptions:", e));
  setInterval(() => expireShopSubscriptions().catch((e) => console.error("[billing] expireShopSubscriptions:", e)), 6 * 60 * 60 * 1e3);
});
var index_default = app;
