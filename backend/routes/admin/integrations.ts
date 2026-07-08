import express from "express";
import { getSession } from "../../lib/auth";
import { getSettings, setSettings } from "@/lib/admin-db";

const router = express.Router();

const WA_API = "https://graph.facebook.com/v19.0";

// ── GET /api/admin/integrations — real connection status per integration ────
router.get("/api/admin/integrations", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const settings = await getSettings(session.shop_id ?? 1);
    const phoneId  = settings.wa_phone_number_id ?? "";
    const token    = settings.wa_access_token ?? "";
    res.json({
      whatsapp: {
        connected:       Boolean(phoneId && token),
        phone_number_id: phoneId || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/integrations/whatsapp — connect (tests against Meta first) ──
router.post("/api/admin/integrations/whatsapp", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const { phone_number_id, access_token } = req.body as { phone_number_id?: string; access_token?: string };
  const phoneId = phone_number_id?.trim();
  const token   = access_token?.trim();
  if (!phoneId || !token) {
    return res.status(400).json({ error: "Phone Number ID et Access Token requis." });
  }

  try {
    const r = await fetch(`${WA_API}/${phoneId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message ?? `Meta a refusé ces identifiants (HTTP ${r.status}).`;
      return res.status(400).json({ error: msg });
    }

    await setSettings({ wa_phone_number_id: phoneId, wa_access_token: token }, session.shop_id ?? 1);
    res.json({ ok: true, verified_number: (data as { display_phone_number?: string }).display_phone_number ?? null });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur de connexion à Meta." });
  }
});

// ── DELETE /api/admin/integrations/whatsapp — disconnect ────────────────────
router.delete("/api/admin/integrations/whatsapp", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    await setSettings({ wa_phone_number_id: "", wa_access_token: "" }, session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
