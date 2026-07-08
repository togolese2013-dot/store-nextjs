import { getSetting } from "@/lib/admin-db";

/**
 * Every function below takes a required `shopId` — WhatsApp credentials/templates
 * are stored per-shop (settings table, shop_id-scoped). Never default this silently:
 * that was the pre-existing bug where every tenant's messages used shop #1's credentials.
 */

const WA_API = "https://graph.facebook.com/v19.0";

function cleanPhone(num: string): string {
  return num.replace(/[\s+\-()]/g, "");
}

/* ── Send a template message ──────────────────────────────────────────────── */
export async function sendWaTemplate({
  to, templateName, languageCode = "fr", bodyParams, shopId,
}: {
  to:           string;
  templateName: string;
  languageCode?: string;
  bodyParams:   string[];
  shopId:       number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id", shopId);
    const token   = await getSetting("wa_access_token", shopId);

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
  to, body, shopId,
}: {
  to:     string;
  body:   string;
  shopId: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id", shopId);
    const token   = await getSetting("wa_access_token", shopId);

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

    const responseData = await res.json().catch(() => ({}));
    console.log("[sendWaText] to:", cleanPhone(to), "status:", res.status, "response:", JSON.stringify(responseData));
    if (!res.ok) {
      return { success: false, error: (responseData as any)?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/* ── Get temporary download URL for a media ID ───────────────────────────── */
export async function getWaMediaUrl(mediaId: string, shopId: number): Promise<string | null> {
  try {
    const token = await getSetting("wa_access_token", shopId);
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
  shopId: number,
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id", shopId);
    const token   = await getSetting("wa_access_token", shopId);
    if (!phoneId || !token) return { success: false, error: "Credentials manquants" };

    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

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
  to, mediaId, caption = "", shopId,
}: {
  to:      string;
  mediaId: string;
  caption?: string;
  shopId:  number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id", shopId);
    const token   = await getSetting("wa_access_token", shopId);
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

    const responseData = await res.json().catch(() => ({}));
    console.log("[sendWaImage] to:", cleanPhone(to), "status:", res.status, "response:", JSON.stringify(responseData));
    if (!res.ok) {
      return { success: false, error: (responseData as any)?.error?.message ?? `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

/* ── Send an audio message by media_id ───────────────────────────────────── */
export async function sendWaAudio({
  to, mediaId, shopId,
}: {
  to:      string;
  mediaId: string;
  shopId:  number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneId = await getSetting("wa_phone_number_id", shopId);
    const token   = await getSetting("wa_access_token", shopId);
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

/* ── Boutique vente notification ─────────────────────────────────────────── */
export async function sendBoutiqueVenteNotif({
  telephone, nom, reference, total, montant_acompte, statut_paiement, items, shopId,
}: {
  telephone:        string;
  nom:              string;
  reference:        string;
  total:            number;
  montant_acompte:  number | null;
  statut_paiement:  string | null;
  items:            Array<{ nom: string; qty: number; total: number }>;
  shopId:           number;
}): Promise<void> {
  try {
    const [enabled, templateFull, templateAcompte, lang, siteUrl] = await Promise.all([
      getSetting("wa_boutique_vente_enabled", shopId),
      getSetting("wa_boutique_vente_template_full", shopId),
      getSetting("wa_boutique_vente_template_acompte", shopId),
      getSetting("wa_order_lang", shopId),
      getSetting("site_url", shopId),
    ]);

    if (enabled !== "1" || !telephone) return;

    const languageCode = lang || "fr";
    const baseUrl      = (siteUrl || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://togolese.tg").replace(/\/$/, "");
    const fmt          = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
    const articlesList = items.map(i => `${i.qty}x ${i.nom} - ${fmt(i.total)}`).join("\n");

    if (statut_paiement === "acompte" && templateAcompte) {
      const acompte     = montant_acompte ?? 0;
      const resteAPayer = total - acompte;
      await sendWaTemplate({
        to:           telephone,
        templateName: templateAcompte,
        languageCode,
        bodyParams:   [nom, reference, articlesList, fmt(acompte), fmt(resteAPayer), baseUrl],
        shopId,
      });
    } else if (templateFull) {
      await sendWaTemplate({
        to:           telephone,
        templateName: templateFull,
        languageCode,
        bodyParams:   [nom, reference, articlesList, fmt(total), baseUrl],
        shopId,
      });
    }
  } catch (e) {
    console.error("[WA] sendBoutiqueVenteNotif error:", e);
  }
}

/* ── Order notifications ──────────────────────────────────────────────────── */
export async function sendOrderNotifications({
  id, reference, nom, telephone, items, total, shopId,
}: {
  id:        number;
  reference: string;
  nom:       string;
  telephone: string;
  items:     Array<{ nom?: string; nom_produit?: string; qty?: number; quantite?: number; prix?: number; total?: number }>;
  total:     number;
  shopId:    number;
}): Promise<void> {
  try {
    const [
      clientEnabled, adminEnabled,
      clientTemplate, adminTemplate,
      adminNumber, adminNumber2, lang, siteUrl,
    ] = await Promise.all([
      getSetting("wa_order_client_enabled", shopId),
      getSetting("wa_order_admin_enabled", shopId),
      getSetting("wa_order_client_template", shopId),
      getSetting("wa_order_admin_template", shopId),
      getSetting("wa_order_admin_number", shopId),
      getSetting("wa_order_admin_number_2", shopId),
      getSetting("wa_order_lang", shopId),
      getSetting("site_url", shopId),
    ]);

    if (process.env.NODE_ENV !== "production") console.log(`[WA] sendOrderNotifications — ref=${reference} tel=${telephone}`);

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
      const result = await sendWaTemplate({
        to:           telephone,
        templateName: clientTemplate,
        languageCode,
        bodyParams:   [nom, reference, articlesStr, totalStr, trackingUrl],
        shopId,
      });
      if (process.env.NODE_ENV !== "production") console.log(`[WA] Client notif result (${reference}):`, result);
    }

    // Admin
    if (adminEnabled === "1" && adminTemplate && adminNumber) {
      const result = await sendWaTemplate({
        to:           adminNumber,
        templateName: adminTemplate,
        languageCode,
        bodyParams:   [reference, nom, telephone, articlesStr, totalStr, adminUrl],
        shopId,
      });
      if (process.env.NODE_ENV !== "production") console.log(`[WA] Admin notif result (${reference}):`, result);

      if (adminNumber2 && adminNumber2 !== adminNumber) {
        await sendWaTemplate({
          to:           adminNumber2,
          templateName: adminTemplate,
          languageCode,
          bodyParams:   [reference, nom, telephone, articlesStr, totalStr, adminUrl],
          shopId,
        }).catch(e => console.error(`[WA] Admin notif #2 error (${reference}):`, e));
      }
    }
  } catch (e) {
    console.error("[WA] sendOrderNotifications error:", e);
  }
}

/* ── Delivery confirmation to client ─────────────────────────────────────── */
export async function sendWaDeliveryConfirmation(order: {
  nom:            string;
  telephone:      string | null;
  reference:      string;
  items:          string | unknown[];
  zone_livraison: string | null;
  delivery_fee:   number;
  total:          number;
  shopId:         number;
}): Promise<void> {
  try {
    const [enabled, templateName, lang] = await Promise.all([
      getSetting("wa_delivery_template_enabled", order.shopId),
      getSetting("wa_delivery_template", order.shopId),
      getSetting("wa_order_lang", order.shopId),
    ]);

    if (enabled !== "1" || !templateName || !order.telephone) return;

    const languageCode = lang || "fr";
    const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

    // Parse items
    let items: { nom?: string; qty?: number; quantite?: number; total?: number; prix?: number; prix_unitaire?: number }[] = [];
    try {
      items = typeof order.items === "string" ? JSON.parse(order.items) : (order.items as typeof items);
    } catch { items = []; }

    const articlesStr = items.map(item => {
      const name = item.nom || "Produit";
      const qty  = item.qty ?? item.quantite ?? 1;
      const prix = item.total ?? (item.prix_unitaire ?? item.prix ?? 0) * qty;
      return `• ${qty}x ${name} — ${fmt(prix)}`;
    }).join("\n");

    const livraisonStr = order.delivery_fee > 0
      ? `${order.zone_livraison || "Livraison"} — ${fmt(order.delivery_fee)}`
      : `${order.zone_livraison || "Livraison"} — Gratuit`;

    const result = await sendWaTemplate({
      to:           order.telephone,
      templateName,
      languageCode,
      bodyParams:   [
        order.nom,
        order.reference,
        articlesStr,
        livraisonStr,
        fmt(order.total),
      ],
      shopId: order.shopId,
    });

    if (!result.success) console.error("[WA] delivery confirmation failed:", result.error);
  } catch (e) {
    console.error("[WA] sendWaDeliveryConfirmation error:", e);
  }
}
