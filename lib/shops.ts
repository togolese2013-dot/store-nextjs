import { db } from "./db";
import mysql from "mysql2/promise";

export interface Shop {
  id:         number;
  nom:        string;
  slug:       string;
  email:      string;
  plan:       "free" | "basic" | "pro";
  actif:      boolean;
  created_at: string;
}

let _ensured = false;

export async function ensureShopsTable(): Promise<void> {
  if (_ensured) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shops (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(150)                       NOT NULL,
      slug       VARCHAR(100)                       NOT NULL UNIQUE,
      email      VARCHAR(150)                       NOT NULL,
      plan       ENUM('free','basic','pro')         NOT NULL DEFAULT 'basic',
      actif      TINYINT(1)                         NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Shop #1 = legacy single-tenant data
  await db.execute(
    `INSERT IGNORE INTO shops (id, nom, slug, email) VALUES (1, 'Default Shop', 'default', 'admin@shop.com')`
  );
  _ensured = true;
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shops WHERE slug = ? AND actif = 1 LIMIT 1",
    [slug]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif) } as Shop;
}

export async function getShopById(id: number): Promise<Shop | null> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shops WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif) } as Shop;
}

export async function createShop(data: {
  nom:   string;
  slug:  string;
  email: string;
  plan?: "free" | "basic" | "pro";
}): Promise<number> {
  await ensureShopsTable();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO shops (nom, slug, email, plan) VALUES (?, ?, ?, ?)`,
    [data.nom, data.slug, data.email, data.plan ?? "basic"]
  );
  return result.insertId;
}

export async function listShops(): Promise<Shop[]> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shops ORDER BY created_at DESC"
  );
  return rows.map(r => ({ ...r, actif: Boolean(r.actif) })) as Shop[];
}

export async function updateShop(
  id: number,
  data: Partial<{ nom: string; email: string; plan: "free" | "basic" | "pro"; actif: boolean }>
): Promise<void> {
  await ensureShopsTable();
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (data.nom   !== undefined) { sets.push("nom = ?");   vals.push(data.nom); }
  if (data.email !== undefined) { sets.push("email = ?"); vals.push(data.email); }
  if (data.plan  !== undefined) { sets.push("plan = ?");  vals.push(data.plan); }
  if (data.actif !== undefined) { sets.push("actif = ?"); vals.push(data.actif ? 1 : 0); }
  if (!sets.length) return;
  vals.push(id);
  await db.execute(`UPDATE shops SET ${sets.join(", ")} WHERE id = ?`, vals);
}

export async function listShopsWithStats(): Promise<
  (Shop & { product_count: number; admin_count: number })[]
> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
    SELECT
      s.*,
      COALESCE(p.cnt, 0)  AS product_count,
      COALESCE(a.cnt, 0)  AS admin_count
    FROM shops s
    LEFT JOIN (SELECT shop_id, COUNT(*) AS cnt FROM produits GROUP BY shop_id) p ON p.shop_id = s.id
    LEFT JOIN (SELECT shop_id, COUNT(*) AS cnt FROM admin_users GROUP BY shop_id) a ON a.shop_id = s.id
    ORDER BY s.created_at DESC
  `);
  return rows.map(r => ({
    ...r,
    actif:         Boolean(r.actif),
    product_count: Number(r.product_count),
    admin_count:   Number(r.admin_count),
  })) as (Shop & { product_count: number; admin_count: number })[];
}
