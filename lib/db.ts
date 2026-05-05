import mysql from "mysql2/promise";
export type { Product, Category } from "./utils";
export { finalPrice, formatPrice } from "./utils";
import type { Product, Category } from "./utils";

/* Singleton connection pool — reused across hot-reloads in dev */
declare global {
  // eslint-disable-next-line no-var
  var __db_pool: mysql.Pool | undefined;
}

function createPool() {
  const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
  const isProduction = process.env.NODE_ENV === "production";

  // Validate URL has protocol before using it
  const url = rawUrl?.startsWith("mysql://") || rawUrl?.startsWith("mysql2://")
    ? rawUrl
    : undefined;

  if (url) {
    return mysql.createPool({
      uri:                url,
      waitForConnections: true,
      connectionLimit:    3,
      charset:            "utf8mb4",
      timezone:           "+00:00",
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    });
  }
  return mysql.createPool({
    host:               process.env.DB_HOST     || "127.0.0.1",
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || "root",
    password:           process.env.DB_PASSWORD || "",
    database:           process.env.DB_NAME     || "togol2600657",
    waitForConnections: true,
    connectionLimit:    3,
    charset:            "utf8mb4",
    timezone:           "+00:00",
  });
}

function getOrCreatePool(): mysql.Pool {
  if (globalThis.__db_pool) return globalThis.__db_pool;
  const pool = createPool();
  // Prevent uncaught EventEmitter errors from crashing the process
  (pool as unknown as { on: (e: string, fn: (err: Error) => void) => void })
    .on("error", (err: Error) => console.error("[db pool]", err.message));
  globalThis.__db_pool = pool;
  return pool;
}

export const db: mysql.Pool = getOrCreatePool();

/* ─── Schema introspection (cached) ─── */
let _cols: Record<string, boolean> | null = null;

export async function produitCols() {
  if (_cols) return _cols;
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));

  // Auto-migrate: add images_json column if missing
  if (!names.has("images_json")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
      names.add("images_json");
    } catch (e: unknown) {
      // ER_DUP_FIELDNAME = column already exists (race or prior migration) — still mark as present
      const err = e as { code?: string; message?: string };
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("images_json");
      }
    }
  }

  // Auto-migrate: add stock_minimum column if missing
  if (!names.has("stock_minimum")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN stock_minimum INT NULL DEFAULT 5`);
      names.add("stock_minimum");
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("stock_minimum");
      }
    }
  }

  // Auto-migrate: add marque_id column if missing
  if (!names.has("marque_id")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`);
      names.add("marque_id");
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        names.add("marque_id");
      }
    }
  }

  // Ensure marques table exists
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS marques (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch { /* already exists */ }

  // Auto-migrate: add stock_magasin column directly on produits if missing
  if (!names.has("stock_magasin")) {
    try {
      await db.execute(`ALTER TABLE produits ADD COLUMN stock_magasin INT NOT NULL DEFAULT 0`);
      names.add("stock_magasin");
      // Migrate existing data from produit_stocks
      try {
        const [psRows] = await db.execute<mysql.RowDataPacket[]>(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produit_stocks'`
        );
        const psCols = new Set(psRows.map(r => (r.COLUMN_NAME as string).toLowerCase()));
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
      } catch { /* migration of existing data optional */ }
    } catch { /* ALTER may fail if column already added by concurrent request */ }
  }

  _cols = {
    remise:          names.has("remise"),
    neuf:            names.has("neuf"),
    stock_boutique:  names.has("stock_boutique"),
    stock_magasin:   names.has("stock_magasin"),
    stock_minimum:   names.has("stock_minimum"),
    variations_json: names.has("variations_json"),
    images_json:     names.has("images_json"),
    image:           names.has("image"),
    image_url:       names.has("image_url"),
    date_creation:   names.has("date_creation"),
    created_at:      names.has("created_at"),
    marque_id:       names.has("marque_id"),
  };
  return _cols;
}

export function invalidateProduitColsCache() { _cols = null; }

/* ─── Reviews table presence check (cached, exported for routes) ─── */
let _hasReviews: boolean | null = null;

export async function checkReviewsTable(): Promise<boolean> {
  if (_hasReviews !== null) return _hasReviews;
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' LIMIT 1"
    );
    _hasReviews = (rows as mysql.RowDataPacket[]).length > 0;
    if (_hasReviews) await _ensureReviewsRatingCol();
  } catch { _hasReviews = false; }
  return _hasReviews;
}

