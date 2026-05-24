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
