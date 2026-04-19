"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { type Product } from "@/lib/utils";

const WL_KEY = "ts_wishlist";

function getWishlistIds(): number[] {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || "[]"); } catch { return []; }
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    const ids = getWishlistIds();
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }

    try {
      const res  = await fetch(`/api/products?ids=${ids.join(",")}`);
      const data = await res.json();
      // Keep wishlist order
      const list = (data.data ?? data.products ?? []) as Product[];
      const map  = new Map<number, Product>(list.map((p: Product) => [p.id, p]));
      setProducts(ids.map(id => map.get(id)).filter(Boolean) as Product[]);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/products" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continuer mes achats
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
            <h1 className="font-display text-2xl font-800 text-slate-900">
              Mes favoris
              {!loading && products.length > 0 && (
                <span className="ml-2 text-base font-600 text-slate-400">({products.length})</span>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-slate-100" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-xl font-700 text-slate-900 mb-2">Aucun favori pour l'instant</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Cliquez sur le cœur ❤ sur les produits pour les sauvegarder ici.
            </p>
            <Link
              href="/products"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Découvrir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
