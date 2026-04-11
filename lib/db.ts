import "server-only";
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
  return mysql.createPool({
    host:               process.env.DB_HOST     || "127.0.0.1",
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || "root",
    password:           process.env.DB_PASSWORD || "",
    database:           process.env.DB_NAME     || "togol2600657",
    waitForConnections: true,
    connectionLimit:    10,
    charset:            "utf8mb4",
    timezone:           "+00:00",
  });
}

export const db: mysql.Pool =
  globalThis.__db_pool ?? (globalThis.__db_pool = createPool());

/* ─── Schema introspection (cached) ─── */
let _cols: Record<string, boolean> | null = null;

async function produitCols() {
  if (_cols) return _cols;
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
  _cols = {
    remise:          names.has("remise"),
    neuf:            names.has("neuf"),
    variations_json: names.has("variations_json"),
    images_json:     names.has("images_json"),
    image:           names.has("image"),
    image_url:       names.has("image_url"),
    date_creation:   names.has("date_creation"),
    created_at:      names.has("created_at"),
  };
  return _cols;
}

/* ─── Queries ─── */
export async function getProducts(opts?: {
  categoryId?: number;
  search?: string;
  promoOnly?: boolean;
  newOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const {
    categoryId, search, promoOnly, newOnly,
    limit = 60, offset = 0,
  } = opts ?? {};

  const cols = await produitCols();

  const conditions: string[] = ["p.actif = 1"];
  const params: (string | number)[] = [];

  if (categoryId) { conditions.push("p.categorie_id = ?"); params.push(categoryId); }
  if (search)     { conditions.push("(p.nom LIKE ? OR p.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (promoOnly && cols.remise)  { conditions.push("p.remise > 0"); }
  if (newOnly   && cols.neuf)    { conditions.push("p.neuf = 1"); }

  const where    = conditions.join(" AND ");
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";

  const safeLimit  = Math.max(1, Math.min(200, Number(limit)));
  const safeOffset = Math.max(0, Number(offset));

  // Use query() to avoid LIMIT/OFFSET issues with server-side prepared statements
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                          AS prix_unitaire,
       CAST(p.stock_boutique AS SIGNED)                                         AS stock_boutique,
       ${cols.remise         ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)"  : "0"    } AS remise,
       ${cols.neuf           ? "COALESCE(p.neuf, 1)"                           : "1"    } AS neuf,
       ${imageCol}                                                                          AS image_url,
       ${cols.variations_json ? "p.variations_json"                            : "NULL" } AS variations_json,
       ${cols.images_json     ? "p.images_json"                                : "NULL" } AS images_json,
       ${orderCol}                                                                          AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
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
    remise:         Number(r.remise),
    neuf:           Boolean(r.neuf),
    image_url:      (r.image_url ?? null) as string | null,
    images:         r.images_json ? tryParse(r.images_json as string) : [],
    variations:     r.variations_json ? tryParse(r.variations_json as string) : null,
    date_creation:  (r.sort_col ?? "") as string,
  })) as Product[];
}

export async function getProductBySlug(reference: string): Promise<Product | null> {
  const cols = await produitCols();
  const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const orderCol = cols.date_creation ? "p.date_creation" : cols.created_at ? "p.created_at" : "p.id";

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       p.id, p.reference, p.nom, p.description, p.categorie_id,
       CAST(p.prix_unitaire AS SIGNED)                                        AS prix_unitaire,
       CAST(p.stock_boutique AS SIGNED)                                       AS stock_boutique,
       ${cols.remise         ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)),0)" : "0"   } AS remise,
       ${cols.neuf           ? "COALESCE(p.neuf,1)"                         : "1"   } AS neuf,
       ${imageCol}                                                                      AS image_url,
       ${cols.variations_json ? "p.variations_json"                         : "NULL"} AS variations_json,
       ${cols.images_json     ? "p.images_json"                             : "NULL"} AS images_json,
       ${orderCol}                                                                      AS sort_col,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
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
    remise:         Number(r.remise),
    neuf:           Boolean(r.neuf),
    image_url:      (r.image_url ?? null) as string | null,
    images:         r.images_json ? tryParse(r.images_json as string) : [],
    variations:     r.variations_json ? tryParse(r.variations_json as string) : null,
    date_creation:  (r.sort_col ?? "") as string,
  };
}

export async function getProductCount(opts?: {
  categoryId?: number;
  search?: string;
  promoOnly?: boolean;
  newOnly?: boolean;
}): Promise<number> {
  const { categoryId, search, promoOnly, newOnly } = opts ?? {};
  const cols = await produitCols();

  const conditions: string[] = ["p.actif = 1"];
  const params: (string | number)[] = [];

  if (categoryId) { conditions.push("p.categorie_id = ?"); params.push(categoryId); }
  if (search)     { conditions.push("(p.nom LIKE ? OR p.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (promoOnly && cols.remise) { conditions.push("p.remise > 0"); }
  if (newOnly   && cols.neuf)   { conditions.push("p.neuf = 1"); }

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM produits p WHERE ${conditions.join(" AND ")}`,
    params
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function getCategories(): Promise<Category[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, description FROM categories ORDER BY nom ASC"
  );
  return rows as Category[];
}

function tryParse(json: string) {
  try { return JSON.parse(json); } catch { return null; }
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
