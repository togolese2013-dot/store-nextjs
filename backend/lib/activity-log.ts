import { db } from "@/lib/db";

// ── Table ─────────────────────────────────────────────────────────────────────

export async function ensureActivityLogsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      shop_id     INT UNSIGNED NOT NULL,
      username    VARCHAR(100) NOT NULL DEFAULT 'Système',
      action_type VARCHAR(80)  NOT NULL,
      entity      VARCHAR(50)  NOT NULL,
      entity_id   INT UNSIGNED NULL,
      label       VARCHAR(255) NULL,
      workspace   VARCHAR(50)  NOT NULL DEFAULT 'Admin',
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shop_date  (shop_id, created_at),
      INDEX idx_workspace  (workspace),
      INDEX idx_username   (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface ActivityLogInput {
  shopId:     number;
  username:   string;
  actionType: string;
  entity:     string;
  entityId?:  number;
  label?:     string;
  workspace:  string;
}

export async function logActivity(input: ActivityLogInput) {
  try {
    await db.execute(
      `INSERT INTO activity_logs (shop_id, username, action_type, entity, entity_id, label, workspace)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.shopId,
        input.username,
        input.actionType,
        input.entity,
        input.entityId ?? null,
        input.label ?? null,
        input.workspace,
      ]
    );
  } catch {
    // never block the main flow
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export interface ActivityLogFilters {
  limit?:     number;
  offset?:    number;
  workspace?: string;
  actionType?: string;
  username?:  string;
  dateFrom?:  string;
  dateTo?:    string;
}

export async function getActivityLogs(shopId: number, filters: ActivityLogFilters = {}) {
  const {
    limit     = 50,
    offset    = 0,
    workspace,
    actionType,
    username,
    dateFrom,
    dateTo,
  } = filters;

  const conds: string[] = ["shop_id = ?"];
  const params: unknown[] = [shopId];

  if (workspace)   { conds.push("workspace = ?");         params.push(workspace); }
  if (actionType)  { conds.push("action_type = ?");       params.push(actionType); }
  if (username)    { conds.push("username = ?");           params.push(username); }
  if (dateFrom)    { conds.push("DATE(created_at) >= ?"); params.push(dateFrom); }
  if (dateTo)      { conds.push("DATE(created_at) <= ?"); params.push(dateTo); }

  const where = conds.join(" AND ");

  const [rows]  = await db.execute<import("mysql2/promise").RowDataPacket[]>(
    `SELECT id, username, action_type, entity, entity_id, label, workspace, created_at
     FROM activity_logs WHERE ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[cnt]] = await db.execute<import("mysql2/promise").RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM activity_logs WHERE ${where}`,
    params
  );

  return { logs: rows, total: Number(cnt?.total ?? 0) };
}