async function _ensureReviewsRatingCol() {
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'
       AND COLUMN_NAME IN ('note', 'rating')`
    );
    const cols = new Set((rows as mysql.RowDataPacket[]).map(r => r.COLUMN_NAME as string));
    if (cols.has("note") && !cols.has("rating")) {
      await db.execute("ALTER TABLE reviews CHANGE COLUMN note rating TINYINT NOT NULL DEFAULT 5");
    } else if (!cols.has("note") && !cols.has("rating")) {
      await db.execute("ALTER TABLE reviews ADD COLUMN rating TINYINT NOT NULL DEFAULT 5");
    }
  } catch { /* ignore — table may not exist yet */ }
}

/* ─── Queries ─── */
export async function getProducts(opts?: {
  categoryId?: number;
  marqueId?:   number;
  search?: string;
  referenceExact?: string;
  promoOnly?: boolean;
  newOnly?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  statut?: "disponible" | "faible" | "epuise";
  includeInactive?: boolean;
}): Promise<Product[]> {
  const {
    categoryId, marqueId, search, referenceExact, promoOnly, newOnly,
    inStock, minPrice, maxPrice,
    limit = 60, offset = 0, statut, includeInactive = false,
  } = opts ?? {};

  const cols = await produitCols();

  const conditions: string[] = includeInactive ? [] : ["p.actif = 1"];
  const params: (string | number)[] = [];

  if (categoryId)      { conditions.push("p.categorie_id = ?"); params.push(categoryId); }
  if (marqueId)        { conditions.push("p.marque_id = ?");    params.push(marqueId); }
  if (referenceExact)  { conditions.push("p.reference = ?");    params.push(referenceExact); }
  if (search)          { conditions.push("(p.nom LIKE ? OR p.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (promoOnly && cols.remise)  { conditions.push("p.remise > 0"); }
  if (newOnly   && cols.neuf)    { conditions.push("p.neuf = 1"); }
  if (statut === "disponible")   { conditions.push("COALESCE(p.stock_boutique, 0) > 5"); }
  if (statut === "faible")       { conditions.push("COALESCE(p.stock_boutique, 0) > 0 AND COALESCE(p.stock_boutique, 0) <= 5"); }
  if (statut === "epuise")       { conditions.push("COALESCE(p.stock_boutique, 0) = 0"); }
  if (inStock)                   { conditions.push("COALESCE(p.stock_boutique, 0) > 0"); }
  if (minPrice != null && !isNaN(minPrice)) { conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) >= ?"); params.push(minPrice); }
  if (maxPrice != null && !isNaN(maxPrice)) { conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) <= ?"); params.push(maxPrice); }

  const where    = conditions.length > 0 ? conditions.join(" AND ") : "1=1";
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol  = cols.stock_magasin  ? "COALESCE(p.stock_magasin, 0)"    : "0";

  const safeLimit  = Math.max(1, Math.min(200, Number(limit)));
  const safeOffset = Math.max(0, Number(offset));

  // Use query() to avoid LIMIT/OFFSET issues with server-side prepared statements
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                          AS prix_unitaire,
       ${stockBoutiqueCol}                                                       AS stock_boutique,
       ${stockMagasinCol}                                                        AS stock_magasin,
       ${cols.remise         ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)"  : "0"    } AS remise,
       ${cols.neuf           ? "COALESCE(p.neuf, 1)"                           : "1"    } AS neuf,
       ${imageCol}                                                                          AS image_url,
       ${cols.variations_json ? "p.variations_json"                            : "NULL" } AS variations_json,
       ${cols.images_json     ? "p.images_json"                                : "NULL" } AS images_json,
       ${cols.marque_id       ? "p.marque_id"                                  : "NULL" } AS marque_id,
       ${cols.marque_id       ? "m.nom"                                        : "NULL" } AS marque_nom,
       ${orderCol}                                                                          AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     WHERE ${where}
     ORDER BY ${orderCol} DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows.map((r) => ({
    id:             Number(r.id),
    reference:      r.reference as string,
    nom:            r.nom as string,
    description:    (r.description ?? null) as string | null,
    categorie_id:   r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom:  (r.categorie_nom ?? null) as string | null,
    prix_unitaire:  Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin:  Number(r.stock_magasin ?? 0),
    remise:         Number(r.remise),
    neuf:           Boolean(r.neuf),
    image_url:      (r.image_url ?? null) as string | null,
    images:         r.images_json ? tryParse(r.images_json as string) : [],
    variations:     r.variations_json ? tryParse(r.variations_json as string) : null,
    date_creation:  (r.sort_col ?? "") as string,
    marque_id:      r.marque_id ? Number(r.marque_id) : null,
    marque_nom:     (r.marque_nom ?? null) as string | null,
    avg_rating:     null,
    review_count:   null,
  })) as Product[];
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const cols = await produitCols();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol  = cols.stock_magasin  ? "COALESCE(p.stock_magasin, 0)"    : "0";

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                          AS prix_unitaire,
       ${stockBoutiqueCol}                                                       AS stock_boutique,
       ${stockMagasinCol}                                                        AS stock_magasin,
       ${cols.remise         ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)"  : "0"    } AS remise,
       ${cols.neuf           ? "COALESCE(p.neuf, 1)"                           : "1"    } AS neuf,
       ${imageCol}                                                                          AS image_url,
       ${cols.variations_json ? "p.variations_json"                            : "NULL" } AS variations_json,
       ${cols.images_json     ? "p.images_json"                                : "NULL" } AS images_json,
       ${cols.marque_id       ? "p.marque_id"                                  : "NULL" } AS marque_id,
       ${cols.marque_id       ? "m.nom"                                        : "NULL" } AS marque_nom,
       ${orderCol}                                                                          AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     WHERE p.id IN (${placeholders}) AND p.actif = 1`,
    ids
  );

  return rows.map((r) => ({
    id:             Number(r.id),
    reference:      r.reference as string,
    nom:            r.nom as string,
    description:    (r.description ?? null) as string | null,
    categorie_id:   r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom:  (r.categorie_nom ?? null) as string | null,
    prix_unitaire:  Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin:  Number(r.stock_magasin ?? 0),
    remise:         Number(r.remise),
    neuf:           Boolean(r.neuf),
    image_url:      (r.image_url ?? null) as string | null,
    images:         r.images_json ? tryParse(r.images_json as string) : [],
    variations:     r.variations_json ? tryParse(r.variations_json as string) : null,
    date_creation:  (r.sort_col ?? "") as string,
    marque_id:      r.marque_id ? Number(r.marque_id) : null,
    marque_nom:     (r.marque_nom ?? null) as string | null,
  })) as Product[];
}

