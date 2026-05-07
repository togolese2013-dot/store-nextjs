import { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import type { Product, Category } from "@/lib/utils";
import { getSiteUrl } from "@/lib/site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = await getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/products`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/fidelite`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/parrainage`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/cgu`,                 lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/politique-retour`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
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
