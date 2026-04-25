import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { finalPrice, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { getRelatedProductsWithDetails } from "@/lib/related-products";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import ProductVariantSelector, { type Variant } from "@/components/ProductVariantSelector";
import ProductImageGallerySimple from "@/components/ProductImageGallerySimple";
import RecentViewTracker from "@/components/RecentViewTracker";
import RecentlyViewed from "@/components/RecentlyViewed";
import Link from "next/link";
import {
  Zap, ShieldCheck, Truck, ChevronRight,
  Sparkles, Star,
} from "lucide-react";
import type { Review } from "@/lib/admin-db";

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
    const res = await apiGet<{ data: Product[] }>(`/api/products?reference=${encodeURIComponent(slug)}&limit=1`, { noAuth: true });
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product  = await fetchProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };

  const price = finalPrice(product);
  return {
    title: product.nom,
    description: product.description ?? `${product.nom} — ${formatPrice(price)} — Livraison rapide au Togo.`,
    openGraph: {
      title:       product.nom,
      description: product.description ?? `${product.nom} — ${formatPrice(price)}`,
      images:      product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product  = await fetchProductBySlug(slug);

  if (!product) notFound();

  const price    = finalPrice(product);
  const isPromo  = product.remise > 0;
  const stockDisp = product.stock_magasin > 0 ? product.stock_magasin : product.stock_boutique;
  const outOf    = stockDisp === 0;
  const isLow    = stockDisp > 0 && stockDisp <= 5;

  /* Image list: main first, then secondary (no duplicates) */
  const rawUrl = product.image_url || product.images?.[0] || null;
  const allProductImages: string[] = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []).filter(url => url && url !== product.image_url),
  ];

  /* JSON-LD — Schema.org Product */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://store-nextjs-production.up.railway.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:        product.nom,
    description: product.description ?? product.nom,
    sku:         product.reference,
    brand:       { "@type": "Brand", name: "Togolese Shop" },
    image:       rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${siteUrl}${rawUrl}`) : undefined,
    offers: {
      "@type":          "Offer",
      url:              `${siteUrl}/products/${product.reference}`,
      priceCurrency:    "XOF",
      price:            price,
      availability:     outOf
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller:           { "@type": "Organization", name: "Togolese Shop" },
    },
  };
  const imgSrc = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`
    : null;

  /* Variants */
  const variants: Variant[] = await apiGet<{ variants: Variant[] }>(
    `/api/admin/products/${product.id}/variants`
  ).then(r => r.variants).catch(() => []);
  const hasVariants = variants.length > 0;

  /* Related products (same category, excluding this one) */
  const related: Product[] = product.categorie_id
    ? await apiGet<{ data: Product[] }>(`/api/products?category=${product.categorie_id}&limit=5`, { noAuth: true })
        .then(r => r.data.filter(p => p.id !== product!.id).slice(0, 4))
        .catch(() => [])
    : [];

  /* Recommended products (manually linked) */
  const recommended = await getRelatedProductsWithDetails(product.id);

  /* Reviews */
  const reviews: Review[] = await apiGet<{ reviews: Review[] }>(
    `/api/reviews?produit_id=${product.id}`, { noAuth: true }
  ).then(r => r.reviews.filter(rv => rv.approved)).catch(() => []);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  /* Build RecentItem for tracker */
  const recentItem = {
    id:        product.id,
    reference: product.reference,
    nom:       product.nom,
    image_url: product.image_url,
    prix:      product.prix_unitaire,
    remise:    product.remise,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Track this product view (client-side, localStorage) */}
      <RecentViewTracker item={recentItem} />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-brand-700 transition-colors">Produits</Link>
            {product.categorie_nom && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/products?category=${product.categorie_id}`}
                  className="hover:text-brand-700 transition-colors"
                >
                  {product.categorie_nom}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-medium line-clamp-1">{product.nom}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Product main block ── */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mb-10">
          <div className="grid lg:grid-cols-2 gap-0">

            {/* Image column */}
            <div className="lg:rounded-l-3xl overflow-hidden border-r border-slate-100">
              <ProductImageGallerySimple
                images={allProductImages}
                productName={product.nom}
              />

              {/* Badges overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {isPromo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-500 text-white text-sm font-bold shadow-accent">
                    <Zap className="w-3.5 h-3.5" /> -{Math.round((product.remise / product.prix_unitaire) * 100)}%
                  </span>
                )}
                {product.neuf && !isPromo && (
                  <span className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-bold">
                    Nouveau
                  </span>
                )}
              </div>
            </div>

            {/* Info column */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col">

              {/* Marque ou catégorie + référence */}
              <div className="flex items-center justify-between mb-3">
                {product.marque_nom ? (
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
                    {product.marque_nom}
                  </span>
                ) : product.categorie_nom ? (
                  <Link href={`/products?category=${product.categorie_id}`}
                    className="text-xs font-bold uppercase tracking-widest text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    {product.categorie_nom}
                  </Link>
                ) : null}
                <span className="text-xs text-slate-400 font-mono">Réf. {product.reference}</span>
              </div>

              {/* Name */}
              <h1 className="font-display text-2xl sm:text-3xl font-800 text-slate-900 leading-tight mb-5">
                {product.nom}
              </h1>

              {/* Mini description */}
              {product.description && (
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {product.description.length > 160
                      ? product.description.slice(0, 160).trimEnd() + "…"
                      : product.description}
                  </p>
                </div>
              )}

              {hasVariants ? (
                /* Variant selector (handles price, stock, add-to-cart) */
                <ProductVariantSelector
                  product={product}
                  variants={variants}
                />
              ) : (
                <>
                  {/* Price */}
                  <div className="flex items-end gap-3 mb-1">
                    <span className="font-display text-3xl font-800 text-slate-900">
                      {formatPrice(price)}
                    </span>
                    {isPromo && (
                      <div className="flex flex-col">
                        <span className="text-base text-slate-400 line-through mb-0.5">
                          {formatPrice(product.prix_unitaire)}
                        </span>
                        <span className="text-xs font-bold text-accent-500 bg-accent-50 px-2 py-0.5 rounded-full">
                          -{Math.round((product.remise / product.prix_unitaire) * 100)}% · économisez {formatPrice(product.prix_unitaire - price)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Taxes incluses. Livraison calculée lors du paiement.</p>

                  {/* Stock badge */}
                  <div className="mb-6">
                    {outOf ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Rupture de stock
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Plus que {stockDisp} en stock !
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        En stock · Expédié sous 24h
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto">
                    <AddToCartButton product={product} />
                  </div>
                </>
              )}

              {/* Trust badges */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
                {[
                  { icon: Truck,       label: "Livraison rapide",        sub: "Lomé & tout le Togo" },
                  { icon: ShieldCheck, label: "Paiement à la livraison", sub: "Payez à la réception" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-brand-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Description complète ── */}
        {product.description && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 lg:p-10 mb-10">
            <h2 className="font-display text-xl font-800 text-slate-900 mb-4">Description du produit</h2>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* ── Avis clients ── */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 lg:p-10 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display text-xl font-800 text-slate-900">Avis clients</h2>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({reviews.length} avis)</span>
              </div>
            </div>
            <div className="space-y-4">
              {reviews.map(rv => (
                <div key={rv.id} className="border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-800">{rv.nom}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rv.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  {rv.comment && <p className="text-sm text-slate-600 leading-relaxed">{rv.comment}</p>}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(rv.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 sm:px-8 lg:px-10 py-5 border-b border-slate-100 bg-brand-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-brand-700" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-0.5">
                    Même catégorie
                  </p>
                  <h2 className="font-display text-lg font-800 text-slate-900 leading-tight">
                    Produits similaires
                  </h2>
                </div>
              </div>
              {product.categorie_id && (
                <Link href={`/products?category=${product.categorie_id}`}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors group"
                >
                  Voir tout <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                {related.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {product.categorie_id && (
                <div className="mt-6 sm:hidden">
                  <Link href={`/products?category=${product.categorie_id}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-brand-200 text-brand-700 font-bold text-sm hover:bg-brand-50 transition-colors"
                  >
                    Voir tous les produits similaires <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Recommended products ── */}
        {recommended.length > 0 && (
          <section className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-6 sm:px-8 lg:px-10 py-5 border-b border-amber-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">
                  Sélection pour vous
                </p>
                <h2 className="font-display text-lg font-800 text-slate-900 leading-tight">
                  Vous aimerez aussi
                </h2>
              </div>
            </div>
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                {recommended.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Vus récemment ── */}
      <RecentlyViewed excludeId={product.id} maxItems={6} />
    </div>
  );
}
