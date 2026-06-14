/**
 * Plan-based limits + prices stored in DB — configurable from super-admin dashboard.
 * Limits: 0 = unlimited.
 * Prices: 0 = free (basic).
 */
import { db } from "./db";
import mysql from "mysql2/promise";

export interface PlanLimits {
  plan:               string;
  max_produits:       number;
  max_ventes_jour:    number;
  max_ventes_mois:    number;
  max_commandes_mois: number;
  max_entrepots:      number;
  max_users:          number;
}

export interface PlanFull {
  key:            string;
  prix_mensuel:   number | null;
  prix_annuel:    number | null;
  boutique_count: number;
  limits: {
    produits:  number | null;
    ventes:    number | null;
    commandes: number | null;
    admins:    number | null;
    entrepots: number | null;
  };
}

export interface SaasSettings {
  trial_days:      number;
  yearly_discount: number;
  whatsapp_number: string;
}

const DEFAULTS: Record<string, PlanLimits> = {
  basic:    { plan: "basic",    max_produits: 20, max_ventes_jour: 20, max_ventes_mois: 40, max_commandes_mois: 15, max_entrepots: 1, max_users: 1 },
  pro:      { plan: "pro",      max_produits: 0,  max_ventes_jour: 0,  max_ventes_mois: 0,  max_commandes_mois: 0,  max_entrepots: 0, max_users: 5 },
  business: { plan: "business", max_produits: 0,  max_ventes_jour: 0,  max_ventes_mois: 0,  max_commandes_mois: 0,  max_entrepots: 0, max_users: 0 },
};

const DEFAULT_PRICES: Record<string, { prix_mensuel: number; prix_annuel: number }> = {
  basic:    { prix_mensuel: 0,     prix_annuel: 0     },
  pro:      { prix_mensuel: 9900,  prix_annuel: 7920  },
  business: { prix_mensuel: 24900, prix_annuel: 19920 },
};

const DEFAULT_SETTINGS: SaasSettings = {
  trial_days:      14,
  yearly_discount: 20,
  whatsapp_number: "+228 90 527 912",
};

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const pool = db as mysql.Pool;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS plan_configs (
      plan               VARCHAR(20) NOT NULL PRIMARY KEY,
      max_produits       INT NOT NULL DEFAULT 20,
      max_ventes_jour    INT NOT NULL DEFAULT 20,
      max_ventes_mois    INT NOT NULL DEFAULT 40,
      max_commandes_mois INT NOT NULL DEFAULT 15,
      max_entrepots      INT NOT NULL DEFAULT 1,
      max_users          INT NOT NULL DEFAULT 1,
      updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  for (const [plan, d] of Object.entries(DEFAULTS)) {
    await pool.execute(
      `INSERT IGNORE INTO plan_configs
       (plan, max_produits, max_ventes_jour, max_ventes_mois, max_commandes_mois, max_entrepots, max_users)
       VALUES (?,?,?,?,?,?,?)`,
      [plan, d.max_produits, d.max_ventes_jour, d.max_ventes_mois, d.max_commandes_mois, d.max_entrepots, d.max_users]
    );
  }
  tableReady = true;
}

let priceColsReady = false;

async function ensurePriceCols() {
  if (priceColsReady) return;
  const pool = db as mysql.Pool;
  await pool.execute(`ALTER TABLE plan_configs ADD COLUMN prix_mensuel INT NOT NULL DEFAULT 0`).catch(() => {});
  await pool.execute(`ALTER TABLE plan_configs ADD COLUMN prix_annuel  INT NOT NULL DEFAULT 0`).catch(() => {});
  // Seed non-zero defaults only if columns are still 0 (first migration)
  await pool.execute(`UPDATE plan_configs SET prix_mensuel = 9900,  prix_annuel = 7920  WHERE plan = 'pro'      AND prix_mensuel = 0`).catch(() => {});
  await pool.execute(`UPDATE plan_configs SET prix_mensuel = 24900, prix_annuel = 19920 WHERE plan = 'business' AND prix_mensuel = 0`).catch(() => {});
  priceColsReady = true;
}

let settingsReady = false;

async function ensureSaasSettings() {
  if (settingsReady) return;
  const pool = db as mysql.Pool;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS saas_settings (
      \`key\`   VARCHAR(50) NOT NULL PRIMARY KEY,
      \`value\` TEXT        NOT NULL
    )
  `);
  await pool.execute(`
    INSERT IGNORE INTO saas_settings (\`key\`, \`value\`) VALUES
      ('trial_days',      '14'),
      ('yearly_discount', '20'),
      ('whatsapp_number', '+228 90 527 912')
  `);
  settingsReady = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns plan limits. Falls back to hardcoded defaults if DB unavailable. */
export async function getPlanLimits(plan: string): Promise<PlanLimits> {
  try {
    await ensureTable();
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT * FROM plan_configs WHERE plan = ?", [plan]
    );
    if (rows[0]) return rows[0] as PlanLimits;
  } catch { /* fall through */ }
  return DEFAULTS[plan] ?? DEFAULTS.basic;
}