export async function getProductBySlug(reference: string): Promise<Product | null> {
  const cols = await produitCols();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";
  const stockBoutiqueCol = cols.stock_boutique ? "CAST(p.stock_boutique AS SIGNED)" : "0";
  const stockMagasinCol  = cols.stock_magasin  ? "COALESCE(p.stock_magasin, 0)"    : "0";

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                        AS prix_unitaire,
       ${stockBoutiqueCol}                                                     AS stock_boutique,
       ${stockMagasinCol}                                                      AS stock_magasin,
       ${cols.remise         ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)),0)" : "0"   } AS remise,
       ${cols.neuf           ? "COALESCE(p.neuf,1)"                         : "1"   } AS neuf,
       ${imageCol}                                                                      AS image_url,
       ${cols.variations_json ? "p.variations_json"                         : "NULL"} AS variations_json,
       ${cols.images_json     ? "p.images_json"                             : "NULL"} AS images_json,
       ${cols.marque_id       ? "p.marque_id"                               : "NULL"} AS marque_id,
       ${cols.marque_id       ? "m.nom"                                     : "NULL"} AS marque_nom,
       ${orderCol}                                                                      AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     ${cols.marque_id ? "LEFT JOIN marques m ON p.marque_id = m.id" : ""}
     WHERE p.reference = ? AND p.actif = 1
     LIMIT 1`,
    [reference]
  );

  if (!rows.length) return null;
  const r = rows[0];
  return {
    id:             Number(r.id),
    reference:      r.reference as string,
    nom:            r.nom as string,
    description:    (r.description ?? null) as string | null,
    categorie_id:   r.categorie_id ? Number(r.categorie_id) : null,
    categorie_nom:  (r.categorie_nom ?? null) as string | null,
    prix_unitaire:  Number(r.prix_unitaire),
    stock_boutique: Number(r.stock_boutique),
    stock_magasin:  Number(r.stock_magasin ?? 0),
    remise:         Number(r.remise),
    neuf:           Boolean(r.neuf),
    image_url:      (r.image_url ?? null) as string | null,
    images:         r.images_json ? tryParse(r.images_json as string) : [],
    variations:     r.variations_json ? tryParse(r.variations_json as string) : null,
    date_creation:  (r.sort_col ?? "") as string,
    marque_id:      r.marque_id ? Number(r.marque_id) : null,
    marque_nom:     (r.marque_nom ?? null) as string | null,
  };
}

export async function getProductCount(opts?: {
  categoryId?: number;
  marqueId?:   number;
  search?: string;
  promoOnly?: boolean;
  newOnly?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  statut?: "disponible" | "faible" | "epuise";
  includeInactive?: boolean;
}): Promise<number> {
  const { categoryId, marqueId, search, promoOnly, newOnly, inStock, minPrice, maxPrice, statut, includeInactive = false } = opts ?? {};
  const cols = await produitCols();

  const conditions: string[] = includeInactive ? [] : ["p.actif = 1"];
  const params: (string | number)[] = [];

  if (categoryId) { conditions.push("p.categorie_id = ?"); params.push(categoryId); }
  if (marqueId)   { conditions.push("p.marque_id = ?");    params.push(marqueId); }
  if (search)     { conditions.push("(p.nom LIKE ? OR p.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (promoOnly && cols.remise) { conditions.push("p.remise > 0"); }
  if (newOnly   && cols.neuf)   { conditions.push("p.neuf = 1"); }
  if (inStock)  { conditions.push("COALESCE(p.stock_boutique, 0) > 0"); }
  if (statut === "disponible")  { conditions.push("COALESCE(p.stock_boutique, 0) > 5"); }
  if (statut === "faible")      { conditions.push("COALESCE(p.stock_boutique, 0) > 0 AND COALESCE(p.stock_boutique, 0) <= 5"); }
  if (statut === "epuise")      { conditions.push("COALESCE(p.stock_boutique, 0) = 0"); }
  if (minPrice != null && !isNaN(minPrice)) { conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) >= ?"); params.push(minPrice); }
  if (maxPrice != null && !isNaN(maxPrice)) { conditions.push("(CAST(p.prix_unitaire AS SIGNED) - COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)) <= ?"); params.push(maxPrice); }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM produits p WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}`,
    params
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function getProductStatusCounts(): Promise<{
  total: number; disponible: number; faible: number; epuise: number;
}> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(COALESCE(stock_boutique, 0) > 5)             AS disponible,
       SUM(COALESCE(stock_boutique, 0) BETWEEN 1 AND 5) AS faible,
       SUM(COALESCE(stock_boutique, 0) = 0)             AS epuise
     FROM produits`
  );
  const r = (rows as mysql.RowDataPacket[])[0];
  return {
    total:      Number(r?.total      ?? 0),
    disponible: Number(r?.disponible ?? 0),
    faible:     Number(r?.faible     ?? 0),
    epuise:     Number(r?.epuise     ?? 0),
  };
}

export async function getCategories(): Promise<Category[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT c.id, c.nom, c.description, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     GROUP BY c.id, c.nom, c.description
     ORDER BY product_count DESC`
  );
  return rows as Category[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParse(json: unknown): any {
  // MySQL JSON columns are already parsed as objects/arrays by mysql2 — return them directly
  if (Array.isArray(json) || (typeof json === "object" && json !== null)) return json;
  if (!json) return null;
  try { return JSON.parse(json as string); } catch { return null; }
}

/* ─── Product Variants ─── */
export interface ProductVariant {
  id: number;
  produit_id: number;
  nom: string;
  options: Record<string, string>;
  prix: number;
  stock: number;
  reference_sku: string | null;
}

export async function getProductVariants(productId: number): Promise<ProductVariant[]> {
  try {
    const [tableCheck] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'`
    );
    if (!Number(tableCheck[0]?.cnt)) return [];

    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC",
      [productId]
    );
    return rows.map((r) => ({
      id:            Number(r.id),
      produit_id:    Number(r.produit_id),
      nom:           r.nom as string,
      options:       typeof r.options === "string" ? JSON.parse(r.options) : r.options ?? {},
      prix:          Number(r.prix),
      stock:         Number(r.stock),
      reference_sku: (r.reference_sku ?? null) as string | null,
    }));
  } catch {
    return [];
  }
}
