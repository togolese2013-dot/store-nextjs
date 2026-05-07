import { getSetting } from "./admin-db";

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://store.togolese.fr";

/** Returns the canonical site URL stored in admin settings, falls back to env var. */
export async function getSiteUrl(): Promise<string> {
  try {
    const url = await getSetting("site_url");
    return url?.trim() || FALLBACK_URL;
  } catch {
    return FALLBACK_URL;
  }
}

/** Returns the store name stored in admin settings. */
export async function getSiteName(): Promise<string> {
  try {
    const name = await getSetting("site_name");
    return name?.trim() || "Togolese Shop";
  } catch {
    return "Togolese Shop";
  }
}

/** Returns the main WhatsApp number stored in admin settings. */
export async function getSiteWhatsApp(): Promise<string> {
  try {
    const num = await getSetting("whatsapp_number");
    return num?.trim() || "";
  } catch {
    return "";
  }
}
