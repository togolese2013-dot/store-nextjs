export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { Product, Category } from "@/lib/utils";
import { formatPrice, finalPrice } from "@/lib/utils";
import { getSiteUrl, getSiteName } from "@/lib/site-settings";
import ShopProductCard from "@/components/shop/ShopProductCard";
import HeroSection from "@/components/HeroSection";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const [siteUrl, siteName] = await Promise.all([getSiteUrl(), getSiteName()]);
  const description = "Boutique en ligne au Togo — livraison rapide à Lomé et partout au Togo.";
  return {
    title: siteName,
    description,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName,
      title: siteName,
      description,
      locale: "fr_TG",
    },
    twitter: { card: "summary_large_image", title: siteName, description },
  };
}

/* ── Category chips ── */
function CategoryChips({
  categories,
  active,
}: {
  categories: Category[];
  active?: number;
}) {
  const all = [{ id: 0, nom: "Tous", description: null }];
  const list = [...all, ...categories.slice(0, 6)];

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      <div className="flex gap-[7px] px-4 py-[14px] w-max">
        {list.map((c) => {
          const isActive = c.id === 0 ? !active : c.id === active;
          const href =
            c.id === 0 ? "/products" : `/products?category=${c.id}`;
          return (
            <Link
              key={c.id}
              href={href}
              className="px-[14px] py-[7px] rounded-full text-[12.5px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                border: `1.5px solid ${isActive ? "#14110E" : "#E8E1D4"}`,
                background: isActive ? "#14110E" : "transparent",
                color: isActive ? "#fff" : "#6B635B",
              }}
            >
              {c.nom}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-4 mb-[10px]">
      <h2 className="text-[16px] font-medium text-[#14110E] tracking-[-0.02em]">{title}</h2>
      <Link href={href} className="text-[12px] text-[#3B6A8F] font-medium">
        Voir tout →
      </Link>
    </div>
  );
}

/* ── Featured row card (bestseller) ── */
function FeaturedCard({ product }: { product: Product }) {
  const price = finalPrice(product);
  const isPromo = product.remise > 0;
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const raw = product.image_url || product.images?.[0] || null;
  const imgSrc = raw
    ? raw.startsWith("http")
      ? raw
      : `${SITE}${raw.startsWith("/") ? raw : `/${raw}`}`
    : null;

  return (
    <Link href={`/products/${product.slug ?? product.reference}`}>
      <div
        className="mx-4 flex rounded-[14px] border border-[#E8E1D4] overflow-hidden bg-white cursor-pointer"
      >
        {/* Image */}
        <div className="w-24 shrink-0 bg-[rgba(232,225,212,0.25)] relative">
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={product.nom}
              className="w-full h-24 object-contain p-2"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center">
              <span className="text-[9px] text-[#8A8278] font-mono uppercase">produit</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 p-[12px_14px] flex flex-col justify-between">
          <div>
            {product.categorie_nom && (
              <p className="text-[9.5px] text-[#8A8278] uppercase tracking-[0.06em] mb-0.5">
                {product.categorie_nom}
              </p>
            )}
            <h3
              className="text-[13px] text-[#14110E] leading-[1.2] mb-[5px] line-clamp-2"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic" }}
            >
              {product.nom}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[14px] font-mono font-medium text-[#14110E]">
              {formatPrice(price)}
            </span>
            {isPromo && (
              <span className="text-[11px] text-[#8A8278] line-through">
                {formatPrice(product.prix_unitaire)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Delivery trust banner ── */
function DeliveryBanner() {
  return (
    <div
      className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-[#E8E1D4] bg-white px-4 py-3"
    >
      <Truck className="w-[18px] h-[18px] text-[#14110E] shrink-0" strokeWidth={1.85} />
      <div>
        <p className="text-[13px] font-medium text-[#14110E]">Livraison rapide · Paiement à la livraison</p>
        <p className="text-[11.5px] text-[#6B635B] mt-0.5">Lomé & tout le Togo · Lun–Sam</p>
      </div>
    </div>
  );
}

/* ── PAGE ── */
export default async function HomePage() {
  let categories: Category[] = [];
  let bestsellers: Product[] = [];
  let newItems: Product[] = [];
  let promos: Product[] = [];

  const [catRes, bsRes, newRes, promoRes] = await Promise.allSettled([
    apiGet<{ data: Category[] }>("/api/categories", { noAuth: true }).then((r) => r.data),
    apiGet<{ data: Product[] }>("/api/products/bestsellers?limit=8").then((r) => r.data),
    apiGet<{ data: Product[] }>("/api/products?new=true&limit=8").then((r) => r.data),
    apiGet<{ data: Product[] }>("/api/products?promo=true&limit=6").then((r) => r.data),
  ]);

  if (catRes.status === "fulfilled")  categories  = catRes.value;
  if (bsRes.status === "fulfilled")   bestsellers  = bsRes.value;
  if (newRes.status === "fulfilled")  newItems     = newRes.value;
  if (promoRes.status === "fulfilled") promos      = promoRes.value;

  const [siteUrl, siteName] = await Promise.all([getSiteUrl(), getSiteName()]).catch(() => [
    "https://togolese.tg",
    "Togolese Shop",
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
    inLanguage: "fr",
  };

  const featured = bestsellers[0];
  const restBestsellers = bestsellers.slice(1);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="mx-4 mb-4 rounded-[18px] overflow-hidden">
        <HeroSection />
      </div>

      {/* Category chips */}
      <CategoryChips categories={categories} />

      {/* Delivery trust */}
      <DeliveryBanner />

      {/* Nouveautés */}
      {newItems.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Nouveautés" href="/products?new=true" />
          <div className="grid grid-cols-2 gap-[10px] px-4">
            {newItems.slice(0, 4).map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Meilleures ventes */}
      {bestsellers.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Meilleures ventes" href="/products?best=true" />
          {/* Featured card */}
          {featured && (
            <div className="mb-[8px]">
              <FeaturedCard product={featured} />
            </div>
          )}
          {/* Horizontal scroll */}
          {restBestsellers.length > 0 && (
            <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-[10px] px-4 pb-1 w-max">
                {restBestsellers.slice(0, 5).map((p) => (
                  <div key={p.id} className="w-[150px] shrink-0">
                    <ShopProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Promotions */}
      {promos.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Promotions" href="/products?promo=true" />
          <div className="grid grid-cols-2 gap-[10px] px-4">
            {promos.slice(0, 4).map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
          {promos.length > 4 && (
            <div className="flex justify-center mt-4 px-4">
              <Link
                href="/products?promo=true"
                className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-[14px] font-medium text-[#14110E] border-[1.5px] border-[#E8E1D4] bg-white"
              >
                Voir toutes les promotions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Spacer for bottom nav */}
      <div className="h-4" />
    </>
  );
}
