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
}

export default function ProductCard({ product, className }: Props) {
  const { addItem } = useCart();
  const [liked, setLiked]   = useState(false);
  const [added, setAdded]   = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [imgOk, setImgOk]   = useState(false);

  useEffect(() => {
    setLiked(getWishlist().includes(product.id));
  }, [product.id]);

  const price   = finalPrice(product);
  const isPromo = product.remise > 0;
  const outOf   = product.stock_boutique === 0;

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

  return (
    <article
      className={clsx(
        "group relative bg-white rounded-2xl overflow-hidden",
        "shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
    >
      {/* ── Image — portrait 4:5 ── */}
      <Link href={`/products/${product.id}`} className="block relative" tabIndex={-1}>
        <div className="relative overflow-hidden bg-slate-50 aspect-[4/5]">

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

          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Badges top-left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {isPromo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-500 text-white text-[10px] font-bold shadow-sm">
                <Zap className="w-2.5 h-2.5" /> -{Math.round((product.remise / product.prix_unitaire) * 100)}%
              </span>
            )}
            {product.neuf && !isPromo && (
              <span className="px-2 py-0.5 rounded-md bg-brand-500 text-white text-[10px] font-bold">
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
              "absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center",
              "bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200",
              liked ? "text-red-500" : "text-slate-400"
            )}
          >
            <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
          </button>

          {/* Floating cart button — bottom-right */}
          {!outOf && (
            <button
              onClick={handleAdd}
              aria-label="Ajouter au panier"
              className={clsx(
                "absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
                "shadow-md transition-all duration-200 active:scale-90",
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
        <Link href={`/products/${product.id}`}>
          <h3 className="font-sans text-sm text-slate-800 leading-snug mb-1 line-clamp-2 hover:text-brand-800 transition-colors">
            {product.nom}
          </h3>
        </Link>

        <RatingBadge productId={product.id} />

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="font-display font-bold text-base text-slate-900">
            {formatPrice(price)}
          </span>
          {isPromo && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.prix_unitaire)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
