import express from "express";
import { getSession } from "./lib/auth";
import { db as pool } from "@/lib/db";
import mysql from "mysql2/promise";
import https from "https";
import http from "http";

const router = express.Router();

// ─── Table + colonnes ─────────────────────────────────────────────────────────

async function ensurePageViewsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS page_views (
      id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      page        VARCHAR(500)  NOT NULL,
      referrer    VARCHAR(500)  NULL,
      device      ENUM('mobile','tablet','desktop') NOT NULL DEFAULT 'desktop',
      session_id  VARCHAR(64)   NOT NULL,
      visitor_id  VARCHAR(64)   NULL,
      pays        VARCHAR(100)  NULL,
      ville       VARCHAR(100)  NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_page       (page(100)),
      INDEX idx_session    (session_id),
      INDEX idx_visitor    (visitor_id),
      INDEX idx_pays       (pays)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Add columns for existing installs
  const cols = [
    `ALTER TABLE page_views ADD COLUMN visitor_id VARCHAR(64) NULL`,
    `ALTER TABLE page_views ADD COLUMN pays       VARCHAR(100) NULL`,
    `ALTER TABLE page_views ADD COLUMN ville      VARCHAR(100) NULL`,
    `ALTER TABLE page_views ADD INDEX idx_visitor (visitor_id)`,
    `ALTER TABLE page_views ADD INDEX idx_pays    (pays)`,
  ];
  for (const sql of cols) {
    try { await pool.execute(sql); } catch { /* already exists */ }
  }
}
ensurePageViewsTable().catch(console.error);

// Purge rows older than 90 days — runs once at startup
async function purgeOldPageViews() {
  await pool.execute(
    `DELETE FROM page_views WHERE created_at < NOW() - INTERVAL 90 DAY`
  );
}
purgeOldPageViews().catch(() => {});

// ─── IP → Géolocalisation (cache 24h) ─────────────────────────────────────────

const ipCache = new Map<string, { pays: string; ville: string; ts: number }>();
const IP_CACHE_TTL = 24 * 60 * 60 * 1000;

function geoFromIp(ip: string): Promise<{ pays: string; ville: string }> {
  return new Promise(resolve => {
    const cached = ipCache.get(ip);
    if (cached && Date.now() - cached.ts < IP_CACHE_TTL) {
      return resolve({ pays: cached.pays, ville: cached.ville });
    }

    // Skip private/loopback IPs
    if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return resolve({ pays: "Local", ville: "" });
    }

    const url = `http://ip-api.com/json/${ip}?fields=status,country,city&lang=fr`;
    http.get(url, res => {
      let raw = "";
      res.on("data", d => { raw += d; });
      res.on("end", () => {
        try {
          const j = JSON.parse(raw);
          const result = j.status === "success"
            ? { pays: j.country ?? "Inconnu", ville: j.city ?? "" }
            : { pays: "Inconnu", ville: "" };
          ipCache.set(ip, { ...result, ts: Date.now() });
          resolve(result);
        } catch {
          resolve({ pays: "Inconnu", ville: "" });
        }
      });
    }).on("error", () => resolve({ pays: "Inconnu", ville: "" }));
  });
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = String(forwarded).split(",");
    return ips[0].trim();
  }
  return req.socket?.remoteAddress ?? "";
}

// ─── POST /api/analytics/hit ──────────────────────────────────────────────────

