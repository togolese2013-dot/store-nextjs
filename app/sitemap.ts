import { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/db";

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
    const products = await getProducts({ limit: 500 });
    productPages = products.map(p => ({
      url:             `${BASE}/products/${p.reference}`,
      lastModified:    new Date(p.date_creation || new Date()),
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));
  } catch { /* DB unavailable — skip dynamic pages */ }

  try {
    const categories = await getCategories();
    categoryPages = categories.map(c => ({
      url:             `${BASE}/products?category=${c.id}`,
      lastModified:    new Date(),
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }));
  } catch { /* skip */ }

  return [...staticPages, ...productPages, ...categoryPages];
}
