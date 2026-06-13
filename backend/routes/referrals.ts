import express from "express";
import { db as pool } from "@/lib/db";
import { getSession } from "../lib/auth";
import { getSetting, setSetting } from "@/lib/admin-db";
import mysql from "mysql2/promise";

const router = express.Router();

// ─── Auto-create table ────────────────────────────────────────────────────────

async function ensureReferralsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS referrals (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom         VARCHAR(100) NOT NULL,
      telephone   VARCHAR(30)  NOT NULL,
      code        VARCHAR(20)  NOT NULL UNIQUE,
      uses_count  INT UNSIGNED NOT NULL DEFAULT 0,
      gains_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code      (code),
      INDEX idx_telephone (telephone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // Add gains_total if table already existed without it
  try {
    await pool.execute(`ALTER TABLE referrals ADD COLUMN gains_total DECIMAL(12,2) NOT NULL DEFAULT 0`);
  } catch (e: any) {
    if (e?.code !== "ER_DUP_FIELDNAME") throw e;
  }
}
ensureReferralsTable().catch(console.error);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(nom: string): string {
  const base   = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

async function uniqueCode(nom: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode(nom);
    const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM referrals WHERE code = ? LIMIT 1`, [code]
    );
    if (!row) return code;
  }
  return generateCode(nom) + Date.now().toString(36).slice(-3).toUpperCase();
}

// ─── POST /api/referrals ──────────────────────────────────────────────────────
// Public — create or retrieve a referral code by phone number.

router.post("/api/referrals", async (req, res) => {
  try {
    const { nom, telephone } = req.body as { nom?: string; telephone?: string };

    if (!nom?.trim() || !telephone?.trim()) {
      return res.status(400).json({ error: "Nom et téléphone obligatoires." });
    }

    const safeName  = String(nom).trim().slice(0, 100);
    const safePhone = String(telephone).trim().replace(/\s+/g, "").slice(0, 30);

    // Return existing code if phone already registered
    const [[existing]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT code, nom, uses_count FROM referrals WHERE telephone = ? LIMIT 1`,
      [safePhone]
    );

    if (existing) {
      return res.json({
        code:       existing.code,
        nom:        existing.nom,
        uses_count: existing.uses_count,
        already:    true,
      });
    }

    const code = await uniqueCode(safeName);
    await pool.execute(
      `INSERT INTO referrals (nom, telephone, code) VALUES (?, ?, ?)`,
      [safeName, safePhone, code]
    );

    res.json({ code, nom: safeName, uses_count: 0, already: false });
  } catch (err) {
    console.error("[referrals/post]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── GET /api/referrals?code=XXX ─────────────────────────────────────────────
// Public — used by ReferralBanner to show referrer name.

router.get("/api/referrals", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Code manquant." });

    const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT nom, uses_count FROM referrals WHERE code = ? LIMIT 1`, [code]
    );
    if (!row) return res.status(404).json({ error: "Code introuvable." });

    res.json({ nom: String(row.nom), uses_count: Number(row.uses_count) });
  } catch (err) {
    console.error("[referrals/get]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── GET /api/referrals/validate?code=XXX ────────────────────────────────────
// Public — validate a referral code before applying discount.

router.get("/api/referrals/validate", async (req, res) => {
  try {
    const code = String(req.query.code ?? "").trim().toUpperCase();
    if (!code) return res.status(400).json({ valid: false });

    const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT nom, uses_count FROM referrals WHERE code = ? LIMIT 1`,
      [code]
    );

    if (!row) return res.json({ valid: false });

    res.json({ valid: true, nom: String(row.nom), uses_count: Number(row.uses_count) });
  } catch (err) {
    console.error("[referrals/validate]", err);
    res.status(500).json({ valid: false });
  }
});

// ─── GET /api/admin/referrals/settings ───────────────────────────────────────

router.get("/api/admin/referrals/settings", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non authentifié." });

    const [filleulPct, parrainPct] = await Promise.all([
      getSetting("referral_filleul_pct").catch(() => "10"),
      getSetting("referral_parrain_pct").catch(() => "5"),
    ]);

    res.json({
      filleul_pct: Number(filleulPct || "10"),
      parrain_pct: Number(parrainPct || "5"),
    });
  } catch (err) {
    console.error("[referrals/settings/get]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── POST /api/admin/referrals/settings ──────────────────────────────────────

router.post("/api/admin/referrals/settings", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non authentifié." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const filleulPct = Math.max(0, Math.min(100, Number(req.body.filleul_pct ?? 10)));
    const parrainPct = Math.max(0, Math.min(100, Number(req.body.parrain_pct ?? 5)));

    await Promise.all([
      setSetting("referral_filleul_pct", String(filleulPct)),
      setSetting("referral_parrain_pct", String(parrainPct)),
    ]);

    res.json({ ok: true, filleul_pct: filleulPct, parrain_pct: parrainPct });
  } catch (err) {
    console.error("[referrals/settings/post]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── DELETE /api/admin/referrals/:id ─────────────────────────────────────────
// Admin only — delete a referral code.

router.delete("/api/admin/referrals/:id", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non authentifié." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID invalide." });

    await pool.execute(`DELETE FROM referrals WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[referrals/delete]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── POST /api/admin/referrals ────────────────────────────────────────────────
// Admin only — create a referral code manually.

router.post("/api/admin/referrals", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non authentifié." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const { nom, telephone } = req.body as { nom?: string; telephone?: string };
    if (!nom?.trim() || !telephone?.trim()) {
      return res.status(400).json({ error: "Nom et téléphone obligatoires." });
    }

    const safeName  = String(nom).trim().slice(0, 100);
    const safePhone = String(telephone).trim().replace(/\s+/g, "").slice(0, 30);

    const [[existing]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT code, nom, uses_count FROM referrals WHERE telephone = ? LIMIT 1`,
      [safePhone]
    );
    if (existing) {
      return res.status(409).json({ error: "Un code existe déjà pour ce numéro.", code: existing.code });
    }

    const code = await uniqueCode(safeName);
    await pool.execute(
      `INSERT INTO referrals (nom, telephone, code) VALUES (?, ?, ?)`,
      [safeName, safePhone, code]
    );

    res.json({ code, nom: safeName, uses_count: 0 });
  } catch (err) {
    console.error("[referrals/admin-post]", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
