import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/account/", "/livreur/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
