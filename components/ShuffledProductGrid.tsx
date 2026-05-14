"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";

export default function ShuffledProductGrid({ products }: { products: Product[] }) {
  const shuffled = useMemo(() => {
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [products]);

  if (!shuffled.length) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="font-display text-lg">Aucun produit disponible pour l'instant</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {shuffled.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
