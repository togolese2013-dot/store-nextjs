"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { SelectedVariant } from "@/context/CartContext";
import type { Product } from "@/lib/utils";
import { clsx } from "clsx";
import Link from "next/link";

interface Props {
  product: Product;
  variant?: SelectedVariant;
  stock?: number;  // override product stock when a variant is selected
}

export default function AddToCartButton({ product, variant, stock }: Props) {
  const { addItem } = useCart();
  const [qty,   setQty]   = useState(1);
  const [added, setAdded] = useState(false);

  const effectiveStock = stock !== undefined ? stock : product.stock_boutique;
  const outOf = effectiveStock === 0;

  const handleAdd = () => {
    if (outOf) return;
    addItem(product, qty, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (outOf) {
    return (
      <button disabled
        className="flex-1 flex items-center justify-center py-2.5 rounded-md bg-slate-100 text-slate-400 font-sans text-xs font-medium cursor-not-allowed"
      >
        Indisponible
      </button>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* Quantity + Add to cart — same row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-600 shrink-0">Quantité :</span>
        <div className="flex items-center gap-2 border-2 border-slate-200 rounded-2xl px-1 shrink-0">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Diminuer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-slate-900">{qty}</span>
          <button
            onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Augmenter"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleAdd}
          className={clsx(
            "flex-1 min-w-[140px] flex items-center justify-center py-2.5 rounded-md font-sans font-medium text-xs transition-all duration-200",
            added
              ? "bg-green-500 text-white scale-[0.98]"
              : "bg-brand-900 text-white hover:bg-brand-800 hover:shadow-brand active:scale-[0.98]"
          )}
        >
          {added ? "Ajouté au panier ✓" : "Ajouter au panier"}
        </button>

        {added && (
          <Link href="/cart"
            className="px-3 py-2.5 rounded-md border-2 border-brand-200 text-brand-700 font-bold text-xs hover:bg-brand-50 transition-colors whitespace-nowrap"
          >
            Voir le panier →
          </Link>
        )}
      </div>
    </div>
  );
}
