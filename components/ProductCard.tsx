"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Star, Zap } from "lucide-react";
import { clsx } from "clsx";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";

/* WhatsApp icon SVG */
const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.016-1.378l-.36-.214-3.72.846.862-3.636-.235-.373A9.775 9.775 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.423 0 9.818 4.396 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818z" />
  </svg>
);

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: Props) {
  const [liked, setLiked]   = useState(false);
  const [added, setAdded]   = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [imgOk, setImgOk]   = useState(false);

  const price   = finalPrice(product);
  const isPromo = product.remise > 0;
  const outOf   = product.stock_boutique === 0;
  const isLow   = product.stock_boutique > 0 && product.stock_boutique <= 5;

  const rawUrl = product.image_url || product.images?.[0] || null;
  const imgSrc = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`
    : null;

  const waText = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par : *${product.nom}*\n💰 Prix : ${formatPrice(price)}\n🔗 Réf : ${product.reference}`
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOf) return;
    // Cart stored in localStorage, read by Header via storage event
    try {
      const cart = JSON.parse(localStorage.getItem("ts_cart") || "[]") as Array<Product & { qty: number }>;
      const idx = cart.findIndex(i => i.id === product.id);
      if (idx >= 0) cart[idx].qty += 1;
      else cart.push({ ...product, qty: 1 });
      localStorage.setItem("ts_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
    } catch { /* ignore storage errors */ }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article
      className={clsx(
        "group relative bg-white rounded-3xl overflow-hidden transition-all duration-300",
        "border border-slate-100 hover:border-brand-100",
        "hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {/* ── Image ── */}
      <Link href={`/products/${product.reference}`} className="block relative" tabIndex={-1}>
        <div className="relative overflow-hidden bg-slate-50" style={{ paddingTop: "72%" }}>

          {/* Skeleton */}
          {!imgOk && !imgErr && (
            <div className="absolute inset-0 animate-shimmer" />
          )}

          {/* Image */}
          {imgSrc && !imgErr ? (
            <Image
              src={imgSrc} alt={product.nom}
              fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
              className={clsx(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                imgOk ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImgOk(true)}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
              <ShoppingBag className="w-10 h-10" strokeWidth={1} />
              <span className="text-xs font-medium">Photo bientôt disponible</span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isPromo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500 text-white text-xs font-bold shadow-accent">
              <Zap className="w-3 h-3" /> -{product.remise}%
            </span>
          )}
          {product.neuf && !isPromo && (
            <span className="px-2.5 py-1 rounded-full bg-brand-900 text-white text-xs font-bold">
              Nouveau
            </span>
          )}
          {isLow && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
              {product.stock_boutique} restants
            </span>
          )}
          {outOf && (
            <span className="px-2.5 py-1 rounded-full bg-slate-400 text-white text-xs font-semibold">
              Rupture
            </span>
          )}
        </div>

        {/* Wishlist top-right */}
        <button
          onClick={e => { e.preventDefault(); setLiked(!liked); }}
          aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={clsx(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm border border-white shadow-sm",
            "transition-all duration-200 hover:scale-110",
            liked ? "text-red-500" : "text-slate-400 hover:text-red-400"
          )}
        >
          <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
        </button>
      </Link>

      {/* ── Content ── */}
      <div className="p-4">

        {/* Category */}
        {product.categorie_nom && (
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">
            {product.categorie_nom}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.reference}`}>
          <h3 className="font-display font-700 text-base text-slate-900 leading-snug mb-3 line-clamp-2 hover:text-brand-900 transition-colors">
            {product.nom}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-end gap-2 mb-4">
          <span className={clsx(
            "font-display font-800 text-xl",
            isPromo ? "text-accent-500" : "text-brand-900"
          )}>
            {formatPrice(price)}
          </span>
          {isPromo && (
            <span className="text-sm text-slate-400 line-through mb-0.5">
              {formatPrice(product.prix_unitaire)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={outOf}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200",
              outOf
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : added
                  ? "bg-green-500 text-white scale-95"
                  : "bg-brand-900 text-white hover:bg-brand-800 hover:shadow-brand active:scale-95"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            {outOf ? "Indisponible" : added ? "Ajouté ✓" : "Ajouter"}
          </button>

          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${waText}`}
            target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            aria-label="Commander via WhatsApp"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#25D366] text-white hover:bg-[#1da851] transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 shrink-0"
          >
            <WaIcon />
          </a>
        </div>
      </div>
    </article>
  );
}
