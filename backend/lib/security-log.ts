import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

export async function ensureSecurityLogsTable() {
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
  // Add shop_id column if missing (migration)
  try {
    await db.execute(`ALTER TABLE security_logs ADD COLUMN shop_id INT UNSIGNED NULL`);
    await db.execute(`ALTER TABLE security_logs ADD INDEX idx_shop (shop_id)`);
  } catch { /* already exists */ }
}

export type SecurityAction =
  | "login_success"
  | "login_failure"
  | "login_locked"
  | "logout"
  | "password_change";

export async function logSecurityEvent(
  action:     SecurityAction,
  username:   string,
  ip:         string,
  userAgent?: string,
  details?:   string,
  shopId?:    number,
) {
  try {
    await db.execute(
      "INSERT INTO security_logs (action, username, ip, user_agent, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [action, username, ip, userAgent ?? null, details ?? null, shopId ?? null]
    );
  } catch {
    // Never let logging crash the app
  }
}

export async function getSecurityLogs(limit = 100, shopId?: number): Promise<mysql.RowDataPacket[]> {
  // Filter by shop_id if column exists and shopId provided
  let query = `SELECT id, action, username, ip, details, created_at FROM security_logs`;
  const params: unknown[] = [];
  if (shopId) {
    query += ` WHERE shop_id = ?`;
    params.push(shopId);
  }
  query += ` ORDER BY created_at DESC LIMIT ${Number(limit)}`;
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(query, params);
    return rows as mysql.RowDataPacket[];
  } catch {
    // Fallback without shop_id filter if column doesn't exist yet
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, action, username, ip, details, created_at FROM security_logs ORDER BY created_at DESC LIMIT ${Number(limit)}`
    );
    return rows as mysql.RowDataPacket[];
  }
}
