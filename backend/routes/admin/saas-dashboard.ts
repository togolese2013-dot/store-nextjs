import express from "express";
import { getSession } from "../../lib/auth";
import { listShopsWithStats, updateShop } from "@/lib/shops";
import { planLimitLabel } from "../../lib/plan-limits";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

function requireSuperAdmin(session: Awaited<ReturnType<typeof getSession>>, res: express.Response): boolean {
  if (!session) { res.status(401).json({ error: "Non autorisé." }); return false; }
  if (session.role !== "super_admin") { res.status(403).json({ error: "Réservé au super-admin." }); return false; }
  return true;
}

// ── GET /api/admin/saas/shops — list all shops with stats ──────────────────
router.get("/api/admin/saas/shops", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  try {
    const shops = await listShopsWithStats();
    // Enrich with plan limit label
    const data = shops.map(s => ({
      ...s,
      plan_limit: planLimitLabel(s.plan),
    }));
    res.json({ shops: data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── PATCH /api/admin/saas/shops/:id — update plan / actif ─────────────────
router.patch("/api/admin/saas/shops/:id", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  // Protect shop #1 (legacy) from suspension
  if (id === 1 && req.body.actif === false) {
    return res.status(400).json({ error: "La boutique par défaut ne peut pas être suspendue." });
  }
  try {
    const { plan, actif, nom, email } = req.body as Record<string, string | boolean>;
    const update: Parameters<typeof updateShop>[1] = {};
    if (nom   !== undefined) update.nom   = String(nom);
    if (email !== undefined) update.email = String(email);
    if (plan  !== undefined && ["free","basic","pro"].includes(String(plan))) {
      update.plan = plan as "free" | "basic" | "pro";
    }
    if (actif !== undefined) update.actif = Boolean(actif);
    await updateShop(id, update);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/saas/stats — global SaaS metrics ──────────────────────
router.get("/api/admin/saas/stats", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  try {
    const [rows] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM shops)                                   AS total_shops,
        (SELECT COUNT(*) FROM shops WHERE actif = 1)                  AS active_shops,
        (SELECT COUNT(*) FROM shops WHERE plan = 'free')              AS plan_free,
        (SELECT COUNT(*) FROM shops WHERE plan = 'basic')             AS plan_basic,
        (SELECT COUNT(*) FROM shops WHERE plan = 'pro')               AS plan_pro,
        (SELECT COUNT(*) FROM produits)                               AS total_products,
        (SELECT COUNT(*) FROM admin_users WHERE role != 'super_admin') AS total_admins
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
