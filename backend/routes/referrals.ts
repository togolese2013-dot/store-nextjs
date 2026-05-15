import express from "express";
import { db as pool } from "@/lib/db";
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
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code      (code),
      INDEX idx_telephone (telephone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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

export default router;
