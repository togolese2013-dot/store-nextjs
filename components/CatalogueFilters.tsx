"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/utils";
import {
  SlidersHorizontal, Search, Tag, Sparkles, X, ChevronDown, Check,
} from "lucide-react";
import { clsx } from "clsx";

interface Props {
  categories:        Category[];
  currentCategoryId?: number;
  currentSearch?:    string;
  promoOnly:         boolean;
  newOnly:           boolean;
  mobileOnly?:       boolean;
}

function FilterPanel({
  categories, currentCategoryId, currentSearch, promoOnly, newOnly, onClose,
}: Omit<Props, "mobileOnly"> & { onClose?: () => void }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [q,      setQ]      = useState(currentSearch ?? "");
  const [catId,  setCatId]  = useState<number | undefined>(currentCategoryId);
  const [promo,  setPromo]  = useState(promoOnly);
  const [isNew,  setIsNew]  = useState(newOnly);

  function apply() {
    const sp = new URLSearchParams();
    if (q.trim())  sp.set("q", q.trim());
    if (catId)     sp.set("category", String(catId));
    if (promo)     sp.set("promo", "true");
    if (isNew)     sp.set("new", "true");
    const qs = sp.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
    onClose?.();
  }

  function reset() {
    setQ(""); setCatId(undefined); setPromo(false); setIsNew(false);
    router.push("/products");
    onClose?.();
  }

  const dirty = q.trim() !== (currentSearch ?? "") ||
    catId !== currentCategoryId || promo !== promoOnly || isNew !== newOnly;

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

  if (props.mobileOnly) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-brand-400 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filtres
          {(props.promoOnly || props.newOnly || props.currentCategoryId || props.currentSearch) && (
            <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
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
