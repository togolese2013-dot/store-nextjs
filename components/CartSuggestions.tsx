"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ShoppingCart, ArrowRight } from "lucide-react";
import { finalPrice, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function resolveImg(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

function SuggestionCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const price   = finalPrice(product);
  const isPromo = product.remise > 0;
  const imgSrc  = resolveImg(product.image_url);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 flex gap-3 hover:border-brand-200 hover:shadow-sm transition-all group">
      {/* Image */}
      <Link
        href={`/products/${product.reference}`}
        className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden relative shrink-0"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.nom}
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <ShoppingCart className="w-5 h-5" strokeWidth={1} />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.reference}`}>
          <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1 group-hover:text-brand-800 transition-colors">
            {product.nom}
          </p>
        </Link>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-800 font-display ${isPromo ? "text-accent-500" : "text-brand-900"}`}>
              {formatPrice(price)}
            </span>
            {isPromo && (
              <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.prix_unitaire)}</span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="shrink-0 w-7 h-7 rounded-full bg-brand-900 hover:bg-brand-700 text-white flex items-center justify-center transition-colors"
            aria-label={`Ajouter ${product.nom} au panier`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartSuggestions({ excludeIds = [] }: { excludeIds?: number[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/products?limit=8`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const all: Product[] = json?.data ?? [];
        const filtered = all.filter(p => !excludeIds.includes(p.id)).slice(0, 4);
        setProducts(filtered);
      })
      .catch(() => {/* silent */})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-5 w-40 bg-slate-100 rounded-full animate-pulse mb-4" />
        <div className="space-y-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 flex gap-3 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                <div className="h-3 bg-slate-100 rounded-full w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-display font-800 text-slate-800 text-sm">Vous aimerez aussi</span>
        </div>
        <Link href="/products"
          className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {products.map(p => (
          <SuggestionCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
