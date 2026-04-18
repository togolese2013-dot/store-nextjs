"use client";

import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/utils";
import AddToCartButton from "@/components/AddToCartButton";

export interface Variant {
  id: number;
  produit_id: number;
  nom: string;
  options: Record<string, string>;
  prix: number;
  stock: number;
  reference_sku: string | null;
}

interface Props {
  product: Product;
  variants: Variant[];
  waText?: string;
}

export default function ProductVariantSelector({ product, variants }: Props) {
  // Compute axes: { Taille: ["XS","S","M","L"], Couleur: ["Rouge","Bleu"] }
  const axes = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const v of variants) {
      for (const [key, val] of Object.entries(v.options)) {
        if (!result[key]) result[key] = [];
        if (!result[key].includes(val)) result[key].push(val);
      }
    }
    return result;
  }, [variants]);

  const axisNames = Object.keys(axes);

  // Current selection: { Taille: "M", Couleur: "Rouge" }
  const [selection, setSelection] = useState<Record<string, string>>({});

  // Find the variant that matches the full selection
  const selectedVariant = useMemo(() => {
    if (axisNames.length === 0) return null;
    return (
      variants.find((v) =>
        axisNames.every((axis) => v.options[axis] === selection[axis])
      ) ?? null
    );
  }, [variants, selection, axisNames]);

  const isComplete = axisNames.every((axis) => !!selection[axis]);

  // Price to display
  const displayPrice = selectedVariant
    ? selectedVariant.prix
    : variants.length > 0
    ? Math.min(...variants.map((v) => v.prix))
    : product.prix_unitaire;

  const priceLabel = !isComplete && variants.length > 0 ? "À partir de" : null;

  // Stock
  const displayStock = selectedVariant ? selectedVariant.stock : null;
  const outOf = isComplete && displayStock === 0;
  const isLow = isComplete && displayStock !== null && displayStock > 0 && displayStock <= 5;

  // Check if a value is available given current partial selection
  function isAvailable(axis: string, value: string): boolean {
    const testSelection = { ...selection, [axis]: value };
    const testAxes = axisNames.filter((a) => a !== axis);
    return variants.some((v) =>
      v.options[axis] === value &&
      testAxes.every((a) => !testSelection[a] || v.options[a] === testSelection[a])
    );
  }

  const variantForWa = selectedVariant
    ? { id: selectedVariant.id, nom: selectedVariant.nom, prix: selectedVariant.prix }
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      <div className="flex items-end gap-3">
        {priceLabel && (
          <span className="text-sm text-slate-400 mb-1">{priceLabel}</span>
        )}
        <span className="font-display text-4xl font-800 text-brand-900">
          {formatPrice(displayPrice)}
        </span>
      </div>

      {/* Stock badge */}
      {isComplete ? (
        <div>
          {outOf ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Rupture de stock
            </span>
          ) : isLow ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Plus que {displayStock} en stock !
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              En stock · Expédié sous 24h
            </span>
          )}
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-50 text-brand-700 text-sm font-semibold border border-brand-100">
          Sélectionnez vos options
        </span>
      )}

      {/* Option axes */}
      {axisNames.map((axis) => (
        <div key={axis}>
          <p className="text-sm font-bold text-slate-700 mb-2">
            {axis}
            {selection[axis] ? (
              <span className="ml-2 font-normal text-brand-700">: {selection[axis]}</span>
            ) : (
              <span className="ml-2 font-normal text-slate-400">— non sélectionné</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {axes[axis].map((val) => {
              const available = isAvailable(axis, val);
              const active = selection[axis] === val;
              return (
                <button
                  key={val}
                  onClick={() =>
                    setSelection((s) =>
                      active ? { ...s, [axis]: "" } : { ...s, [axis]: val }
                    )
                  }
                  disabled={!available}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    active
                      ? "border-brand-900 bg-brand-900 text-white"
                      : available
                      ? "border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-900"
                      : "border-slate-100 text-slate-300 cursor-not-allowed line-through"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isComplete && selectedVariant ? (
          <AddToCartButton
            product={product}
            variant={variantForWa}
            stock={selectedVariant.stock}
          />
        ) : (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed"
          >
            Choisissez vos options
          </button>
        )}
      </div>
    </div>
  );
}
