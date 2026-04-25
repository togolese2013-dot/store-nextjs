"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { clsx } from "clsx";
import { useCart } from "@/context/CartContext";
import { type Product, finalPrice, formatPrice } from "@/lib/utils";

interface Props {
  product: Product;
  outOf: boolean;
}

export default function StickyCartBar({ product, outOf }: Props) {
  const { addItem } = useCart();
  const [visible, setVisible] = useState(false);
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleAdd = () => {
    if (outOf) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const price  = finalPrice(product);
  const imgSrc = product.image_url
    ? product.image_url.startsWith("http")
      ? product.image_url
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${product.image_url}`
    : null;

  return (
    <div className={clsx(
      "lg:hidden fixed left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
      "transition-transform duration-300",
      visible ? "translate-y-0" : "translate-y-full",
      "bottom-0"
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        {imgSrc && (
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            <Image src={imgSrc} alt={product.nom} width={40} height={40} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{product.nom}</p>
          <p className="text-sm font-bold text-slate-900">{formatPrice(price)}</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={outOf}
          className={clsx(
            "shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
            outOf
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : added
                ? "bg-green-500 text-white"
                : "bg-brand-900 text-white hover:bg-brand-800 active:scale-95"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          {outOf ? "Indisponible" : added ? "Ajouté ✓" : "Panier"}
        </button>
      </div>
    </div>
  );
}
