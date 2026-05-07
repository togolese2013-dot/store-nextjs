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
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_action   (action),
      INDEX idx_created  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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
) {
  try {
    await db.execute(
      "INSERT INTO security_logs (action, username, ip, user_agent, details) VALUES (?, ?, ?, ?, ?)",
      [action, username, ip, userAgent ?? null, details ?? null]
    );
  } catch {
    // Never let logging crash the app
  }
}

export async function getSecurityLogs(limit = 100): Promise<mysql.RowDataPacket[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, action, username, ip, details, created_at
     FROM security_logs
     ORDER BY created_at DESC
     LIMIT ${Number(limit)}`
  );
  return rows as mysql.RowDataPacket[];
}
