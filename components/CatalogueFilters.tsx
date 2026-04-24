"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Category } from "@/lib/utils";
import {
  SlidersHorizontal, Search, Tag, Sparkles, X, ChevronDown, Check,
  Package, DollarSign,
} from "lucide-react";
import { clsx } from "clsx";

interface Props {
  categories:         Category[];
  currentCategoryId?: number;
  currentSearch?:     string;
  promoOnly:          boolean;
  newOnly:            boolean;
  inStock?:           boolean;
  minPrice?:          number;
  maxPrice?:          number;
  mobileOnly?:        boolean;
}

function FilterPanel({
  categories, currentCategoryId, currentSearch,
  promoOnly, newOnly, inStock: initInStock,
  minPrice: initMin, maxPrice: initMax,
  onClose,
}: Omit<Props, "mobileOnly"> & { onClose?: () => void }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [q,        setQ]       = useState(currentSearch ?? "");
  const [catId,    setCatId]   = useState<number | undefined>(currentCategoryId);
  const [promo,    setPromo]   = useState(promoOnly);
  const [isNew,    setIsNew]   = useState(newOnly);
  const [stock,    setStock]   = useState(initInStock ?? false);
  const [minP,     setMinP]    = useState(initMin != null ? String(initMin) : "");
  const [maxP,     setMaxP]    = useState(initMax != null ? String(initMax) : "");

  function apply() {
    const sp = new URLSearchParams();
    if (q.trim())  sp.set("q", q.trim());
    if (catId)     sp.set("category", String(catId));
    if (promo)     sp.set("promo", "true");
    if (isNew)     sp.set("new", "true");
    if (stock)     sp.set("inStock", "true");
    const minNum = Number(minP.replace(/\s/g, ""));
    const maxNum = Number(maxP.replace(/\s/g, ""));
    if (minP.trim() && !isNaN(minNum) && minNum > 0) sp.set("minPrice", String(minNum));
    if (maxP.trim() && !isNaN(maxNum) && maxNum > 0) sp.set("maxPrice", String(maxNum));
    const qs = sp.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
    onClose?.();
  }

  function reset() {
    setQ(""); setCatId(undefined); setPromo(false);
    setIsNew(false); setStock(false); setMinP(""); setMaxP("");
    router.push("/products");
    onClose?.();
  }

  const dirty = q.trim() !== (currentSearch ?? "") ||
    catId !== currentCategoryId || promo !== promoOnly || isNew !== newOnly ||
    stock !== (initInStock ?? false) ||
    minP !== (initMin != null ? String(initMin) : "") ||
    maxP !== (initMax != null ? String(initMax) : "");

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-700" />
          <span className="font-display font-700 text-slate-900 text-base">Filtres</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Recherche</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && apply()}
            placeholder="Nom de produit…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:bg-white outline-none transition-all font-sans"
          />
        </div>
      </div>

      {/* Quick toggles */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Filtres rapides</label>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setPromo(!promo)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all",
              promo
                ? "border-accent-500 bg-accent-50 text-accent-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <Tag className="w-4 h-4" />
            Promotions seulement
            {promo && <Check className="w-4 h-4 ml-auto text-accent-500" />}
          </button>
          <button
            onClick={() => setIsNew(!isNew)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all",
              isNew
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Nouveautés seulement
            {isNew && <Check className="w-4 h-4 ml-auto text-brand-500" />}
          </button>
          <button
            onClick={() => setStock(!stock)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all",
              stock
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <Package className="w-4 h-4" />
            En stock uniquement
            {stock && <Check className="w-4 h-4 ml-auto text-green-500" />}
          </button>
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Prix (FCFA)
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={minP}
              onChange={e => setMinP(e.target.value)}
              placeholder="Min"
              min={0}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:bg-white outline-none transition-all font-sans"
            />
          </div>
          <span className="text-slate-400 text-sm font-medium shrink-0">—</span>
          <div className="relative flex-1">
            <input
              type="number"
              value={maxP}
              onChange={e => setMaxP(e.target.value)}
              placeholder="Max"
              min={0}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-brand-500 focus:bg-white outline-none transition-all font-sans"
            />
          </div>
        </div>
        {/* Quick price presets */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: "< 10k",   min: undefined, max: 10000 },
            { label: "10–50k",  min: 10000,     max: 50000 },
            { label: "50–100k", min: 50000,     max: 100000 },
            { label: "> 100k",  min: 100000,    max: undefined },
          ].map(preset => {
            const active = String(preset.min ?? "") === minP && String(preset.max ?? "") === maxP;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setMinP(preset.min != null ? String(preset.min) : "");
                  setMaxP(preset.max != null ? String(preset.max) : "");
                }}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Catégorie</label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setCatId(undefined)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
              !catId ? "bg-brand-50 text-brand-800 font-semibold" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {!catId && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
            {catId && <span className="w-3.5 h-3.5 shrink-0" />}
            Toutes les catégories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatId(cat.id === catId ? undefined : cat.id)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left",
                catId === cat.id ? "bg-brand-50 text-brand-800 font-semibold" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {catId === cat.id
                ? <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                : <span className="w-3.5 h-3.5 shrink-0" />
              }
              {cat.nom}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={apply}
          className="flex-1 py-2.5 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
        >
          Appliquer
        </button>
        {dirty && (
          <button
            onClick={reset}
            className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

export default function CatalogueFilters(props: Props) {
  const [open, setOpen] = useState(false);

  // Count active non-default filters for badge
  const activeCount = [
    props.promoOnly, props.newOnly, props.inStock,
    props.currentCategoryId != null,
    props.currentSearch,
    props.minPrice != null || props.maxPrice != null,
  ].filter(Boolean).length;

  if (props.mobileOnly) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-brand-400 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filtres
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-700 text-white text-[10px] font-bold shrink-0">
              {activeCount}
            </span>
          )}
        </button>

        {/* Mobile modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 max-h-[90dvh] overflow-y-auto">
              <FilterPanel
                {...props}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return <FilterPanel {...props} />;
}
