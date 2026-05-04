"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/utils";
import {
  SlidersHorizontal, Search, Tag, Sparkles, X, Package, TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";

interface Props {
  categories:         Category[];
  currentCategoryId?: number;
  currentSearch?:     string;
  promoOnly:          boolean;
  newOnly:            boolean;
  bestOnly?:          boolean;
  inStock?:           boolean;
  minPrice?:          number;
  maxPrice?:          number;
  mobileOnly?:        boolean;
}

/* ── Toggle switch ────────────────────────────────────────────────────────── */
function Toggle({
  checked, onChange, label, icon, activeClass,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2 group"
    >
      <span className={clsx(
        "flex items-center gap-2 text-sm font-medium transition-colors",
        checked ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
      )}>
        <span className={clsx("transition-colors", checked ? activeClass : "text-slate-400")}>
          {icon}
        </span>
        {label}
      </span>
      {/* Switch track */}
      <span className={clsx(
        "relative inline-flex w-8 h-4 rounded-full transition-colors shrink-0",
        checked ? activeClass.replace("text-", "bg-") : "bg-slate-200"
      )}>
        <span className={clsx(
          "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )} />
      </span>
    </button>
  );
}

/* ── Filter panel ─────────────────────────────────────────────────────────── */
function FilterPanel({
  categories, currentCategoryId, currentSearch,
  promoOnly, newOnly, bestOnly, inStock: initInStock,
  minPrice: initMin, maxPrice: initMax,
  onClose,
}: Omit<Props, "mobileOnly"> & { onClose?: () => void }) {
  const router = useRouter();

  const [q,     setQ]    = useState(currentSearch ?? "");
  const [catId, setCatId] = useState<number | undefined>(currentCategoryId);
  const [promo, setPromo] = useState(promoOnly);
  const [isNew, setIsNew] = useState(newOnly);
  const [best,  setBest]  = useState(bestOnly ?? false);
  const [stock, setStock] = useState(initInStock ?? false);
  const [minP,  setMinP]  = useState(initMin != null ? String(initMin) : "");
  const [maxP,  setMaxP]  = useState(initMax != null ? String(initMax) : "");

  function apply() {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (catId)    sp.set("category", String(catId));
    if (promo)    sp.set("promo", "true");
    if (isNew)    sp.set("new", "true");
    if (best)     sp.set("best", "true");
    if (stock)    sp.set("inStock", "true");
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
    setIsNew(false); setBest(false); setStock(false); setMinP(""); setMaxP("");
    router.push("/products");
    onClose?.();
  }

  const dirty = q.trim() !== (currentSearch ?? "") ||
    catId !== currentCategoryId || promo !== promoOnly || isNew !== newOnly ||
    best !== (bestOnly ?? false) ||
    stock !== (initInStock ?? false) ||
    minP !== (initMin != null ? String(initMin) : "") ||
    maxP !== (initMax != null ? String(initMax) : "");

  const PRICE_PRESETS = [
    { label: "< 10k",   min: undefined, max: 10000 },
    { label: "10–50k",  min: 10000,     max: 50000 },
    { label: "50–100k", min: 50000,     max: 100000 },
    { label: "> 100k",  min: 100000,    max: undefined },
  ];

  const inputCls = "w-full px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-400 focus:bg-white outline-none transition-all font-sans";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-semibold text-slate-900 text-sm">Filtres</span>
        </div>
        {onClose ? (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        ) : dirty && (
          <button onClick={reset} className="text-xs text-slate-400 hover:text-brand-600 transition-colors font-medium">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && apply()}
          placeholder="Rechercher un produit…"
          className={inputCls + " pl-8"}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Quick toggles */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Filtres rapides</p>
        <div className="divide-y divide-slate-100">
          <Toggle
            checked={promo} onChange={setPromo}
            label="Promotions" icon={<Tag className="w-3.5 h-3.5" />}
            activeClass="text-orange-500"
          />
          <Toggle
            checked={isNew} onChange={setIsNew}
            label="Nouveautés" icon={<Sparkles className="w-3.5 h-3.5" />}
            activeClass="text-brand-600"
          />
          <Toggle
            checked={best} onChange={setBest}
            label="Meilleures ventes" icon={<TrendingUp className="w-3.5 h-3.5" />}
            activeClass="text-emerald-600"
          />
          <Toggle
            checked={stock} onChange={setStock}
            label="En stock uniquement" icon={<Package className="w-3.5 h-3.5" />}
            activeClass="text-green-500"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Price */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Prix (FCFA)</p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number" value={minP}
            onChange={e => setMinP(e.target.value)}
            placeholder="Min" min={0}
            className={inputCls}
          />
          <span className="text-slate-300 text-sm shrink-0">—</span>
          <input
            type="number" value={maxP}
            onChange={e => setMaxP(e.target.value)}
            placeholder="Max" min={0}
            className={inputCls}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {PRICE_PRESETS.map(preset => {
            const active = String(preset.min ?? "") === minP && String(preset.max ?? "") === maxP;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  setMinP(preset.min != null ? String(preset.min) : "");
                  setMaxP(preset.max != null ? String(preset.max) : "");
                }}
                className={clsx(
                  "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Categories */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Catégorie</p>
        <div className="relative">
          <select
            value={catId ?? ""}
            onChange={e => setCatId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-400 focus:bg-white outline-none transition-all text-slate-700 font-medium cursor-pointer"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Apply */}
      <button
        onClick={apply}
        className="w-full py-2 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors"
      >
        Appliquer
      </button>

    </div>
  );
}

export default function CatalogueFilters(props: Props) {
  const [open, setOpen] = useState(false);

  // Count active non-default filters for badge
  const activeCount = [
    props.promoOnly, props.newOnly, props.bestOnly, props.inStock,
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
