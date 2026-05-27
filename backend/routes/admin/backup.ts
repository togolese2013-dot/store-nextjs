import express from "express";
import { spawn } from "child_process";
import { createGzip } from "zlib";
import {
  createWriteStream,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  appendFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import { getSession } from "../../lib/auth";

const router = express.Router();

const BACKUP_DIR = "/tmp/togolese-backups";
const MAX_BACKUPS = 7;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
}

function dbCfg() {
  // 1. Individual env vars (local dev)
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    return {
      host:     process.env.DB_HOST,
      port:     Number(process.env.DB_PORT || 3306),
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
    };
  }

  // 2. URL-based config (Railway/prod: DATABASE_URL, MYSQL_URL, MYSQL_PUBLIC_URL)
  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL    ||
    process.env.MYSQL_PUBLIC_URL;

  if (rawUrl && (rawUrl.startsWith("mysql://") || rawUrl.startsWith("mysql2://"))) {
    try {
      const url = new URL(rawUrl);
      return {
        host:     url.hostname,
        port:     Number(url.port) || 3306,
        user:     decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
      };
    } catch (e) {
      throw new Error(`[backup] Cannot parse DATABASE_URL: ${e}`);
    }
  }

  throw new Error(
    "[backup] No DB configuration found. Set DB_HOST+DB_USER+DB_NAME or DATABASE_URL."
  );
}

function listFiles() {
  ensureDir();
  return readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("backup_") && f.endsWith(".sql.gz"))
    .map(f => {
      const stat = statSync(join(BACKUP_DIR, f));
      return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function cleanOld() {
  listFiles()
    .slice(MAX_BACKUPS)
    .forEach(f => { try { unlinkSync(join(BACKUP_DIR, f.filename)); } catch {} });
}

// ── Strategy 1: mysqldump binary ──────────────────────────────────────────────

function backupViaBinary(cfg: ReturnType<typeof dbCfg>, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dump = spawn("mysqldump", [
      `-h${cfg.host}`,
      `-P${cfg.port}`,
      `-u${cfg.user}`,
      `-p${cfg.password}`,
      "--single-transaction",
      "--routines",
      "--triggers",
      cfg.database,
    ]);

    const gz  = createGzip();
    const out = createWriteStream(filepath);

    dump.stdout.pipe(gz).pipe(out);

    dump.stderr.on("data", (d: Buffer) => {
      const msg = d.toString();
      if (!msg.toLowerCase().includes("using a password")) {
        console.error("[backup:binary] stderr:", msg.trim());
      }
    });

    dump.on("error", (err) => reject(new Error(`mysqldump binary unavailable: ${err.message}`)));
    out.on("finish", resolve);
    out.on("error",  reject);
  });
}

// ── Strategy 2: pure Node.js via mysql2 ───────────────────────────────────────

function escapeValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof Date) {
    try {
      return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
    } catch {
      // MySQL zero-date (0000-00-00 00:00:00) → invalid JS Date
      return "NULL";
    }
  }
  if (Buffer.isBuffer(v)) return `0x${v.toString("hex")}`;
  // string — escape single quotes and backslashes
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}

async function backupViaNodeJs(cfg: ReturnType<typeof dbCfg>, filepath: string): Promise<void> {
  const conn = await mysql.createConnection({
    host:     cfg.host,
    port:     cfg.port,
    user:     cfg.user,
    password: cfg.password,
    database: cfg.database,
    multipleStatements: false,
  });

  try {
    const tmpSql = filepath.replace(".sql.gz", ".sql");

    // Header
    writeFileSync(tmpSql, [
      "-- Togolese Shop — Database backup",
      `-- Generated: ${new Date().toISOString()}`,
      `-- Database: ${cfg.database}`,
      "",
      "SET FOREIGN_KEY_CHECKS=0;",
      "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';",
      "SET NAMES utf8mb4;",
      "",
    ].join("\n"), "utf8");

    // Get table list
    const [tables] = await conn.query<mysql.RowDataPacket[]>("SHOW TABLES");
    const tableKey = `Tables_in_${cfg.database}`;

    for (const row of tables) {
      const tableName = row[tableKey] as string;

      // CREATE TABLE statement
      const [[createRow]] = await conn.query<mysql.RowDataPacket[]>(
        `SHOW CREATE TABLE \`${tableName}\``
      );
      const createSql = (createRow["Create Table"] as string)
        .replace(/AUTO_INCREMENT=\d+/g, ""); // strip AUTO_INCREMENT value

      appendFileSync(tmpSql, [
        `-- Table: \`${tableName}\``,
        `DROP TABLE IF EXISTS \`${tableName}\`;`,
        `${createSql};`,
        "",
      ].join("\n"), "utf8");

      // Rows — fetch in batches of 500
      const BATCH = 500;
      let offset  = 0;

      while (true) {
        const [rows] = await conn.query<mysql.RowDataPacket[]>(
          `SELECT * FROM \`${tableName}\` LIMIT ${BATCH} OFFSET ${offset}`
        );
        if ((rows as mysql.RowDataPacket[]).length === 0) break;

        const inserts = (rows as mysql.RowDataPacket[]).map(r => {
          const vals = Object.values(r).map(escapeValue).join(", ");
          return `INSERT INTO \`${tableName}\` VALUES (${vals});`;
        });
        appendFileSync(tmpSql, inserts.join("\n") + "\n", "utf8");
        offset += BATCH;
        if ((rows as mysql.RowDataPacket[]).length < BATCH) break;
      }

      appendFileSync(tmpSql, "\n", "utf8");
    }

    appendFileSync(tmpSql, "SET FOREIGN_KEY_CHECKS=1;\n", "utf8");

    // Gzip the .sql file
    await new Promise<void>((resolve, reject) => {
      const src = createReadStream(tmpSql);
      const gz  = createGzip();
      const out = createWriteStream(filepath);
      src.pipe(gz).pipe(out);
      out.on("finish", resolve);
      out.on("error",  reject);
    });

    // Remove temp .sql
    try { unlinkSync(tmpSql); } catch {}

  } finally {
    await conn.end().catch(() => {});
  }
}

