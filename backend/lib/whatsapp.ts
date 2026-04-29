import { getSetting } from "@/lib/admin-db";

const WA_API = "https://graph.facebook.com/v19.0";

function cleanPhone(num: string): string {
  return num.replace(/[\s+\-()]/g, "");
}

/* ── Send a template message ──────────────────────────────────────────────── */
export async function sendWaTemplate({
  to, templateName, languageCode = "fr", bodyParams,
}: {
  to:           string;
  templateName: string;
  languageCode?: string;
  bodyParams:   string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");

    if (!phoneId || !token) {
      return { success: false, error: "Credentials WhatsApp non configurés" };
    }

    const payload = {
      messaging_product: "whatsapp",
      to:                cleanPhone(to),
      type:              "template",
      template: {
        name:     templateName,
        language: { code: languageCode },
        components: bodyParams.length > 0 ? [{
          type:       "body",
          parameters: bodyParams.map(text => ({ type: "text", text })),
        }] : [],
      },
    };

    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as any)?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/* ── Send a free-form text message (24h session window) ───────────────────── */
export async function sendWaText({
  to, body,
}: {
  to:   string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");

    if (!phoneId || !token) {
      return { success: false, error: "Credentials WhatsApp non configurés" };
    }

    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   cleanPhone(to),
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as any)?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/* ── Order notifications ──────────────────────────────────────────────────── */
export async function sendOrderNotifications({
  id, reference, nom, telephone, items, total,
}: {
  id:        number;
  reference: string;
  nom:       string;
  telephone: string;
  items:     Array<{ nom?: string; nom_produit?: string; quantite?: number }>;
  total:     number;
}): Promise<void> {
  try {
    const [
      clientEnabled, adminEnabled,
      clientTemplate, adminTemplate,
      adminNumber, lang, siteUrl,
    ] = await Promise.all([
      getSetting("wa_order_client_enabled"),
      getSetting("wa_order_admin_enabled"),
      getSetting("wa_order_client_template"),
      getSetting("wa_order_admin_template"),
      getSetting("wa_order_admin_number"),
      getSetting("wa_order_lang"),
      getSetting("site_url"),
    ]);

    const languageCode = lang || "fr";
    const baseUrl      = (siteUrl || process.env.FRONTEND_URL || "").replace(/\/$/, "");

    // Format articles: "2x Robe rouge, 1x Pantalon noir"
    const articlesStr = items.map(item => {
      const name = item.nom || item.nom_produit || "Produit";
      const qty  = item.quantite ?? 1;
      return `${qty}x ${name}`;
    }).join(", ");

    const totalStr   = new Intl.NumberFormat("fr-FR").format(total) + " FCFA";
    const trackingUrl = `${baseUrl}/track/${reference}`;
    const adminUrl    = `${baseUrl}/admin/orders`;

    // Client
    if (clientEnabled === "1" && clientTemplate && telephone) {
      const result = await sendWaTemplate({
        to:           telephone,
        templateName: clientTemplate,
        languageCode,
        bodyParams:   [reference, nom, articlesStr, totalStr, trackingUrl],
      });
      if (!result.success) {
        console.error(`[WA] Client notif failed (${reference}):`, result.error);
      }
    }

    // Admin
    if (adminEnabled === "1" && adminTemplate && adminNumber) {
      const result = await sendWaTemplate({
        to:           adminNumber,
        templateName: adminTemplate,
        languageCode,
        bodyParams:   [reference, nom, telephone, articlesStr, totalStr, adminUrl],
      });
      if (!result.success) {
        console.error(`[WA] Admin notif failed (${reference}):`, result.error);
      }
    }
  } catch (e) {
    console.error("[WA] sendOrderNotifications error:", e);
  }
}
