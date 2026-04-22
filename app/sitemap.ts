import { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import type { Product, Category } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://store-nextjs-production.up.railway.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                     lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/products`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/cart`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/wishlist`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/fidelite`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/parrainage`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/account`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/account/commandes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const { data } = await apiGet<{ data: Product[] }>("/api/products?limit=500", { noAuth: true });
    productPages = data.map(p => ({
      url:             `${BASE}/products/${p.reference}`,
      lastModified:    new Date(p.date_creation || new Date()),
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));
  } catch { /* backend unavailable — skip dynamic pages */ }

  try {
    const { categories } = await apiGet<{ categories: Category[] }>("/api/categories", { noAuth: true });
    categoryPages = categories.map(c => ({
      url:             `${BASE}/products?category=${c.id}`,
      lastModified:    new Date(),
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }));
  } catch { /* skip */ }

  return [...staticPages, ...productPages, ...categoryPages];
}