// ── Main runBackup (tries binary first, falls back to Node.js) ────────────────

async function runBackup(): Promise<{ filename: string; filepath: string; size: number }> {
  ensureDir();
  const cfg      = dbCfg();
  const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup_${ts}.sql.gz`;
  const filepath = join(BACKUP_DIR, filename);

  // Try binary first
  try {
    await backupViaBinary(cfg, filepath);
    console.log("[backup] Used mysqldump binary.");
  } catch (binaryErr) {
    console.warn("[backup] mysqldump binary unavailable, falling back to Node.js driver:", (binaryErr as Error).message);
    // Clean incomplete file if it was created
    try { unlinkSync(filepath); } catch {}
    await backupViaNodeJs(cfg, filepath);
    console.log("[backup] Used Node.js fallback.");
  }

  const { size } = statSync(filepath);
  return { filename, filepath, size };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** POST /api/admin/backup — manual trigger, streams .sql.gz to browser */
router.post("/api/admin/backup", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  // Cooldown — prevent repeated heavy backups (DoS mitigation)
  if (lastManualBackup && Date.now() - lastManualBackup.getTime() < BACKUP_COOLDOWN_MS) {
    const wait = Math.ceil((BACKUP_COOLDOWN_MS - (Date.now() - lastManualBackup.getTime())) / 1000);
    return res.status(429).json({ error: `Attendez ${wait}s avant la prochaine sauvegarde.` });
  }

  try {
    lastManualBackup = new Date();
    const { filename, filepath } = await runBackup();
    cleanOld();

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/gzip");
    createReadStream(filepath).pipe(res);
  } catch (err) {
    console.error("[backup] manual backup failed:", err);
    res.status(500).json({ error: "Échec de la sauvegarde : " + (err as Error).message });
  }
});

/** GET /api/admin/backups — list available backup files */
router.get("/api/admin/backups", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  res.json({
    backups:       listFiles(),
    nextScheduled: "02:00 UTC",
    lastNightly:   lastNightlyRun ? lastNightlyRun.toISOString() : null,
  });
});

/** GET /api/admin/backups/:filename — download a specific backup */
router.get("/api/admin/backups/:filename", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const { filename } = req.params;

  // Path traversal guard — only allow valid backup filenames
  if (!/^backup_[\dT\-]+\.sql\.gz$/.test(filename)) {
    return res.status(400).json({ error: "Nom de fichier invalide." });
  }

  const filepath = join(BACKUP_DIR, filename);
  if (!existsSync(filepath)) {
    return res.status(404).json({ error: "Fichier introuvable." });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/gzip");
  createReadStream(filepath).pipe(res);
});

// ── Backup cooldown (prevent DoS via repeated heavy backups) ─────────────────

const BACKUP_COOLDOWN_MS  = 60 * 1000; // 60 seconds between manual backups
let   lastManualBackup: Date | null = null;

// ── Nightly scheduler ─────────────────────────────────────────────────────────

let lastNightlyRun: Date | null = null;

function startNightlyScheduler() {
  // Check every hour — run backup at 02:00 UTC if not yet done today
  setInterval(async () => {
    const now   = new Date();
    const hour  = now.getUTCHours();
    const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const alreadyRanToday =
      lastNightlyRun !== null &&
      lastNightlyRun.toISOString().slice(0, 10) === today;

    if (hour === 2 && !alreadyRanToday) {
      console.log("[backup] Starting nightly backup…");
      try {
        const { filename, size } = await runBackup();
        cleanOld();
        lastNightlyRun = new Date();
        console.log(`[backup] Nightly backup done: ${filename} (${Math.round(size / 1024)} KB)`);
      } catch (err) {
        console.error("[backup] Nightly backup failed:", err);
      }
    }
  }, 60 * 60 * 1000); // every hour
}

startNightlyScheduler();

export default router;
