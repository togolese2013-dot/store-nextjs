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

/* ── Get temporary download URL for a media ID ───────────────────────────── */
export async function getWaMediaUrl(mediaId: string): Promise<string | null> {
  try {
    const token = await getSetting("wa_access_token");
    const res   = await fetch(`${WA_API}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

/* ── Upload media to Meta and return the media_id ────────────────────────── */
export async function uploadWaMedia(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };

    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([buffer], { type: mimeType }), filename);

    const res = await fetch(`${WA_API}/${phoneId}/media`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as any)?.error?.message ?? `HTTP ${res.status}` };
    }
    const data = await res.json() as { id?: string };
    return { success: true, mediaId: data.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/* ── Send an image message by media_id ───────────────────────────────────── */
export async function sendWaImage({
  to, mediaId, caption = "",
}: {
  to:      string;
  mediaId: string;
  caption?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };

    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        messaging_product: "whatsapp",
        to:    cleanPhone(to),
        type:  "image",
        image: { id: mediaId, caption },
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

/* ── Send an audio message by media_id ───────────────────────────────────── */
export async function sendWaAudio({
  to, mediaId,
}: {
  to:      string;
  mediaId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id");
    const token   = await getSetting("wa_access_token");
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };

    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        messaging_product: "whatsapp",
        to:    cleanPhone(to),
        type:  "audio",
        audio: { id: mediaId },
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
  items:     Array<{ nom?: string; nom_produit?: string; qty?: number; quantite?: number; prix?: number; total?: number }>;
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

    console.log(`[WA] sendOrderNotifications — ref=${reference} tel=${telephone}`);
    console.log(`[WA] settings: clientEnabled=${clientEnabled} adminEnabled=${adminEnabled} clientTemplate=${clientTemplate} adminTemplate=${adminTemplate} adminNumber=${adminNumber} lang=${lang}`);

    const languageCode = lang || "fr";
    const baseUrl      = (siteUrl || process.env.FRONTEND_URL || "").replace(/\/$/, "");

    const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
    const articlesStr = items.map(item => {
      const name  = item.nom || item.nom_produit || "Produit";
      const qty   = item.qty ?? item.quantite ?? 1;
      const prix  = item.total ?? (item.prix ? item.prix * qty : null);
      return prix ? `${qty}x ${name} - ${fmt(prix)}` : `${qty}x ${name}`;
    }).join(", ");

    const totalStr    = new Intl.NumberFormat("fr-FR").format(total) + " FCFA";
    const trackingUrl = `${baseUrl}/suivi-commande?ref=${encodeURIComponent(reference)}`;
    const adminUrl    = `${baseUrl}/admin/orders`;

    // Client
    if (clientEnabled === "1" && clientTemplate && telephone) {
      console.log(`[WA] Sending client notif to ${telephone} via template "${clientTemplate}"`);
      const result = await sendWaTemplate({
        to:           telephone,
        templateName: clientTemplate,
        languageCode,
        bodyParams:   [nom, reference, articlesStr, totalStr, trackingUrl],
      });
      console.log(`[WA] Client notif result (${reference}):`, result);
    } else {
      console.log(`[WA] Client notif SKIPPED — enabled=${clientEnabled} template="${clientTemplate}" tel="${telephone}"`);
    }

    // Admin
    if (adminEnabled === "1" && adminTemplate && adminNumber) {
      console.log(`[WA] Sending admin notif to ${adminNumber} via template "${adminTemplate}"`);
      const result = await sendWaTemplate({
        to:           adminNumber,
        templateName: adminTemplate,
        languageCode,
        bodyParams:   [reference, nom, telephone, articlesStr, totalStr, adminUrl],
      });
      console.log(`[WA] Admin notif result (${reference}):`, result);
    } else {
      console.log(`[WA] Admin notif SKIPPED — enabled=${adminEnabled} template="${adminTemplate}" number="${adminNumber}"`);
    }
  } catch (e) {
    console.error("[WA] sendOrderNotifications error:", e);
  }
}
