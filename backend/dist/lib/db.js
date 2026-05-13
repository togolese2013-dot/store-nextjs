"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.formatPrice = exports.finalPrice = void 0;
exports.produitCols = produitCols;
exports.invalidateProduitColsCache = invalidateProduitColsCache;
exports.checkReviewsTable = checkReviewsTable;
exports.getProducts = getProducts;
exports.getProductsByIds = getProductsByIds;
exports.getProductBySlug = getProductBySlug;
exports.getProductCount = getProductCount;
exports.getProductStatusCounts = getProductStatusCounts;
exports.getCategories = getCategories;
exports.getProductVariants = getProductVariants;
const promise_1 = __importDefault(require("mysql2/promise"));
var utils_1 = require("./utils");
Object.defineProperty(exports, "finalPrice", { enumerable: true, get: function () { return utils_1.finalPrice; } });
Object.defineProperty(exports, "formatPrice", { enumerable: true, get: function () { return utils_1.formatPrice; } });
function createPool() {
    const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
    const isProduction = process.env.NODE_ENV === "production";
    // Validate URL has protocol before using it
    const url = rawUrl?.startsWith("mysql://") || rawUrl?.startsWith("mysql2://")
        ? rawUrl
        : undefined;
    if (url) {
        return promise_1.default.createPool({
            uri: url,
            waitForConnections: true,
            connectionLimit: 3,
            charset: "utf8mb4",
            timezone: "+00:00",
            ssl: isProduction ? { rejectUnauthorized: false } : undefined,
        });
    }
    return promise_1.default.createPool({
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "togol2600657",
        waitForConnections: true,
        connectionLimit: 6,
        charset: "utf8mb4",
        timezone: "+00:00",
    });
}
function getOrCreatePool() {
    if (globalThis.__db_pool)
        return globalThis.__db_pool;
    const pool = createPool();
    // Prevent uncaught EventEmitter errors from crashing the process
    pool
        .on("error", (err) => console.error("[db pool]", err.message));
    globalThis.__db_pool = pool;
    return pool;
}
exports.db = getOrCreatePool();
/* ─── Schema introspection (cached) ─── */
let _cols = null;
async function produitCols() {
    if (_cols)
        return _cols;
    const [rows] = await exports.db.execute(`SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`);
    const names = new Set(rows.map((r) => r.COLUMN_NAME.toLowerCase()));
    // Auto-migrate: add images_json column if missing
    if (!names.has("images_json")) {
        try {
            await exports.db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
            names.add("images_json");
        }
        catch (e) {
            // ER_DUP_FIELDNAME = column already exists (race or prior migration) — still mark as present
            const err = e;
            if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
                names.add("images_json");
            }
        }
    }
    // Auto-migrate: add stock_minimum column if missing
    if (!names.has("stock_minimum")) {
        try {
            await exports.db.execute(`ALTER TABLE produits ADD COLUMN stock_minimum INT NULL DEFAULT 5`);
            names.add("stock_minimum");
        }
        catch (e) {
            const err = e;
            if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
                names.add("stock_minimum");
            }
        }
    }
    // Auto-migrate: add marque_id column if missing
    if (!names.has("marque_id")) {
        try {
            await exports.db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`);
            names.add("marque_id");
        }
        catch (e) {
            const err = e;
            if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
                names.add("marque_id");
            }
        }
    }
    // Ensure marques table exists
    try {
        await exports.db.execute(`CREATE TABLE IF NOT EXISTS marques (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    }
    catch { /* already exists */ }
    // Auto-migrate: add stock_magasin column directly on produits if missing
    if (!names.has("stock_magasin")) {
        try {
            await exports.db.execute(`ALTER TABLE produits ADD COLUMN stock_magasin INT NOT NULL DEFAULT 0`);
            names.add("stock_magasin");
            // Migrate existing data from produit_stocks
            try {
                const [psRows] = await exports.db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produit_stocks'`);
                const psCols = new Set(psRows.map(r => r.COLUMN_NAME.toLowerCase()));
                const sc = psCols.has("stock") ? "stock" : psCols.has("quantite") ? "quantite" : null;
                if (sc) {
                    await exports.db.execute(`UPDATE produits p
             JOIN (SELECT produit_id, COALESCE(SUM(\`${sc}\`), 0) AS total
                   FROM produit_stocks GROUP BY produit_id) ps
               ON ps.produit_id = p.id
             SET p.stock_magasin = ps.total`);
                }
            }
            catch { /* migration of existing data optional */ }
        }
        catch { /* ALTER may fail if column already added by concurrent request */ }
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
    };
    return _cols;
}
function invalidateProduitColsCache() { _cols = null; }
/* ─── Reviews table presence check (cached, exported for routes) ─── */
let _hasReviews = null;
async function checkReviewsTable() {
    if (_hasReviews !== null)
        return _hasReviews;
    try {
        const [rows] = await exports.db.execute("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' LIMIT 1");
        _hasReviews = rows.length > 0;
        if (_hasReviews)
            await _ensureReviewsRatingCol();
    }
    catch {
        _hasReviews = false;
    }
    return _hasReviews;
}
async function _ensureReviewsRatingCol() {
    try {
        const [rows] = await exports.db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
       AND COLUMN_NAME IN ('note', 'rating')`);
        const cols = new Set(rows.map(r => r.COLUMN_NAME));
        if (cols.has("note") && !cols.has("rating")) {
            await exports.db.execute("ALTER TABLE reviews CHANGE COLUMN note rating TINYINT NOT NULL DEFAULT 5");
        }
        else if (!cols.has("note") && !cols.has("rating")) {
            await exports.db.execute("ALTER TABLE reviews ADD COLUMN rating TINYINT NOT NULL DEFAULT 5");
        }
    }
    catch { /* ignore — table may not exist yet */ }
}
/* ─── Queries ─── */
async function getProducts(opts) {
    const { categoryId, marqueId, search, referenceExact, promoOnly, newOnly, inStock, minPrice, maxPrice, limit = 60, offset = 0, statut, includeInactive = false, } = opts ?? {};
    const cols = await produitCols();
    const conditions = includeInactive ? [] : ["p.actif = 1"];
    const params = [];
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
    const where = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
    const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
    const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
    const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
    const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
    const safeLimit = Math.max(1, Math.min(200, Number(limit)));
    const safeOffset = Math.max(0, Number(offset));
    // Use query() to avoid LIMIT/OFFSET issues with server-side prepared statements
    const [rows] = await exports.db.query(`SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
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
     WHERE ${where}
     ORDER BY ${orderCol} DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`, params);
    return rows.map((r) => ({
        id: Number(r.id),
        reference: r.reference,
        nom: r.nom,
        description: (r.description ?? null),
        categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
        categorie_nom: (r.categorie_nom ?? null),
        prix_unitaire: Number(r.prix_unitaire),
        stock_boutique: Number(r.stock_boutique),
        stock_magasin: Number(r.stock_magasin ?? 0),
        remise: Number(r.remise),
        neuf: Boolean(r.neuf),
        image_url: (r.image_url ?? null),
        images: r.images_json ? tryParse(r.images_json) : [],
        variations: r.variations_json ? tryParse(r.variations_json) : null,
        date_creation: (r.sort_col ?? ""),
        marque_id: r.marque_id ? Number(r.marque_id) : null,
        marque_nom: (r.marque_nom ?? null),
        avg_rating: null,
        review_count: null,
    }));
}
async function getProductsByIds(ids) {
    if (ids.length === 0)
        return [];
    const cols = await produitCols();
    const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
    const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
    const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
    const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await exports.db.query(`SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
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
     WHERE p.id IN (${placeholders}) AND p.actif = 1`, ids);
    return rows.map((r) => ({
        id: Number(r.id),
        reference: r.reference,
        nom: r.nom,
        description: (r.description ?? null),
        categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
        categorie_nom: (r.categorie_nom ?? null),
        prix_unitaire: Number(r.prix_unitaire),
        stock_boutique: Number(r.stock_boutique),
        stock_magasin: Number(r.stock_magasin ?? 0),
        remise: Number(r.remise),
        neuf: Boolean(r.neuf),
        image_url: (r.image_url ?? null),
        images: r.images_json ? tryParse(r.images_json) : [],
        variations: r.variations_json ? tryParse(r.variations_json) : null,
        date_creation: (r.sort_col ?? ""),
        marque_id: r.marque_id ? Number(r.marque_id) : null,
        marque_nom: (r.marque_nom ?? null),
    }));
}
async function getProductBySlug(reference) {
    const cols = await produitCols();
    const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
    const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
    const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
    const stockMagasinCol = cols.stock_magasin ? "COALESCE(p.stock_magasin, 0)" : "0";
    const [rows] = await exports.db.execute(`SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
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
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     WHERE p.reference = ? AND p.actif = 1
     LIMIT 1`, [reference]);
    if (!rows.length)
        return null;
    const r = rows[0];
    return {
        id: Number(r.id),
        reference: r.reference,
        nom: r.nom,
        description: (r.description ?? null),
        categorie_id: r.categorie_id ? Number(r.categorie_id) : null,
        categorie_nom: (r.categorie_nom ?? null),
        prix_unitaire: Number(r.prix_unitaire),
        stock_boutique: Number(r.stock_boutique),
        stock_magasin: Number(r.stock_magasin ?? 0),
        remise: Number(r.remise),
        neuf: Boolean(r.neuf),
        image_url: (r.image_url ?? null),
        images: r.images_json ? tryParse(r.images_json) : [],
        variations: r.variations_json ? tryParse(r.variations_json) : null,
        date_creation: (r.sort_col ?? ""),
        marque_id: r.marque_id ? Number(r.marque_id) : null,
        marque_nom: (r.marque_nom ?? null),
    };
}
async function getProductCount(opts) {
    const { categoryId, marqueId, search, promoOnly, newOnly, inStock, minPrice, maxPrice, statut, includeInactive = false } = opts ?? {};
    const cols = await produitCols();
    const conditions = includeInactive ? [] : ["p.actif = 1"];
    const params = [];
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
    const [rows] = await exports.db.execute(`SELECT COUNT(*) as cnt FROM produits p WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}`, params);
    return Number(rows[0]?.cnt ?? 0);
}
async function getProductStatusCounts() {
    const [rows] = await exports.db.execute(`SELECT
       COUNT(*) AS total,
       SUM(COALESCE(stock_boutique, 0) > 5)             AS disponible,
       SUM(COALESCE(stock_boutique, 0) BETWEEN 1 AND 5) AS faible,
       SUM(COALESCE(stock_boutique, 0) = 0)             AS epuise
     FROM produits`);
    const r = rows[0];
    return {
        total: Number(r?.total ?? 0),
        disponible: Number(r?.disponible ?? 0),
        faible: Number(r?.faible ?? 0),
        epuise: Number(r?.epuise ?? 0),
    };
}
async function getCategories() {
    const [rows] = await exports.db.execute(`SELECT c.id, c.nom, c.description, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     GROUP BY c.id, c.nom, c.description
     ORDER BY product_count DESC`);
    return rows;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParse(json) {
    // MySQL JSON columns are already parsed as objects/arrays by mysql2 — return them directly
    if (Array.isArray(json) || (typeof json === "object" && json !== null))
        return json;
    if (!json)
        return null;
    try {
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
async function getProductVariants(productId) {
    try {
        const [tableCheck] = await exports.db.execute(`SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'`);
        if (!Number(tableCheck[0]?.cnt))
            return [];
        const [rows] = await exports.db.execute("SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC", [productId]);
        return rows.map((r) => ({
            id: Number(r.id),
            produit_id: Number(r.produit_id),
            nom: r.nom,
            options: typeof r.options === "string" ? JSON.parse(r.options) : r.options ?? {},
            prix: Number(r.prix),
            stock: Number(r.stock),
            reference_sku: (r.reference_sku ?? null),
        }));
    }
    catch {
        return [];
    }
}
