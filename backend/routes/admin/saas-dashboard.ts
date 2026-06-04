import express from "express";
import { getSession } from "../../lib/auth";
import { listShopsWithStats, updateShop, activateShopSubscription } from "@/lib/shops";
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
    if (plan  !== undefined && ["basic","pro","business"].includes(String(plan))) {
      update.plan = plan as "basic" | "pro" | "business";
    }
    if (actif !== undefined) {
      update.actif = Boolean(actif);
      update.subscription_status = Boolean(actif) ? 'active' : 'suspended';
    }
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
        (SELECT COUNT(*) FROM shops WHERE plan = 'basic')             AS plan_basic,
        (SELECT COUNT(*) FROM shops WHERE plan = 'pro')               AS plan_pro,
        (SELECT COUNT(*) FROM shops WHERE plan = 'business')          AS plan_business,
        (SELECT COUNT(*) FROM produits)                               AS total_products,
        (SELECT COUNT(*) FROM admin_users WHERE role != 'super_admin') AS total_admins
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/saas/payments — paiements en attente de validation ────────
router.get("/api/admin/saas/payments", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  try {
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(`
      SELECT sp.*, s.nom AS shop_nom, s.slug AS shop_slug, s.email AS shop_email
      FROM shop_payments sp
      JOIN shops s ON s.id = sp.shop_id
      WHERE sp.status = 'pending'
      ORDER BY sp.created_at DESC
    `);
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── PATCH /api/admin/saas/payments/:id/approve — valider manuellement ────────
router.patch("/api/admin/saas/payments/:id/approve", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  try {
    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT * FROM shop_payments WHERE id = ? LIMIT 1", [id]
    );
    const payment = rows[0];
    if (!payment) return res.status(404).json({ error: "Paiement introuvable." });
    if (payment.status === "paid") return res.status(400).json({ error: "Déjà validé." });

    await activateShopSubscription(payment.shop_id, payment.plan, payment.duration_months);
    await (db as mysql.Pool).execute(
      "UPDATE shop_payments SET status = 'paid', paid_at = NOW() WHERE id = ?", [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── PATCH /api/admin/saas/payments/:id/reject — rejeter un paiement ──────────
router.patch("/api/admin/saas/payments/:id/reject", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  const id = Number(req.params.id);
  try {
    await (db as mysql.Pool).execute(
      "UPDATE shop_payments SET status = 'failed' WHERE id = ? AND status = 'pending'", [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/saas/shops — créer/inviter une boutique ──────────────────
router.post("/api/admin/saas/shops", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  const { nom, email, plan = "basic", pays } = req.body as Record<string, string>;
  if (!nom || !email) return res.status(400).json({ error: "nom et email requis." });
  const slug = nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const [result] = await (db as mysql.Pool).execute<mysql.OkPacket>(
      `INSERT INTO shops (nom, slug, email, plan, actif, subscription_status, pays)
       VALUES (?, ?, ?, ?, 1, 'trial', ?)`,
      [nom, slug, email, plan, pays ?? null]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── DELETE /api/admin/saas/shops/:id — supprimer une boutique ────────────────
router.delete("/api/admin/saas/shops/:id", async (req, res) => {
  const session = await getSession(req);
  if (!requireSuperAdmin(session, res)) return;
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID invalide." });
  if (id === 1) return res.status(400).json({ error: "La boutique par défaut ne peut pas être supprimée." });
  try {
    await (db as mysql.Pool).execute("DELETE FROM shop_payments WHERE shop_id = ?", [id]);
    await (db as mysql.Pool).execute("DELETE FROM shops WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
