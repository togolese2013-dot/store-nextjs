/**
 * Plan-based limits stored in DB — configurable from super-admin dashboard.
 * 0 = unlimited.
 */
import { db } from "./db";
import mysql from "mysql2/promise";

export interface PlanLimits {
  plan:               string;
  max_produits:       number; // 0 = unlimited
  max_ventes_jour:    number;
  max_ventes_mois:    number;
  max_commandes_mois: number;
  max_entrepots:      number;
  max_users:          number;
}

const DEFAULTS: Record<string, PlanLimits> = {
  basic:    { plan: "basic",    max_produits: 20, max_ventes_jour: 20, max_ventes_mois: 40, max_commandes_mois: 15, max_entrepots: 1, max_users: 1 },
  pro:      { plan: "pro",      max_produits: 0,  max_ventes_jour: 0,  max_ventes_mois: 0,  max_commandes_mois: 0,  max_entrepots: 0, max_users: 5 },
  business: { plan: "business", max_produits: 0,  max_ventes_jour: 0,  max_ventes_mois: 0,  max_commandes_mois: 0,  max_entrepots: 0, max_users: 0 },
};

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await db.execute(`
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
    await db.execute(
      `INSERT IGNORE INTO plan_configs
       (plan, max_produits, max_ventes_jour, max_ventes_mois, max_commandes_mois, max_entrepots, max_users)
       VALUES (?,?,?,?,?,?,?)`,
      [plan, d.max_produits, d.max_ventes_jour, d.max_ventes_mois, d.max_commandes_mois, d.max_entrepots, d.max_users]
    );
  }
  tableReady = true;
}

/** Returns plan limits. Falls back to hardcoded defaults if DB unavailable. */
export async function getPlanLimits(plan: string): Promise<PlanLimits> {
  try {
    await ensureTable();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM plan_configs WHERE plan = ?", [plan]
    );
    if (rows[0]) return rows[0] as PlanLimits;
  } catch { /* fall through to defaults */ }
  return DEFAULTS[plan] ?? DEFAULTS.basic;
}

/** Returns all plan limits (for super-admin display). */
export async function getAllPlanLimits(): Promise<PlanLimits[]> {
  try {
    await ensureTable();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM plan_configs ORDER BY FIELD(plan,'basic','pro','business')"
    );
    return rows as PlanLimits[];
  } catch {
    return Object.values(DEFAULTS);
  }
}

/** Updates a plan's limits (super-admin only). */
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
  await db.execute(`UPDATE plan_configs SET ${sets.join(", ")} WHERE plan = ?`, vals);
}
