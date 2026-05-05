"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Zap } from "lucide-react";
import RatingBadge from "@/components/RatingBadge";
import { clsx } from "clsx";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

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
  floatingCart?: boolean;
}

export default function ProductCard({ product, className, floatingCart = false }: Props) {
  const { addItem } = useCart();
  const [liked, setLiked]   = useState(false);
  const [added, setAdded]   = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [imgOk,  setImgOk]  = useState(false);

  useEffect(() => {
    setLiked(getWishlist().includes(product.id));
  }, [product.id]);

  const price           = finalPrice(product);
  const discountPercent = product.prix_unitaire > 0
    ? Math.round((Math.min(product.remise, product.prix_unitaire) / product.prix_unitaire) * 100)
    : 0;
  const isPromo = product.remise > 0 && discountPercent > 0;
  const outOf   = product.stock_boutique === 0;
  const createdAt = product.date_creation ? new Date(product.date_creation) : null;
  const isNew = Boolean(
    product.neuf &&
    createdAt &&
    Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000
  );

  const rawUrl = product.image_url || product.images?.[0] || null;
  const imgSrc = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOf) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wl   = getWishlist();
    const next = liked
      ? wl.filter(id => id !== product.id)
      : [...wl, product.id];
    saveWishlist(next);
    setLiked(!liked);
    window.dispatchEvent(new Event("wishlist-updated"));
  };

  return (
    <article
      className={clsx(
        "group relative bg-white rounded-[20px] overflow-hidden border border-[rgba(20,83,45,0.06)]",
        "shadow-[0_1px_4px_rgba(20,83,45,0.06)] hover:shadow-[0_8px_24px_rgba(20,83,45,0.11)]",
        "transition-all duration-200 hover:-translate-y-0.5",
        className
      )}
    >
      {/* ── Image ── */}
      <Link href={`/products/${product.id}`} className="block relative" tabIndex={-1}>
        <div className="relative overflow-hidden bg-[#f8fafb] aspect-square">

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
                "object-contain p-2 transition-all duration-300 group-hover:scale-[1.03]",
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

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/4 transition-colors duration-200" />

          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {isPromo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-500 text-white text-[10px] font-bold shadow-sm">
                <Zap className="w-2.5 h-2.5" /> -{discountPercent}%
              </span>
            )}
            {isNew && !isPromo && (
              <span className="px-2 py-0.5 rounded-md bg-brand-600 text-white text-[10px] font-bold">
                Nouveau
              </span>
            )}
            {outOf && (
              <span className="px-2 py-0.5 rounded-md bg-slate-400 text-white text-[10px] font-semibold">
                Rupture
              </span>
            )}
          </div>

          {/* Wishlist — top-right */}
          <button
            onClick={toggleWishlist}
            aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={clsx(
              "absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center",
              "bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              liked ? "text-red-500 opacity-100" : "text-slate-400"
            )}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
          </button>

          {/* Floating cart — bottom-right */}
          {floatingCart && !outOf && (
            <button
              onClick={handleAdd}
              aria-label="Ajouter au panier"
              className={clsx(
                "absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
                "shadow-md transition-all duration-200 active:scale-90",
                "opacity-0 group-hover:opacity-100",
                added
                  ? "bg-green-500 text-white"
                  : "bg-brand-900 text-white hover:bg-brand-700"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Link>

      {/* ── Content ── */}
      <div className="p-3">
        {/* Marque */}
        {(product.marque_nom || product.categorie_nom) && (
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-brand-700 mb-0.5 truncate">
            {product.marque_nom ?? product.categorie_nom}
          </p>
        )}

        {/* Nom */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-sans text-[13px] font-medium text-slate-800 leading-snug mb-1.5 line-clamp-2 hover:text-brand-800 transition-colors">
            {product.nom}
          </h3>
        </Link>

        {/* Rating */}
        <RatingBadge productId={product.id} />

        {/* Prix + bouton panier */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex flex-col min-w-0">
            <span className={clsx(
              "font-display font-bold text-[15px] tracking-tight leading-tight",
              isPromo ? "text-accent-600" : "text-slate-900"
            )}>
              {formatPrice(price)}
            </span>
            {isPromo && (
              <span className="text-[10px] text-slate-400 line-through leading-tight">
                {formatPrice(product.prix_unitaire)}
              </span>
            )}
          </div>

          {!floatingCart && (
            <button
              onClick={handleAdd}
              disabled={outOf}
              aria-label={outOf ? "Indisponible" : added ? "Ajouté" : "Ajouter au panier"}
              className={clsx(
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                outOf
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : added
                    ? "bg-green-500 text-white shadow-[0_4px_10px_rgba(34,197,94,0.35)]"
                    : "bg-brand-900 text-white hover:bg-brand-800 shadow-[0_4px_10px_rgba(20,83,45,0.22)]"
              )}
            >
              {added
                ? <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>
                : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              }
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
