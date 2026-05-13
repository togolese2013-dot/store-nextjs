"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSecurityLogsTable = ensureSecurityLogsTable;
exports.logSecurityEvent = logSecurityEvent;
exports.getSecurityLogs = getSecurityLogs;
const db_1 = require("@/lib/db");
async function ensureSecurityLogsTable() {
    await db_1.db.execute(`
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
async function logSecurityEvent(action, username, ip, userAgent, details) {
    try {
        await db_1.db.execute("INSERT INTO security_logs (action, username, ip, user_agent, details) VALUES (?, ?, ?, ?, ?)", [action, username, ip, userAgent ?? null, details ?? null]);
    }
    catch {
        // Never let logging crash the app
    }
}
async function getSecurityLogs(limit = 100) {
    const [rows] = await db_1.db.execute(`SELECT id, action, username, ip, details, created_at
     FROM security_logs
     ORDER BY created_at DESC
     LIMIT ${Number(limit)}`);
    return rows;
}
