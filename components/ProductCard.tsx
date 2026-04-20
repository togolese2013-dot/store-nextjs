"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Zap } from "lucide-react";
import { clsx } from "clsx";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";

const WL_KEY = "ts_wishlist";

function getWishlist(): number[] {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || "[]"); } catch { return []; }
}
function saveWishlist(ids: number[]) {
  try { localStorage.setItem(WL_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: Props) {
  const [liked, setLiked]   = useState(false);
  const [added, setAdded]   = useState(false);

  /* Sync wishlist state from localStorage after mount */
  useEffect(() => {
    setLiked(getWishlist().includes(product.id));
  }, [product.id]);
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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOf) return;
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
        "group relative bg-white rounded-2xl overflow-hidden transition-all duration-300",
        "border border-slate-100 hover:border-brand-200",
        "hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {/* ── Image — square format ── */}
      <Link href={`/products/${product.reference}`} className="block relative" tabIndex={-1}>
        <div className="relative overflow-hidden bg-slate-50 aspect-square">

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
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isPromo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-500 text-white text-xs font-bold shadow-sm">
              <Zap className="w-3 h-3" /> -{Math.round((product.remise / product.prix_unitaire) * 100)}%
            </span>
          )}
          {product.neuf && !isPromo && (
            <span className="px-2.5 py-1 rounded-md bg-brand-500 text-white text-xs font-bold">
              Nouveau
            </span>
          )}
          {outOf && (
            <span className="px-2.5 py-1 rounded-md bg-slate-400 text-white text-xs font-semibold">
              Rupture
            </span>
          )}
        </div>

        {/* Wishlist top-right */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            const wl  = getWishlist();
            const next = liked
              ? wl.filter(id => id !== product.id)
              : [...wl, product.id];
            saveWishlist(next);
            setLiked(!liked);
            window.dispatchEvent(new Event("wishlist-updated"));
          }}
          aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={clsx(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm border border-white shadow-sm",
            "transition-all duration-200 hover:scale-110",
            liked ? "text-red-500" : "text-slate-400 hover:text-red-400"
          )}
        >
          <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
        </button>
      </Link>

      {/* ── Content ── */}
      <div className="p-3.5">

        {/* Category */}
        {product.categorie_nom && (
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">
            {product.categorie_nom}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.reference}`}>
          <h3 className="font-sans text-sm text-slate-700 leading-snug mb-2.5 line-clamp-2 hover:text-brand-800 transition-colors">
            {product.nom}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-end gap-2 mb-3">
          <span className="font-display font-semibold text-base text-slate-900">
            {formatPrice(price)}
          </span>
          {isPromo && (
            <span className="text-xs text-slate-400 line-through mb-0.5">
              {formatPrice(product.prix_unitaire)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={outOf}
          className={clsx(
            "w-full flex items-center justify-center py-2.5 rounded-xl transition-all duration-200",
            "font-sans text-xs font-medium sm:text-sm sm:font-bold sm:gap-2",
            outOf
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : added
                ? "bg-brand-600 text-white scale-95"
                : "bg-brand-900 text-white hover:bg-brand-800 hover:shadow-brand active:scale-95"
          )}
        >
          <ShoppingBag className="hidden sm:block w-4 h-4" />
          {outOf ? "Indisponible" : added ? "Ajouté ✓" : "Ajouter au panier"}
        </button>
      </div>
    </article>
  );
}
