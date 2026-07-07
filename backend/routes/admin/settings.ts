import express from "express";
import { getSession } from "../../lib/auth";
import { getSettings, setSettings, listAdminUsers, createAdminUser, getAdminById } from "@/lib/admin-db";
import { getShopById, setShopDomain, updateShop } from "@/lib/shops";
import { getPlanLimits, getPlanPrice } from "@/lib/plan-configs";
import bcrypt from "bcryptjs";
import { addVercelDomain, removeVercelDomain, checkVercelDomain } from "../../lib/vercel-domains";
import { getSessionsForUser, revokeSessionById, revokeOtherSessions, touchSession } from "../../lib/sessions";

const router = express.Router();

router.get("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const settings = await getSettings(session.shop_id ?? 1);
  res.json(settings);
});

router.post("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  await setSettings(req.body, session.shop_id ?? 1);
  res.json({ ok: true });
});

// ── GET /api/admin/settings/domain — current domain info ─────────────────
router.get("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const shop   = await getShopById(shopId);
    if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

    let vercel: { configured: boolean; verification?: { type: string; domain: string; value: string }[] } = { configured: false };
    if (shop.custom_domain) {
      vercel = await checkVercelDomain(shop.custom_domain);
    }

    res.json({
      custom_domain: shop.custom_domain ?? null,
      slug:          shop.slug,
      vercel,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/settings/domain — set or update custom domain ─────────
router.post("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const raw    = String(req.body.domain ?? "").trim().toLowerCase().replace(/^www\./, "").replace(/^https?:\/\//, "");
    const domain = raw.split("/")[0]; // strip any path

    if (!domain) return res.status(400).json({ error: "Domaine requis." });

    // Basic domain format validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
      return res.status(400).json({ error: "Format de domaine invalide." });
    }

    // Remove old Vercel domain if changing
    const shop = await getShopById(shopId);
    if (shop?.custom_domain && shop.custom_domain !== domain) {
      await removeVercelDomain(shop.custom_domain);
    }

    // Register on Vercel
    const vercelResult = await addVercelDomain(domain);
    if (!vercelResult.ok) {
      return res.status(400).json({ error: `Vercel: ${vercelResult.error}` });
    }

    // Save to DB
    await setShopDomain(shopId, domain);

    res.json({
      ok:           true,
      domain,
      verification: vercelResult.verification ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    if (msg.includes("Duplicate entry")) {
      return res.status(409).json({ error: "Ce domaine est déjà utilisé par une autre boutique." });
    }
    res.status(500).json({ error: msg });
  }
});

// ── DELETE /api/admin/settings/domain — remove custom domain ─────────────
router.delete("/api/admin/settings/domain", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const shop   = await getShopById(shopId);
    if (shop?.custom_domain) {
      await removeVercelDomain(shop.custom_domain);
    }
    await setShopDomain(shopId, null);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/settings/shop-profile ────────────────────────────────────
router.get("/api/admin/settings/shop-profile", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const shopId = session.shop_id ?? 1;
    const [shop, settings] = await Promise.all([getShopById(shopId), getSettings(shopId)]);
    res.json({
      nom:       shop?.nom       ?? '',
      email:     shop?.email     ?? '',
      telephone: settings['shop_telephone'] ?? '',
      adresse:   settings['shop_adresse']   ?? '',
      ville:     settings['shop_ville']     ?? '',
      pays:      settings['shop_pays']      ?? 'Togo',
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── PATCH /api/admin/settings/shop-profile ───────────────────────────────────
router.patch("/api/admin/settings/shop-profile", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const { nom, email, telephone, adresse, ville, pays } = req.body as Record<string, string>;
    if (nom || email) await updateShop(shopId, { ...(nom ? { nom } : {}), ...(email ? { email } : {}) });
    await setSettings({ shop_telephone: telephone ?? '', shop_adresse: adresse ?? '', shop_ville: ville ?? '', shop_pays: pays ?? 'Togo' }, shopId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/settings/subscription ────────────────────────────────────
router.get("/api/admin/settings/subscription", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const dbUser = await getAdminById(session.id);
    const shopId = dbUser?.shop_id ?? session.shop_id ?? 1;
    const shop = await getShopById(shopId);
    if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

    const [limits, prix, users] = await Promise.all([
      getPlanLimits(shop.plan),
      getPlanPrice(shop.plan),
      listAdminUsers(shopId),
    ]);

    const membresCount = users.filter((u: { actif: number | boolean }) => u.actif === 1 || u.actif === true).length;

    let activeWorkspaces = 4;
    try {
      const raw = (shop as Record<string, unknown>).disabled_workspaces as string | null;
      const disabled = raw ? JSON.parse(raw) : [];
      activeWorkspaces = 4 - (Array.isArray(disabled) ? disabled.length : 0);
    } catch { /* keep 4 */ }

    const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', basic: 'Basic', pro: 'Pro', business: 'Business' };
    const STATUS_LABELS: Record<string, string> = { trial: 'Essai', active: 'Actif', expired: 'Expiré', suspended: 'Suspendu' };

    res.json({
      plan:         shop.plan,
      planLabel:    PLAN_LABELS[shop.plan] ?? shop.plan,
      status:       shop.subscription_status,
      statusLabel:  STATUS_LABELS[(shop as Record<string, unknown>).subscription_status as string] ?? 'Actif',
      prix_mensuel: prix,
      renewal_date: (shop as Record<string, unknown>).current_period_end ?? (shop as Record<string, unknown>).trial_ends_at ?? null,
      limits:       { max_users: limits.max_users, max_entrepots: limits.max_entrepots },
      usage:        { membres: membresCount, workspaces: activeWorkspaces },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/settings/sessions — appareils connectés à ce compte ───────
router.get("/api/admin/settings/sessions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const table = session.role === "staff" ? "utilisateurs" : "admin_users";
    if (session.jti) await touchSession(session.jti).catch(() => {});
    const rows = await getSessionsForUser(Number(session.id), table);
    res.json({
      sessions: rows.map(r => ({
        id: r.id, device_label: r.device_label, ip: r.ip,
        created_at: r.created_at, last_seen_at: r.last_seen_at,
        current: r.jti === session.jti,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/settings/sessions/:id/revoke — déconnecte un appareil ────
router.post("/api/admin/settings/sessions/:id/revoke", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const table = session.role === "staff" ? "utilisateurs" : "admin_users";
    await revokeSessionById(Number(req.params.id), Number(session.id), table);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/settings/sessions/revoke-others — déconnecte tous les autres appareils ──
router.post("/api/admin/settings/sessions/revoke-others", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!session.jti) return res.status(400).json({ error: "Session sans identifiant — reconnectez-vous." });
  try {
    const table = session.role === "staff" ? "utilisateurs" : "admin_users";
    await revokeOtherSessions(Number(session.id), table, session.jti);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── GET /api/admin/settings/team — membres actifs de la boutique ─────────────
router.get("/api/admin/settings/team", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const users = await listAdminUsers(session.shop_id ?? 1);
    res.json({ users: users.filter(u => u.actif) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/settings/team — inviter un membre ────────────────────────
router.post("/api/admin/settings/team", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const { nom, email, role } = req.body as { nom?: string; email?: string; role?: string };
    if (!email?.trim() || !email.includes('@')) return res.status(400).json({ error: "Email invalide." });
    const shopId = session.shop_id ?? 1;
    // Generate temp username from email prefix + random suffix
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20) + '_' + Math.floor(Math.random() * 1000);
    // Temp password — user must reset on first login
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'Aa1!';
    const password_hash = await bcrypt.hash(tempPassword, 10);
    const dbRole = role === 'Admin' ? 'admin' : role === 'Gérant' ? 'manager' : 'staff';
    await createAdminUser({ nom: nom?.trim() || email.split('@')[0], username, email: email.trim(), role: dbRole, password_hash, shop_id: shopId });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
