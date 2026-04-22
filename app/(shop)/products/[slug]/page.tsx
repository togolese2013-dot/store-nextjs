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
import Image from "next/image";
import Link from "next/link";
import {
  Tag, Zap, ShieldCheck, Truck, ChevronRight,
  Sparkles,
} from "lucide-react";

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

  /* Image src */
  const rawUrl = product.image_url || product.images?.[0] || null;

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

  return (
    <div className="min-h-screen bg-slate-50">
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
            <div className="lg:rounded-l-3xl overflow-hidden">
              <ProductImageGallerySimple 
                images={product.images || []}
                productName={product.nom}
                defaultImage={imgSrc}
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

              {/* Category + reference */}
              <div className="flex items-center justify-between mb-3">
                {product.categorie_nom && (
                  <Link href={`/products?category=${product.categorie_id}`}
                    className="text-xs font-bold uppercase tracking-widest text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    {product.categorie_nom}
                  </Link>
                )}
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
                  <div className="flex items-end gap-3 mb-6">
                    <span className="font-display text-4xl font-800 text-slate-900">
                      {formatPrice(price)}
                    </span>
                    {isPromo && (
                      <div className="flex flex-col">
                        <span className="text-lg text-slate-400 line-through mb-0.5">
                          {formatPrice(product.prix_unitaire)}
                        </span>
                        <span className="text-xs font-bold text-accent-500 bg-accent-50 px-2 py-0.5 rounded-full">
                          -{Math.round((product.remise / product.prix_unitaire) * 100)}% · économisez {formatPrice(product.prix_unitaire - price)}
                        </span>
                      </div>
                    )}
                  </div>

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
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
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

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-800 text-slate-900">Produits similaires</h2>
              {product.categorie_id && (
                <Link href={`/products?category=${product.categorie_id}`}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                >
                  Voir tout →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── Recommended products ── */}
        {recommended.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-xl font-800 text-slate-900">Vous aimerez aussi</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {recommended.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
