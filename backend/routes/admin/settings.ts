import express from "express";
import { getSession } from "../../lib/auth";
import { getSettings, setSettings } from "@/lib/admin-db";
import { getShopById, setShopDomain } from "@/lib/shops";
import { addVercelDomain, removeVercelDomain, checkVercelDomain } from "../../lib/vercel-domains";

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

export default router;