router.post("/api/analytics/hit", async (req, res) => {
  try {
    const { page, referrer, device, session_id, visitor_id } = req.body as {
      page?: string; referrer?: string; device?: string;
      session_id?: string; visitor_id?: string;
    };

    if (!page || !session_id) return res.status(400).json({ ok: false });

    const safeDevice    = ["mobile", "tablet", "desktop"].includes(device ?? "") ? device : "desktop";
    const safePage      = String(page).slice(0, 500);
    const safeReferrer  = referrer ? String(referrer).slice(0, 500) : null;
    const safeSessionId = String(session_id).slice(0, 64);
    const safeVisitorId = visitor_id ? String(visitor_id).slice(0, 64) : null;

    const ip = getClientIp(req);

    // Insert immediately — don't wait for geo
    await pool.execute(
      `INSERT INTO page_views (page, referrer, device, session_id, visitor_id) VALUES (?, ?, ?, ?, ?)`,
      [safePage, safeReferrer, safeDevice, safeSessionId, safeVisitorId]
    );

    res.json({ ok: true });

    // Geo lookup async after response
    const [insertResult] = await pool.execute<mysql.ResultSetHeader>(
      `SELECT LAST_INSERT_ID() AS id`
    );
    const insertId = (insertResult as mysql.RowDataPacket[])[0]?.id;

    if (insertId && ip) {
      geoFromIp(ip).then(({ pays, ville }) => {
        pool.execute(
          `UPDATE page_views SET pays = ?, ville = ? WHERE id = ?`,
          [pays, ville || null, insertId]
        ).catch(() => {});
      });
    }
  } catch (err) {
    console.error("[analytics/hit]", err);
    res.status(500).json({ ok: false });
  }
});

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────

