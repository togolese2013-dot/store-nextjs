import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

export type SessionUserTable = "admin_users" | "utilisateurs";

export interface AdminSessionRow {
  id:            number;
  jti:           string;
  ip:            string;
  device_label:  string | null;
  created_at:    string;
  last_seen_at:  string;
}

export async function ensureAdminSessionsTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      jti           VARCHAR(36)  NOT NULL UNIQUE,
      user_id       INT UNSIGNED NOT NULL,
      user_table    ENUM('admin_users','utilisateurs') NOT NULL,
      shop_id       INT UNSIGNED NULL,
      ip            VARCHAR(45)  NOT NULL DEFAULT '',
      user_agent    VARCHAR(255) NULL,
      device_label  VARCHAR(100) NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revoked_at    DATETIME     NULL,
      INDEX idx_user (user_id, user_table),
      INDEX idx_revoked (revoked_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/** OS + browser guess from the User-Agent header — no external geoip/UA lib, best effort only. */
export function deviceLabelFromUA(ua: string | undefined | null): string {
  if (!ua) return "Appareil inconnu";
  const os =
    /iphone|ipad/i.test(ua)    ? "iOS" :
    /android/i.test(ua)        ? "Android" :
    /mac os x/i.test(ua)       ? "macOS" :
    /windows/i.test(ua)        ? "Windows" :
    /linux/i.test(ua)          ? "Linux" : null;
  const browser =
    /edg\//i.test(ua)         ? "Edge" :
    /opr\/|opera/i.test(ua)   ? "Opera" :
    /chrome\//i.test(ua)      ? "Chrome" :
    /crios\//i.test(ua)       ? "Chrome" :
    /firefox\//i.test(ua)     ? "Firefox" :
    /safari\//i.test(ua)      ? "Safari" : null;
  if (os && browser) return `${os} · ${browser}`;
  return os ?? browser ?? "Appareil inconnu";
}

export async function createSession(data: {
  jti: string; userId: number; userTable: SessionUserTable;
  shopId: number | null; ip: string; userAgent: string | undefined;
}): Promise<void> {
  await db.execute(
    `INSERT INTO admin_sessions (jti, user_id, user_table, shop_id, ip, user_agent, device_label)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.jti, data.userId, data.userTable, data.shopId, data.ip, data.userAgent ?? null, deviceLabelFromUA(data.userAgent)]
  );
}

export async function isSessionRevoked(jti: string): Promise<boolean> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT revoked_at FROM admin_sessions WHERE jti = ? LIMIT 1", [jti]
  );
  const row = rows[0];
  if (!row) return false; // no row (pre-migration token or race at login) — fail open
  return row.revoked_at !== null;
}

export async function touchSession(jti: string): Promise<void> {
  await db.execute(
    "UPDATE admin_sessions SET last_seen_at = NOW() WHERE jti = ? AND revoked_at IS NULL", [jti]
  );
}

export async function getSessionsForUser(userId: number, userTable: SessionUserTable): Promise<AdminSessionRow[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, jti, ip, device_label, created_at, last_seen_at
     FROM admin_sessions
     WHERE user_id = ? AND user_table = ? AND revoked_at IS NULL
     ORDER BY last_seen_at DESC`,
    [userId, userTable]
  );
  return rows as AdminSessionRow[];
}

/** Revoke one session by its row id — scoped to the owning user so nobody can revoke another account's session. */
export async function revokeSessionById(id: number, userId: number, userTable: SessionUserTable): Promise<void> {
  await db.execute(
    "UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ? AND user_id = ? AND user_table = ?",
    [id, userId, userTable]
  );
}

/** Revoke this device's own session (used by logout — does not touch other devices). */
export async function revokeSessionByJti(jti: string): Promise<void> {
  await db.execute("UPDATE admin_sessions SET revoked_at = NOW() WHERE jti = ?", [jti]);
}

export async function revokeOtherSessions(userId: number, userTable: SessionUserTable, exceptJti: string): Promise<void> {
  await db.execute(
    `UPDATE admin_sessions SET revoked_at = NOW()
     WHERE user_id = ? AND user_table = ? AND jti != ? AND revoked_at IS NULL`,
    [userId, userTable, exceptJti]
  );
}
