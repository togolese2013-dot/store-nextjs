import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getProducts, finalPrice, formatPrice } from "@/lib/db";
import { getRelatedProductsWithDetails } from "@/lib/related-products";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageGallerySimple from "@/components/ProductImageGallerySimple";
import Image from "next/image";
import Link from "next/link";
import {
  Tag, Zap, ShieldCheck, Truck, ChevronRight,
  Star, Package, Share2, Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product  = await getProductBySlug(slug);
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

/* WhatsApp SVG icon */
const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.016-1.378l-.36-.214-3.72.846.862-3.636-.235-.373A9.775 9.775 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.423 0 9.818 4.396 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818z" />
  </svg>
);

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product  = await getProductBySlug(slug);

  if (!product) notFound();

  const price    = finalPrice(product);
  const isPromo  = product.remise > 0;
  const outOf    = product.stock_boutique === 0;
  const isLow    = product.stock_boutique > 0 && product.stock_boutique <= 5;

  /* Image src */
  const rawUrl = product.image_url || product.images?.[0] || null;
  const imgSrc = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`
    : null;

  const waText = encodeURIComponent(
    `Bonjour, je veux commander :\n*${product.nom}*\n💰 Prix : ${formatPrice(price)}\n🔗 Réf : ${product.reference}\n\nPouvez-vous confirmer la disponibilité ?`
  );

  /* Related products (same category, excluding this one) */
  const related = product.categorie_id
    ? (await getProducts({ categoryId: product.categorie_id, limit: 5 }))
        .filter(p => p.id !== product.id)
        .slice(0, 4)
    : [];

  /* Recommended products (manually linked) */
  const recommended = await getRelatedProductsWithDetails(product.id);

  return (
    <div className="min-h-screen bg-slate-50">
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-500 text-white text-sm font-bold shadow-accent">
                    <Zap className="w-3.5 h-3.5" /> -{product.remise}%
                  </span>
                )}
                {product.neuf && !isPromo && (
                  <span className="px-3 py-1.5 rounded-full bg-brand-900 text-white text-sm font-bold">
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

              {/* Rating (static) */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium">5.0 · 12 avis</span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-6">
                <span className={`font-display text-4xl font-800 ${isPromo ? "text-accent-500" : "text-brand-900"}`}>
                  {formatPrice(price)}
                </span>
                {isPromo && (
                  <div className="flex flex-col">
                    <span className="text-lg text-slate-400 line-through mb-0.5">
                      {formatPrice(product.prix_unitaire)}
                    </span>
                    <span className="text-xs font-bold text-accent-500 bg-accent-50 px-2 py-0.5 rounded-full">
                      Vous économisez {formatPrice(product.prix_unitaire - price)}
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
                    Plus que {product.stock_boutique} en stock !
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    En stock · Expédié sous 24h
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <AddToCartButton product={product} />

                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${waText}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-all hover:shadow-lg"
                >
                  <WaIcon /> Commander sur WhatsApp
                </a>
              </div>

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