const JOURS = ["", "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

router.get("/api/admin/analytics", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  try {
    // ── KPI ──────────────────────────────────────────────────────────────────
    const [[kpi]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(DISTINCT CASE WHEN DATE(created_at) = CURDATE()
              THEN session_id END)                                      AS sessions_today,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 7 DAY
              THEN session_id END)                                      AS sessions_7j,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 30 DAY
              THEN session_id END)                                      AS sessions_30j,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END)          AS vues_today,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1 END)  AS vues_7j,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN 1 END) AS vues_30j,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 5 MINUTE
              THEN session_id END)                                      AS actifs_maintenant
      FROM page_views
    `);

    // ── Courbe 30j ────────────────────────────────────────────────────────────
    const [evolution] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        DATE(created_at)            AS date,
        COUNT(*)                    AS vues,
        COUNT(DISTINCT session_id)  AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // ── Top 10 pages ──────────────────────────────────────────────────────────
    const [topPages] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        page,
        COUNT(*)                   AS vues,
        COUNT(DISTINCT session_id) AS sessions_uniques
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY page
      ORDER BY vues DESC
      LIMIT 10
    `);

    // ── Sources de trafic ─────────────────────────────────────────────────────
    const [sources] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        CASE
          WHEN referrer IS NULL OR referrer = ''   THEN 'Direct'
          WHEN referrer LIKE '%google%'            THEN 'Google'
          WHEN referrer LIKE '%facebook%'
            OR referrer LIKE '%fb.com%'            THEN 'Facebook'
          WHEN referrer LIKE '%instagram%'         THEN 'Instagram'
          WHEN referrer LIKE '%tiktok%'            THEN 'TikTok'
          WHEN referrer LIKE '%whatsapp%'          THEN 'WhatsApp'
          ELSE 'Autre'
        END                         AS source,
        COUNT(*)                    AS vues,
        COUNT(DISTINCT session_id)  AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY source
      ORDER BY vues DESC
    `);

    // ── Appareils ─────────────────────────────────────────────────────────────
    const [devices] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        device,
        COUNT(*)                   AS vues,
        COUNT(DISTINCT session_id) AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY device
      ORDER BY vues DESC
    `);

    // ── Live feed ─────────────────────────────────────────────────────────────
    const [recent] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT page, referrer, device, pays, ville, created_at
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // ── Heures de pointe (30j) ────────────────────────────────────────────────
    const [heuresRaw] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT HOUR(created_at) AS heure, COUNT(*) AS vues
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY HOUR(created_at)
      ORDER BY heure
    `);
    // Fill all 24 hours (missing hours = 0)
    const heuresMap: Record<number, number> = {};
    (heuresRaw as mysql.RowDataPacket[]).forEach(r => { heuresMap[Number(r.heure)] = Number(r.vues); });
    const heures = Array.from({ length: 24 }, (_, h) => ({
      heure: `${String(h).padStart(2, "0")}h`,
      vues:  heuresMap[h] ?? 0,
    }));

    // ── Jours de semaine (30j) ────────────────────────────────────────────────
    const [joursRaw] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT DAYOFWEEK(created_at) AS dow, COUNT(*) AS vues
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DAYOFWEEK(created_at)
      ORDER BY dow
    `);
    // DAYOFWEEK: 1=Sun…7=Sat → reorder Mon→Sun for display
    const joursMap: Record<number, number> = {};
    (joursRaw as mysql.RowDataPacket[]).forEach(r => { joursMap[Number(r.dow)] = Number(r.vues); });
    const joursOrdre = [2, 3, 4, 5, 6, 7, 1]; // Lun→Dim
    const jours = joursOrdre.map(dow => ({
      jour: JOURS[dow],
      vues: joursMap[dow] ?? 0,
    }));

    // ── Nouveau vs Récurrent (30j) ────────────────────────────────────────────
    const [[nvRaw]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        SUM(CASE WHEN first_seen >= CURDATE() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS nouveaux,
        SUM(CASE WHEN first_seen < CURDATE()  - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS recurrents
      FROM (
        SELECT visitor_id, MIN(created_at) AS first_seen
        FROM page_views
        WHERE visitor_id IS NOT NULL
          AND visitor_id IN (
            SELECT DISTINCT visitor_id FROM page_views
            WHERE created_at >= NOW() - INTERVAL 30 DAY AND visitor_id IS NOT NULL
          )
        GROUP BY visitor_id
      ) t
    `);

    // ── Top pays (30j) ────────────────────────────────────────────────────────
    const [topPays] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        COALESCE(pays, 'Inconnu') AS pays,
        COUNT(*)                  AS vues,
        COUNT(DISTINCT session_id) AS sessions
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY pays
      ORDER BY vues DESC
      LIMIT 10
    `);

    res.json({
      kpi: {
        sessions_today:    Number(kpi.sessions_today    ?? 0),
        sessions_7j:       Number(kpi.sessions_7j       ?? 0),
        sessions_30j:      Number(kpi.sessions_30j      ?? 0),
        vues_today:        Number(kpi.vues_today        ?? 0),
        vues_7j:           Number(kpi.vues_7j           ?? 0),
        vues_30j:          Number(kpi.vues_30j          ?? 0),
        actifs_maintenant: Number(kpi.actifs_maintenant ?? 0),
      },
      evolution: (evolution as mysql.RowDataPacket[]).map(r => ({
        date:     String(r.date).slice(0, 10),
        vues:     Number(r.vues),
        sessions: Number(r.sessions),
      })),
      topPages: (topPages as mysql.RowDataPacket[]).map(r => ({
        page:             String(r.page),
        vues:             Number(r.vues),
        sessions_uniques: Number(r.sessions_uniques),
      })),
      sources: (sources as mysql.RowDataPacket[]).map(r => ({
        source:   String(r.source),
        vues:     Number(r.vues),
        sessions: Number(r.sessions),
      })),
      devices: (devices as mysql.RowDataPacket[]).map(r => ({
        device:   String(r.device),
        vues:     Number(r.vues),
        sessions: Number(r.sessions),
      })),
      recent: (recent as mysql.RowDataPacket[]).map(r => ({
        page:       String(r.page),
        referrer:   r.referrer  ? String(r.referrer)  : null,
        device:     String(r.device),
        pays:       r.pays      ? String(r.pays)      : null,
        ville:      r.ville     ? String(r.ville)     : null,
        created_at: String(r.created_at),
      })),
      heures,
      jours,
      visiteurs: {
        nouveaux:   Number(nvRaw?.nouveaux   ?? 0),
        recurrents: Number(nvRaw?.recurrents ?? 0),
      },
      topPays: (topPays as mysql.RowDataPacket[]).map(r => ({
        pays:     String(r.pays),
        vues:     Number(r.vues),
        sessions: Number(r.sessions),
      })),
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
