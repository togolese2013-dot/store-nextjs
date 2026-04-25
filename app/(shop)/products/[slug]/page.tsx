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
import StickyCartBar from "@/components/StickyCartBar";
import CollapsibleText from "@/components/CollapsibleText";
import Link from "next/link";
import {
  Zap, ShieldCheck, Truck, ChevronRight,
  Sparkles, Star, Package, RotateCcw,
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

  const price     = finalPrice(product);
  const isPromo   = product.remise > 0;
  const stockDisp = product.stock_magasin > 0 ? product.stock_magasin : product.stock_boutique;
  const outOf     = stockDisp === 0;
  const isLow     = stockDisp > 0 && stockDisp <= 5;

  const allProductImages: string[] = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images ?? []).filter(url => url && url !== product.image_url),
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://store-nextjs-production.up.railway.app";
  const rawUrl  = product.image_url || product.images?.[0] || null;
  const jsonLd  = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:        product.nom,
    description: product.description ?? product.nom,
    sku:         product.reference,
    brand:       { "@type": "Brand", name: "Togolese Shop" },
    image:       rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${siteUrl}${rawUrl}`) : undefined,
    offers: {
      "@type":       "Offer",
      url:           `${siteUrl}/products/${product.reference}`,
      priceCurrency: "XOF",
      price,
      availability:  outOf ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller:        { "@type": "Organization", name: "Togolese Shop" },
    },
  };

  const variants: Variant[] = await apiGet<{ variants: Variant[] }>(
    `/api/admin/products/${product.id}/variants`
  ).then(r => r.variants).catch(() => []);
  const hasVariants = variants.length > 0;

  const related: Product[] = product.categorie_id
    ? await apiGet<{ data: Product[] }>(`/api/products?category=${product.categorie_id}&limit=5`, { noAuth: true })
        .then(r => r.data.filter(p => p.id !== product!.id).slice(0, 4))
        .catch(() => [])
    : [];

  const recommended = await getRelatedProductsWithDetails(product.id);

  const reviews: Review[] = await apiGet<{ reviews: Review[] }>(
    `/api/reviews?produit_id=${product.id}`, { noAuth: true }
  ).then(r => r.reviews.filter(rv => rv.approved)).catch(() => []);
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const recentItem = {
    id:        product.id,
    reference: product.reference,
    nom:       product.nom,
    image_url: product.image_url,
    prix:      product.prix_unitaire,
    remise:    product.remise,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <RecentViewTracker item={recentItem} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Breadcrumb compact ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1 text-xs text-slate-400 flex-wrap">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/products" className="hover:text-brand-700 transition-colors">Produits</Link>
            {product.categorie_nom && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/products?category=${product.categorie_id}`} className="hover:text-brand-700 transition-colors">
                  {product.categorie_nom}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 line-clamp-1">{product.nom}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* ── Image block ── */}
        <div className="relative mb-6">
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {isPromo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-500 text-white text-xs font-bold shadow-sm">
                <Zap className="w-3 h-3" /> -{Math.round((product.remise / product.prix_unitaire) * 100)}%
              </span>
            )}
            {product.neuf && !isPromo && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">Nouveau</span>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
            <ProductImageGallerySimple images={allProductImages} productName={product.nom} />
          </div>
        </div>

        {/* ── Info block ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7 mb-6">
          <div className="flex flex-col gap-0">

            {/* Brand / category + ref */}
            <div className="flex items-center justify-between mb-2">
              {product.marque_nom ? (
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600">{product.marque_nom}</span>
              ) : product.categorie_nom ? (
                <Link href={`/products?category=${product.categorie_id}`}
                  className="text-xs font-bold uppercase tracking-widest text-brand-600 hover:text-brand-800 transition-colors">
                  {product.categorie_nom}
                </Link>
              ) : <span />}
              <span className="text-xs text-slate-400 font-mono">Réf. {product.reference}</span>
            </div>

            {/* Product name */}
            <h1 className="font-display text-2xl sm:text-3xl font-800 text-slate-900 leading-tight mb-3">
              {product.nom}
            </h1>

            {/* Star rating (if reviews) */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({reviews.length} avis)</span>
              </div>
            )}

            {hasVariants ? (
              <ProductVariantSelector product={product} variants={variants} />
            ) : (
              <>
                {/* Price block */}
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-end gap-3 mb-1">
                    <span className="font-display text-3xl font-800 text-slate-900">{formatPrice(price)}</span>
                    {isPromo && (
                      <span className="text-base text-slate-400 line-through mb-0.5">{formatPrice(product.prix_unitaire)}</span>
                    )}
                  </div>
                  {isPromo && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full mb-1">
                      Économisez {formatPrice(product.prix_unitaire - price)}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Taxes incluses · Livraison calculée à la commande</p>
                </div>

                {/* Stock badge */}
                <div className="mb-4">
                  {outOf ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Rupture de stock
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Plus que {stockDisp} en stock !
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> En stock · Expédié sous 24h
                    </span>
                  )}
                </div>

                {/* Short description */}
                {product.description && (
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Trust badges row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: Truck,       label: "Livraison rapide",         sub: "Lomé & tout le Togo" },
                    { icon: ShieldCheck, label: "Paiement à la livraison",  sub: "Payez à la réception" },
                    { icon: Package,     label: "Emballage soigné",          sub: "Produit bien protégé" },
                    { icon: RotateCcw,   label: "Retours 7 jours",           sub: "Satisfait ou remboursé" },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                      <Icon className="w-4 h-4 text-brand-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{label}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add to cart — bottom of info block */}
                <AddToCartButton product={product} />
              </>
            )}
          </div>
        </div>

        {/* ── Description complète — collapsible on mobile ── */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7 mb-6">
            <h2 className="font-display text-lg font-800 text-slate-900 mb-3">Description</h2>
            <div className="hidden sm:block prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
            {/* Collapsible on mobile */}
            <div className="sm:hidden">
              <CollapsibleText text={product.description} maxLines={4} />
            </div>
          </div>
        )}

        {/* ── Avis clients ── */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-lg font-800 text-slate-900">Avis clients</h2>
              <div className="flex items-center gap-1 ml-auto">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                ))}
                <span className="ml-1.5 text-sm font-semibold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400 ml-1">({reviews.length})</span>
              </div>
            </div>
            <div className="space-y-3">
              {reviews.map(rv => (
                <div key={rv.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-800">{rv.nom}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rv.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  {rv.comment && <p className="text-sm text-slate-600 leading-relaxed">{rv.comment}</p>}
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(rv.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Produits similaires ── */}
        {related.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-800 text-slate-900">Produits similaires</h2>
              {product.categorie_id && (
                <Link href={`/products?category=${product.categorie_id}`}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors">
                  Voir tout →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── Vous aimerez aussi ── */}
        {recommended.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="font-display text-lg font-800 text-slate-900">Vous aimerez aussi</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {recommended.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky cart bar — mobile only, appears after scroll */}
      <StickyCartBar product={product} outOf={outOf} />
    </div>
  );
}
