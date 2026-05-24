/**
 * Server-side shop context helpers.
 * Reads the x-shop-slug header injected by middleware (subdomain routing).
 * Safe to call in any server component or route handler.
 */
import { headers } from "next/headers";
import { getShopBySlug, getShopByDomain } from "./shops";

/** Returns the shop slug from the current request (subdomain), or null. */
export async function getShopSlug(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-shop-slug") || null;
  } catch {
    return null;
  }
}

/** Resolves the shop_id from the current request (subdomain or custom domain). Falls back to 1. */
export async function getShopId(): Promise<number> {
  try {
    const h            = await headers();
    const slug         = h.get("x-shop-slug");
    const customDomain = h.get("x-custom-domain");

    if (slug && slug !== "default") {
      const shop = await getShopBySlug(slug);
      return shop?.id ?? 1;
    }
    if (customDomain) {
      const shop = await getShopByDomain(customDomain);
      return shop?.id ?? 1;
    }
    return 1;
  } catch {
    return 1;
  }
}
