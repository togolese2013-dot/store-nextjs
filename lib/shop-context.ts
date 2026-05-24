/**
 * Server-side shop context helpers.
 * Reads the x-shop-slug header injected by middleware (subdomain routing).
 * Safe to call in any server component or route handler.
 */
import { headers } from "next/headers";
import { getShopBySlug } from "./shops";

/** Returns the shop slug from the current request (subdomain), or null. */
export async function getShopSlug(): Promise<string | null> {
  try {
    const h = await headers();
    const slug = h.get("x-shop-slug");
    return slug || null;
  } catch {
    return null;
  }
}

/** Resolves the shop_id from the current request subdomain. Falls back to 1. */
export async function getShopId(): Promise<number> {
  const slug = await getShopSlug();
  if (!slug || slug === "default") return 1;
  try {
    const shop = await getShopBySlug(slug);
    return shop?.id ?? 1;
  } catch {
    return 1;
  }
}
