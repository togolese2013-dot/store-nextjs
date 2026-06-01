import { db } from "./db";
import mysql from "mysql2/promise";

export interface Shop {
  id:                  number;
  nom:                 string;
  slug:                string;
  email:               string;
  plan:                "basic" | "pro" | "business";
  actif:               boolean;
  custom_domain:       string | null;
  subscription_status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at:       string | null;
  current_period_end:  string | null;
  pays:                string | null;
  created_at:          string;
}

export interface ShopPayment {
  id:              number;
  shop_id:         number;
  transaction_id:  string;
  plan:            "pro" | "business";
  amount:          number;
  duration_months: number;
  status:          "pending" | "paid" | "failed" | "cancelled";
  operator:        "moov" | "yas" | null;
  mm_reference:    string | null;
  created_at:      string;
  paid_at:         string | null;
}

let _ensured = false;

export async function ensureShopsTable(): Promise<void> {
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
  // Idempotent column additions for existing installations
  const alterCols = [
    `ALTER TABLE shops ADD COLUMN custom_domain VARCHAR(255) NULL UNIQUE`,
    `ALTER TABLE shops ADD COLUMN subscription_status ENUM('trial','active','expired','suspended') NOT NULL DEFAULT 'trial'`,
    `ALTER TABLE shops ADD COLUMN trial_ends_at DATETIME NULL`,
    `ALTER TABLE shops ADD COLUMN current_period_end DATETIME NULL`,
    `ALTER TABLE shops ADD COLUMN pays VARCHAR(100) NULL`,
  ];
  for (const sql of alterCols) {
    try { await db.execute(sql); } catch { /* already exists */ }
  }

  // shop_payments table
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
  // Idempotent additions for existing shop_payments tables
  const spAlter = [
    `ALTER TABLE shop_payments ADD COLUMN operator VARCHAR(10) NULL`,
    `ALTER TABLE shop_payments ADD COLUMN mm_reference VARCHAR(100) NULL`,
  ];
  for (const sql of spAlter) {
    try { await db.execute(sql); } catch { /* already exists */ }
  }

  // Shop #1 = legacy single-tenant data — always active, no billing
  await db.execute(
    `INSERT IGNORE INTO shops (id, nom, slug, email, subscription_status) VALUES (1, 'Default Shop', 'default', 'admin@shop.com', 'active')`
  );
  // Ensure shop #1 is always active
  await db.execute(
    `UPDATE shops SET subscription_status = 'active' WHERE id = 1 AND subscription_status != 'active'`
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
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null } as Shop;
}

export async function getShopById(id: number): Promise<Shop | null> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shops WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null } as Shop;
}

/** Resolve a shop from its custom domain (exact match, active only). */
export async function getShopByDomain(domain: string): Promise<Shop | null> {
  await ensureShopsTable();
  const normalized = domain.toLowerCase().replace(/^www\./, "").split(":")[0];
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shops WHERE custom_domain = ? AND actif = 1 LIMIT 1",
    [normalized]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null } as Shop;
}

export async function setShopDomain(id: number, domain: string | null): Promise<void> {
  await ensureShopsTable();
  const normalized = domain
    ? domain.toLowerCase().replace(/^www\./, "").split(":")[0]
    : null;
  await db.execute("UPDATE shops SET custom_domain = ? WHERE id = ?", [normalized, id]);
}

export async function createShop(data: {
  nom:   string;
  slug:  string;
  email: string;
  plan?: "basic" | "pro" | "business";
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
  return rows.map(r => ({ ...r, actif: Boolean(r.actif), custom_domain: r.custom_domain ?? null })) as Shop[];
}

export async function updateShop(
  id: number,
  data: Partial<{ nom: string; email: string; plan: "basic" | "pro" | "business"; actif: boolean; subscription_status: "trial" | "active" | "expired" | "suspended" }>
): Promise<void> {
  await ensureShopsTable();
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (data.nom                 !== undefined) { sets.push("nom = ?");                  vals.push(data.nom); }
  if (data.email               !== undefined) { sets.push("email = ?");                vals.push(data.email); }
  if (data.plan                !== undefined) { sets.push("plan = ?");                 vals.push(data.plan); }
  if (data.actif               !== undefined) { sets.push("actif = ?");                vals.push(data.actif ? 1 : 0); }
  if (data.subscription_status !== undefined) { sets.push("subscription_status = ?"); vals.push(data.subscription_status); }
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
    custom_domain: r.custom_domain ?? null,
    product_count: Number(r.product_count),
    admin_count:   Number(r.admin_count),
  })) as (Shop & { product_count: number; admin_count: number })[];
}

// ── Billing helpers ──────────────────────────────────────────────────────────

/** true = shop can access admin (not suspended) */
export function isShopAccessAllowed(shop: Shop): boolean {
  if (shop.id === 1) return true;
  // Check suspension first — overrides plan
  if (!shop.actif) return false;
  if (shop.subscription_status === "suspended") return false;
  if (shop.plan === "basic") return true;
  if (shop.subscription_status === "trial") {
    if (!shop.trial_ends_at) return true;
    return new Date(shop.trial_ends_at) > new Date();
  }
  if (shop.subscription_status === "active") {
    if (!shop.current_period_end) return true;
    return new Date(shop.current_period_end) > new Date();
  }
  // expired — allow with banner, hard block only when suspended
  return true;
}

export async function activateShopSubscription(
  shopId: number,
  plan: "pro" | "business",
  durationMonths: number
): Promise<void> {
  await ensureShopsTable();
  // Extend from current_period_end if still active, otherwise from now
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT current_period_end, subscription_status FROM shops WHERE id = ?",
    [shopId]
  );
  const row = rows[0];
  const base =
    row?.subscription_status === "active" && row?.current_period_end
      ? new Date(row.current_period_end)
      : new Date();
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + durationMonths);

  await db.execute(
    `UPDATE shops SET plan = ?, subscription_status = 'active', current_period_end = ? WHERE id = ?`,
    [plan, newEnd.toISOString().slice(0, 19).replace("T", " "), shopId]
  );
}

export async function recordShopPayment(data: {
  shopId:         number;
  transactionId:  string;
  plan:           "pro" | "business";
  amount:         number;
  durationMonths: number;
  status:         "pending" | "paid" | "failed" | "cancelled";
  operator?:      "moov" | "yas";
  mmReference?:   string;
  paidAt?:        Date;
}): Promise<void> {
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
      data.paidAt ? data.paidAt.toISOString().slice(0, 19).replace("T", " ") : null,
    ]
  );
}

export async function getShopPayments(shopId: number): Promise<ShopPayment[]> {
  await ensureShopsTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM shop_payments WHERE shop_id = ? ORDER BY created_at DESC LIMIT 20",
    [shopId]
  );
  return rows as ShopPayment[];
}

/** Mark expired shops (subscription_status = 'active' but current_period_end past). */
export async function expireShopSubscriptions(): Promise<void> {
  await db.execute(`
    UPDATE shops
    SET subscription_status = 'expired'
    WHERE subscription_status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end < NOW()
      AND id != 1
  `);
}
