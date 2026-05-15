import express from "express";
import { getSession } from "../../lib/auth";
import { listCoupons, upsertCoupon, deleteCoupon } from "@/lib/admin-db";
import { db } from "@/lib/db";

const router = express.Router();

async function ensureCouponsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code       VARCHAR(50)   NOT NULL UNIQUE,
      type       ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
      valeur     DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order  DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_uses   INT UNSIGNED  NOT NULL DEFAULT 0,
      uses_count INT UNSIGNED  NOT NULL DEFAULT 0,
      expires_at DATETIME      NULL,
      actif      TINYINT(1)    NOT NULL DEFAULT 1,
      created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // Migrate existing table — add missing columns
  for (const ddl of [
    "ALTER TABLE coupons ADD COLUMN max_uses   INT UNSIGNED  NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN uses_count INT UNSIGNED  NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN min_order  DECIMAL(10,2) NOT NULL DEFAULT 0",
    "ALTER TABLE coupons ADD COLUMN expires_at DATETIME      NULL",
    "ALTER TABLE coupons ADD COLUMN actif      TINYINT(1)    NOT NULL DEFAULT 1",
  ]) {
    try { await db.execute(ddl); } catch (e: any) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }
}
ensureCouponsTable().catch(console.error);

// GET /api/admin/coupons
router.get("/api/admin/coupons", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    const coupons = await listCoupons();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// POST /api/admin/coupons — upsert or delete
router.post("/api/admin/coupons", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    await ensureCouponsTable();

    const body = req.body;

    if (body._delete && body.id) {
      await deleteCoupon(Number(body.id));
      return res.json({ ok: true, deleted: true });
    }

    if (!body.code?.trim()) {
      return res.status(400).json({ error: "Code coupon requis." });
    }

    await upsertCoupon({
      id:         body.id ? Number(body.id) : undefined,
      code:       String(body.code).trim().toUpperCase(),
      type:       body.type === "fixed" ? "fixed" : "percent",
      valeur:     Number(body.valeur ?? 0),
      min_order:  Number(body.min_order ?? 0),
      max_uses:   Number(body.max_uses ?? 0),
      expires_at: body.expires_at || null,
      actif:      body.actif !== false && body.actif !== 0,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
