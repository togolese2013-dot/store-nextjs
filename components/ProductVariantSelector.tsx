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
  waText: string;
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.016-1.378l-.36-.214-3.72.846.862-3.636-.235-.373A9.775 9.775 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.423 0 9.818 4.396 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818z" />
  </svg>
);

export default function ProductVariantSelector({ product, variants, waText }: Props) {
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

  const dynamicWaText = selectedVariant
    ? encodeURIComponent(
        `Bonjour, je veux commander :\n*${product.nom}* — ${selectedVariant.nom}\n💰 Prix : ${formatPrice(selectedVariant.prix)}\n🔗 Réf : ${product.reference}\n\nPouvez-vous confirmer la disponibilité ?`
      )
    : waText;

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

        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${dynamicWaText}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-all hover:shadow-lg"
        >
          <WaIcon /> Commander sur WhatsApp
        </a>
      </div>
    </div>
  );
}
