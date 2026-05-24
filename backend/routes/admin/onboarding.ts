import express from "express";
import bcrypt from "bcryptjs";
import { createAdminUser, getAdminByUsername } from "@/lib/admin-db";
import { createShop, getShopBySlug } from "@/lib/shops";
import { sendMail } from "../../lib/mailer";
import { welcomeShopEmail } from "../../lib/email-templates";

const router = express.Router();

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

router.post("/api/admin/onboarding", async (req, res) => {
  try {
    const {
      shop_nom, shop_slug, shop_email, shop_plan,
      admin_nom, admin_username, admin_email, admin_password,
    } = req.body as Record<string, string>;

    // ── Validation ──────────────────────────────────────────────────
    if (!shop_nom?.trim())     return res.status(400).json({ error: "Nom de boutique requis." });
    if (!shop_slug?.trim())    return res.status(400).json({ error: "Slug requis." });
    if (!shop_email?.trim())   return res.status(400).json({ error: "Email boutique requis." });
    if (!admin_nom?.trim())    return res.status(400).json({ error: "Nom admin requis." });
    if (!admin_username?.trim()) return res.status(400).json({ error: "Nom d'utilisateur requis." });
    if (!admin_password || admin_password.length < 8) {
      return res.status(400).json({ error: "Mot de passe : 8 caractères minimum." });
    }

    const slug = shop_slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return res.status(400).json({ error: "Slug invalide. Lettres minuscules, chiffres et tirets uniquement (3–50 caractères)." });
    }
    if (["admin", "api", "www", "mail", "default", "app"].includes(slug)) {
      return res.status(400).json({ error: "Ce slug est réservé." });
    }

    // ── Unicité slug boutique ────────────────────────────────────────
    const existing = await getShopBySlug(slug);
    if (existing) return res.status(409).json({ error: "Ce slug est déjà utilisé. Choisissez-en un autre." });

    // ── Unicité username admin (global — username doit être unique par shop) ──
    // We check after shop creation; here just check format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(admin_username.trim())) {
      return res.status(400).json({ error: "Nom d'utilisateur : 3–30 caractères, lettres/chiffres/underscore." });
    }

    // ── Créer la boutique ────────────────────────────────────────────
    const plan = ["free", "basic", "pro"].includes(shop_plan) ? (shop_plan as "free" | "basic" | "pro") : "free";
    const shopId = await createShop({ nom: shop_nom.trim(), slug, email: shop_email.trim(), plan });

    // ── Créer l'admin de la boutique ─────────────────────────────────
    const password_hash = await bcrypt.hash(admin_password, 12);
    await createAdminUser({
      nom:           admin_nom.trim(),
      username:      admin_username.trim().toLowerCase(),
      email:         admin_email?.trim() || null,
      role:          "admin",
      password_hash,
      shop_id:       shopId,
    });

    // ── Welcome email (fire-and-forget — don't fail the request if mail fails) ─
    const siteBase = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const adminUrl = `${siteBase}/admin`;
    const loginUrl = `${siteBase}/admin/login`;
    const emailTo  = admin_email?.trim() || shop_email.trim();

    const { subject, html, text } = welcomeShopEmail({
      adminNom:  admin_nom.trim(),
      shopNom:   shop_nom.trim(),
      shopSlug:  slug,
      adminUrl,
      loginUrl,
      plan,
    });
    sendMail({ to: emailTo, subject, html, text }).catch(e =>
      console.error("[onboarding] welcome email failed:", e)
    );

    res.status(201).json({ ok: true, shop_id: shopId, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    // Duplicate entry on slug (race condition)
    if (msg.includes("Duplicate entry") && msg.includes("slug")) {
      return res.status(409).json({ error: "Ce slug est déjà utilisé." });
    }
    res.status(500).json({ error: msg });
  }
});

// Check slug availability (live validation)
router.get("/api/admin/onboarding/check-slug", async (req, res) => {
  const slug = String(req.query.slug ?? "").toLowerCase();
  if (!SLUG_RE.test(slug)) return res.json({ available: false, reason: "format" });
  if (["admin", "api", "www", "mail", "default", "app"].includes(slug)) {
    return res.json({ available: false, reason: "reserved" });
  }
  const existing = await getShopBySlug(slug);
  res.json({ available: !existing });
});

export default router;
