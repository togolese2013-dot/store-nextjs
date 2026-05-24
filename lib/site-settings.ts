import { getSetting } from "./admin-db";
import { getShopId } from "./shop-context";

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togolese.tg";

/** Returns the canonical site URL stored in admin settings, falls back to env var. */
export async function getSiteUrl(shopId?: number): Promise<string> {
  try {
    const id  = shopId ?? await getShopId();
    const url = await getSetting("site_url", id);
    return url?.trim() || FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
}

/** Returns the store name stored in admin settings. */
export async function getSiteName(shopId?: number): Promise<string> {
  try {
    const id   = shopId ?? await getShopId();
    const name = await getSetting("site_name", id);
    return name?.trim() || "Togolese Shop";
  } catch {
    return "Togolese Shop";
  }
}

/** Returns the main WhatsApp number stored in admin settings. */
export async function getSiteWhatsApp(shopId?: number): Promise<string> {
  try {
    const id  = shopId ?? await getShopId();
    const num = await getSetting("whatsapp_number", id);
    return num?.trim() || "";
  } catch {
    return "";
  }
}
