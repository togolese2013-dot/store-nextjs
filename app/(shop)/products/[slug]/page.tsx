import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { finalPrice, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { getRelatedProductsWithDetails } from "@/lib/related-products";
import ShopProductCard from "@/components/shop/ShopProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import { type Variant } from "@/components/ProductVariantSelector";
import ProductImageGallerySimple from "@/components/ProductImageGallerySimple";
import ProductGalleryWithVariants from "@/components/ProductGalleryWithVariants";
import RecentViewTracker from "@/components/RecentViewTracker";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import RatingBadge from "@/components/RatingBadge";
import { Truck, ShieldCheck } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";
import { getSiteUrl, getSiteName } from "@/lib/site-settings";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const id = Number(slug);
    if (!isNaN(id) && id > 0) {
      const res = await apiGet<{ data: Product[] }>(`/api/products?ids=${id}`, { noAuth: true });
      return res.data?.[0] ?? null;
    }
    const res = await apiGet<{ data: Product[] }>(`/api/products?slug=${encodeURIComponent(slug)}&limit=1`, { noAuth: true });
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, siteUrl, siteName] = await Promise.all([
    fetchProductBySlug(slug),
    getSiteUrl(),
    getSiteName(),
  ]);
  if (!product) return { title: "Produit introuvable" };

  const price       = finalPrice(product);
  const description = product.description ?? `${product.nom} — ${formatPrice(price)} FCFA — Livraison rapide au Togo.`;
  const canonicalUrl = `${siteUrl}/products/${product.slug ?? product.reference ?? slug}`;
  const ogImage = product.image_url ? { url: product.image_url, width: 800, height: 800, alt: product.nom } : undefined;

  return {
    title:       product.nom,
    description,
    alternates:  { canonical: canonicalUrl },
    openGraph: {
      type:      "website",
      url:       canonicalUrl,
      siteName,
      title:     `${product.nom} | ${siteName}`,
      description,
      images:    ogImage ? [ogImage] : [],
      locale:    "fr_TG",
    },
    twitter: {
      card:   "summary_large_image",
      title:  `${product.nom} | ${siteName}`,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product  = await fetchProductBySlug(slug);

  if (!product) notFound();

  const price    = finalPrice(product);
  const discountPercent = product.prix_unitaire > 0
    ? Math.round((Math.min(product.remise, product.prix_unitaire) / product.prix_unitaire) * 100)
    : 0;
  const isPromo  = product.remise > 0 && discountPercent > 0;
  const createdAt = product.date_creation ? new Date(product.date_creation) : null;
  const isNew = Boolean(
    product.neuf && createdAt &&
    Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000
  );
  const stockDisp = product.stock_boutique;
  const outOf    = stockDisp === 0;
  const isLow    = stockDisp > 0 && stockDisp <= 5;

  const rawUrl = product.image_url || product.images?.[0] || null;
  const allProductImages: string[] = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []).filter(url => url && url !== product.image_url),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togolese.tg";
  const absoluteImages = allProductImages
    .filter(Boolean)
    .map(u => u.startsWith("http") ? u : `${siteUrl}${u.startsWith("/") ? u : `/${u}`}`);

  const productDescription =
    (product as Product & { description_longue?: string }).description_longue
    ?? product.description
    ?? product.nom;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:        product.nom,
    description: productDescription,
    sku:         product.reference,
    brand: { "@type": "Brand", name: product.marque_nom ?? "Togolese Shop" },
    image: absoluteImages.length > 1 ? absoluteImages : (absoluteImages[0] ?? undefined),
    ...(product.categorie_nom ? { category: product.categorie_nom } : {}),
    offers: {
      "@type":       "Offer",
      url:           `${siteUrl}/products/${product.slug ?? product.reference}`,
      priceCurrency: "XOF",
      price,
      availability:  outOf ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller:        { "@type": "Organization", name: "Togolese Shop" },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil",  item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Produits", item: `${siteUrl}/products` },
      ...(product.categorie_nom && product.categorie_id ? [{
        "@type": "ListItem", position: 3, name: product.categorie_nom,
        item: `${siteUrl}/products?category=${product.categorie_id}`,
      }] : []),
      {
        "@type":   "ListItem",
        position:  product.categorie_nom ? 4 : 3,
        name:      product.nom,
        item:      `${siteUrl}/products/${product.slug ?? product.reference}`,
      },
    ],
  };

  const variants: Variant[] = await apiGet<Variant[]>(
    `/api/admin/products/${product.id}/variants`, { noAuth: true }
  ).catch(() => []);
  const hasVariants = variants.length > 0;

  const related: Product[] = product.categorie_id
    ? await apiGet<{ data: Product[] }>(`/api/products?category=${product.categorie_id}&limit=5`, { noAuth: true })
        .then(r => r.data.filter(p => p.id !== product!.id).slice(0, 4))
        .catch(() => [])
    : [];

  const recommended = await getRelatedProductsWithDetails(product.id).catch(() => []);

  const recentItem = {
    id:        product.id,
    reference: product.reference,
    slug:      product.slug ?? null,
    nom:       product.nom,
    image_url: product.image_url,
    prix:      product.prix_unitaire,
    remise:    product.remise,
  };

  /* Badge rendered inside gallery */
  const BadgeElem = () => (
    <>
      {isPromo && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-white text-[11px] font-bold"
          style={{ background: "#E07A2C" }}>
          -{discountPercent}%
        </span>
      )}
      {isNew && !isPromo && (
        <span className="px-2.5 py-1 rounded-full text-white text-[11px] font-bold"
          style={{ background: "#2D6A4F" }}>
          Nouveau
        </span>
      )}
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: "#FBF7F1" }}>
      <RecentViewTracker item={recentItem} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ── Image block (full-width on mobile) ── */}
      <div className="relative bg-white">
        {/* Back button overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
          style={{ paddingTop: "env(safe-area-inset-top, 4px)" }}>
          <Link href="/products"
            className="mt-3 w-9 h-9 rounded-full grid place-items-center"
            style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14110E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
        </div>

        {hasVariants ? (
          <ProductGalleryWithVariants
            product={product}
            variants={variants}
            defaultImages={allProductImages}
            badges={<BadgeElem />}
            headerSlot={<>
              <div className="flex items-center justify-between mb-2">
                {(product.marque_nom || product.categorie_nom) && (
                  <span className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: "#8A8278" }}>
                    {product.marque_nom ?? product.categorie_nom}
                  </span>
                )}
                <span className="text-[10px] font-mono ml-auto" style={{ color: "#8A8278" }}>
                  Réf. {product.reference}
                </span>
              </div>
              <h1 className="text-[22px] leading-[1.15] tracking-[-0.01em] mb-2"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", color: "#14110E" }}>
                {product.nom}
              </h1>
              <RatingBadge productId={product.id} size="md" />
            </>}
            footerSlot={<>
              <div className="mt-4">
                <ShareButtons title={product.nom} />
              </div>
              <TrustRow />
            </>}
          />
        ) : (
          <div className="lg:flex">
            {/* Gallery */}
            <div className="lg:w-1/2 relative">
              <ProductImageGallerySimple images={allProductImages} productName={product.nom} />
              <div className="absolute top-12 left-4 flex flex-col gap-2 z-10">
                <BadgeElem />
              </div>
            </div>

            {/* Info panel */}
            <div className="lg:w-1/2 px-5 py-6 lg:p-10" style={{ background: "#FBF7F1" }}>
              {/* Brand / category */}
              <div className="flex items-center justify-between mb-2">
                {(product.marque_nom || product.categorie_nom) && (
                  <span className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: "#8A8278" }}>
                    {product.marque_nom ?? product.categorie_nom}
                  </span>
                )}
                <span className="text-[10px] font-mono ml-auto" style={{ color: "#8A8278" }}>
                  Réf. {product.reference}
                </span>
              </div>

              {/* Product name */}
              <h1 className="text-[24px] leading-[1.1] tracking-[-0.01em] mb-2"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", color: "#14110E" }}>
                {product.nom}
              </h1>

              <RatingBadge productId={product.id} size="md" />

              {/* Price */}
              <div className="flex items-center justify-between my-4">
                <div>
                  <span className="text-[22px] font-mono font-medium tracking-[-0.02em]" style={{ color: "#14110E" }}>
                    {formatPrice(price)}
                  </span>
                  {isPromo && (
                    <span className="ml-2 text-[14px] line-through" style={{ color: "#8A8278" }}>
                      {formatPrice(product.prix_unitaire)}
                    </span>
                  )}
                </div>
                {/* Stock indicator */}
                {outOf ? (
                  <span className="text-[12px] font-medium px-3 py-1 rounded-full border" style={{ color: "#8A8278", borderColor: "#E8E1D4" }}>
                    Rupture
                  </span>
                ) : isLow ? (
                  <span className="text-[12px] font-medium" style={{ color: "#E07A2C" }}>
                    Plus que {stockDisp} !
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#2D6A4F" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2D6A4F" }} />
                    En stock
                  </div>
                )}
              </div>

              {/* Description (short) */}
              {product.description && (
                <div className="pb-5 mb-5 border-b" style={{ borderColor: "#E8E1D4" }}>
                  <p className="text-[13.5px] leading-[1.55] tracking-[-0.005em]" style={{ color: "#6B635B" }}>
                    {product.description.length > 250
                      ? product.description.slice(0, 250).trimEnd() + "…"
                      : product.description}
                  </p>
                </div>
              )}

              {/* Add to cart CTA */}
              <AddToCartButton product={product} />

              <div className="mt-4">
                <ShareButtons title={product.nom} />
              </div>
              <TrustRow />
            </div>
          </div>
        )}
      </div>

      {/* ── Description complète ── */}
      {product.description && (
        <div className="mx-4 mt-4 rounded-[14px] border p-5 bg-white" style={{ borderColor: "#E8E1D4" }}>
          <h2 className="text-[15px] font-medium mb-3 tracking-[-0.02em]" style={{ color: "#14110E" }}>
            Description du produit
          </h2>
          <p className="text-[13.5px] leading-[1.6] whitespace-pre-line" style={{ color: "#6B635B" }}>
            {productDescription}
          </p>
        </div>
      )}

      {/* ── Avis clients ── */}
      <div className="mx-4 mt-4 rounded-[14px] border bg-white overflow-hidden" style={{ borderColor: "#E8E1D4" }}>
        <ProductReviews productId={product.id} />
      </div>

      {/* ── Related products ── */}
      {related.length > 0 && (
        <section className="mt-6 mb-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-[16px] font-medium tracking-[-0.02em]" style={{ color: "#14110E" }}>
              Produits similaires
            </h2>
            {product.categorie_id && (
              <Link href={`/products?category=${product.categorie_id}`}
                className="text-[12px]" style={{ color: "#3B6A8F" }}>
                Voir tout →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-[10px] px-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map(p => <ShopProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Recommended ── */}
      {recommended.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-[16px] font-medium tracking-[-0.02em]" style={{ color: "#14110E" }}>
              Vous aimerez aussi
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-[10px] px-4 sm:grid-cols-3 lg:grid-cols-4">
            {recommended.map(p => <ShopProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <div className="h-6" />
    </div>
  );
}

function TrustRow() {
  return (
    <div className="mt-5 pt-5 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid #E8E1D4" }}>
      {[
        { Icon: Truck,       label: "Livraison rapide",        sub: "Lomé & tout le Togo" },
        { Icon: ShieldCheck, label: "Paiement à la livraison", sub: "Payez à la réception" },
      ].map(({ Icon, label, sub }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#FBE9D6" }}>
            <Icon className="w-4 h-4" style={{ color: "#E07A2C" }} />
          </div>
          <div>
            <p className="text-[12px] font-bold" style={{ color: "#14110E" }}>{label}</p>
            <p className="text-[11px]" style={{ color: "#8A8278" }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
