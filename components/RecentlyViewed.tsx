"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ShoppingCart, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRecentlyViewed, type RecentItem } from "@/hooks/useRecentlyViewed";
import { useCart } from "@/context/CartContext";

const STORAGE_KEY = "ts_recently_viewed";

interface Props {
  excludeId?: number;  // current product — excluded from the list
  maxItems?:  number;
}

function removeFromStorage(id: number) {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY);
    const all: RecentItem[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(i => i.id !== id)));
  } catch { /* ignore */ }
}

function RecentCard({
  item, onRemove,
}: { item: RecentItem; onRemove: () => void }) {
  const { addItem } = useCart();
  const price   = item.remise > 0 ? Math.max(0, item.prix - item.remise) : item.prix;
  const isPromo = item.remise > 0;

  const imgSrc = item.image_url
    ? item.image_url.startsWith("http")
      ? item.image_url
      : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${item.image_url.startsWith("/") ? item.image_url : `/${item.image_url}`}`
    : null;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all flex flex-col overflow-hidden shrink-0 w-36 sm:w-44">
      {/* Remove button */}
      <button
        onClick={e => { e.preventDefault(); onRemove(); }}
        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Retirer de l'historique"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Image */}
      <Link
        href={`/products/${item.reference}`}
        className="block relative aspect-square bg-slate-50 overflow-hidden"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={item.nom}
            fill
            sizes="176px"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-slate-200" strokeWidth={1} />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <Link href={`/products/${item.reference}`}>
          <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-snug mb-1.5 hover:text-brand-800 transition-colors">
            {item.nom}
          </p>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-1">
          <div>
            <span className={`text-sm font-display font-bold ${isPromo ? "text-accent-500" : "text-slate-900"}`}>
              {formatPrice(price)}
            </span>
            {isPromo && (
              <span className="block text-[10px] text-slate-400 line-through leading-none">
                {formatPrice(item.prix)}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem({
              id:            item.id,
              reference:     item.reference,
              nom:           item.nom,
              image_url:     item.image_url,
              prix_unitaire: item.prix,
              remise:        item.remise,
              stock_boutique: 1,
              stock_magasin:  1,
              neuf:          false,
              images:        [],
              variations:    null,
              date_creation: "",
              categorie_id:  null,
              categorie_nom: null,
              description:   null,
              marque_id:     null,
              marque_nom:    null,
            })}
            className="w-7 h-7 rounded-full bg-brand-900 hover:bg-brand-700 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Ajouter au panier"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecentlyViewed({ excludeId, maxItems = 6 }: Props) {
  const { items, clearItems } = useRecentlyViewed();
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState<RecentItem[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    setVisible(
      items.filter(i => i.id !== excludeId).slice(0, maxItems)
    );
  }, [items, excludeId, maxItems, mounted]);

  const handleRemove = (id: number) => {
    removeFromStorage(id);
    setVisible(prev => prev.filter(i => i.id !== id));
  };

  if (!mounted || visible.length === 0) return null;

  return (
    <section className="py-10 lg:py-12 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-0.5">
                Historique
              </p>
              <h2 className="font-display text-lg font-800 text-slate-900 leading-none">
                Vus récemment
              </h2>
            </div>
          </div>
          <button
            onClick={() => { clearItems(); setVisible([]); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Effacer l'historique
          </button>
        </div>

        {/* Horizontal scrollable row */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {visible.map(item => (
            <RecentCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