/** Returns all plan limits (for super-admin display). */
export async function getAllPlanLimits(): Promise<PlanLimits[]> {
  try {
    await ensureTable();
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT * FROM plan_configs ORDER BY FIELD(plan,'basic','pro','business')"
    );
    return rows as PlanLimits[];
  } catch {
    return Object.values(DEFAULTS);
  }
}

/** Updates a plan's limits only (legacy endpoint). */
export async function updatePlanLimits(
  plan: string,
  limits: Partial<Omit<PlanLimits, "plan">>
): Promise<void> {
  await ensureTable();
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(limits)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(Number(v)); }
  }
  if (!sets.length) return;
  vals.push(plan);
  await (db as mysql.Pool).execute(`UPDATE plan_configs SET ${sets.join(", ")} WHERE plan = ?`, vals);
}

/** Returns the monthly price for a plan (from DB, fallback to hardcoded). */
export async function getPlanPrice(plan: string): Promise<number> {
  try {
    await ensureTable();
    await ensurePriceCols();
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT prix_mensuel FROM plan_configs WHERE plan = ?", [plan]
    );
    if (rows[0]) return Number(rows[0].prix_mensuel);
  } catch { /* fall through */ }
  return DEFAULT_PRICES[plan]?.prix_mensuel ?? 0;
}

/** Returns all plans with prices + limits + boutique_count. */
export async function getPlansWithPrices(): Promise<PlanFull[]> {
  await ensureTable();
  await ensurePriceCols();
  const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(`
    SELECT pc.*,
      (SELECT COUNT(*) FROM shops s WHERE s.plan = pc.plan) AS boutique_count
    FROM plan_configs pc
    ORDER BY FIELD(pc.plan, 'basic', 'pro', 'business')
  `);
  return rows.map(r => ({
    key:            r.plan as string,
    prix_mensuel:   r.plan === "basic" ? null : (Number(r.prix_mensuel) || null),
    prix_annuel:    r.plan === "basic" ? null : (Number(r.prix_annuel)  || null),
    boutique_count: Number(r.boutique_count),
    limits: {
      produits:  r.max_produits        === 0 ? null : Number(r.max_produits),
      ventes:    r.max_ventes_mois     === 0 ? null : Number(r.max_ventes_mois),
      commandes: r.max_commandes_mois  === 0 ? null : Number(r.max_commandes_mois),
      admins:    r.max_users           === 0 ? null : Number(r.max_users),
      entrepots: r.max_entrepots       === 0 ? null : Number(r.max_entrepots),
    },
  }));
}

/** Updates a plan's limits + prices in one shot. */
export async function updatePlanFull(plan: string, data: {
  prix_mensuel:       number;
  prix_annuel:        number;
  max_produits:       number;
  max_ventes_mois:    number;
  max_commandes_mois: number;
  max_users:          number;
  max_entrepots:      number;
}): Promise<void> {
  await ensureTable();
  await ensurePriceCols();
  await (db as mysql.Pool).execute(`
    UPDATE plan_configs SET
      prix_mensuel       = ?,
      prix_annuel        = ?,
      max_produits       = ?,
      max_ventes_mois    = ?,
      max_commandes_mois = ?,
      max_users          = ?,
      max_entrepots      = ?
    WHERE plan = ?
  `, [
    data.prix_mensuel, data.prix_annuel,
    data.max_produits, data.max_ventes_mois, data.max_commandes_mois,
    data.max_users, data.max_entrepots,
    plan,
  ]);
}

/** Returns global SaaS settings. */
export async function getSaasSettings(): Promise<SaasSettings> {
  try {
    await ensureSaasSettings();
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT `key`, `value` FROM saas_settings"
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      trial_days:      Number(map.trial_days      ?? DEFAULT_SETTINGS.trial_days),
      yearly_discount: Number(map.yearly_discount ?? DEFAULT_SETTINGS.yearly_discount),
      whatsapp_number: map.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Updates global SaaS settings. */
export async function updateSaasSettings(settings: Partial<SaasSettings>): Promise<void> {
  await ensureSaasSettings();
  const pool = db as mysql.Pool;
  const entries: Array<[string, string]> = [];
  if (settings.trial_days      !== undefined) entries.push(["trial_days",      String(settings.trial_days)]);
  if (settings.yearly_discount !== undefined) entries.push(["yearly_discount", String(settings.yearly_discount)]);
  if (settings.whatsapp_number !== undefined) entries.push(["whatsapp_number", settings.whatsapp_number]);
  for (const [key, value] of entries) {
    await pool.execute(
      "INSERT INTO saas_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = ?",
      [key, value, value]
    );
  }
}
