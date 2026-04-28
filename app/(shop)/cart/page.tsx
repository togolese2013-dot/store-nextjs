"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  Truck, ShieldCheck, RefreshCw, Check,
} from "lucide-react";
import { clsx } from "clsx";
import CartSuggestions from "@/components/CartSuggestions";

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const router = useRouter();

  // All items selected by default
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(items.map(i => i.cartKey))
  );

  const selectedItems = useMemo(
    () => items.filter(i => selectedKeys.has(i.cartKey)),
    [items, selectedKeys]
  );

  const selectedTotal = useMemo(
    () => selectedItems.reduce((s, i) => s + calcPrice(i) * i.qty, 0),
    [selectedItems]
  );

  const allSelected = items.length > 0 && selectedKeys.size === items.length;

  function toggle(cartKey: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(cartKey)) next.delete(cartKey);
      else next.add(cartKey);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(items.map(i => i.cartKey)));
  }

  function goToCheckout() {
    // Store selected keys in sessionStorage so checkout can filter
    sessionStorage.setItem("cart_selected", JSON.stringify([...selectedKeys]));
    router.push("/checkout");
  }

  /* Empty state */
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <ShoppingBag className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-800 text-slate-900 mb-2">Votre panier est vide</h1>
        <p className="text-slate-500 text-sm mb-7 max-w-xs">
          Vous n'avez pas encore ajouté de produits. Parcourez notre catalogue pour commencer.
        </p>
        <Link href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
        >
          Voir les produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Panier ({count} article{count > 1 ? "s" : ""})</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <h1 className="font-display text-2xl font-800 text-slate-900">
            Mon panier <span className="text-slate-400 font-500 text-lg">({count} article{count > 1 ? "s" : ""})</span>
          </h1>
          {/* Select all */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700 transition-colors"
          >
            <span className={clsx(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
              allSelected ? "bg-brand-900 border-brand-900" : "border-slate-300 bg-white"
            )}>
              {allSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Items list ── */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const itemPrice = calcPrice(item);
              const isPromo   = item.remise > 0;
              const isChecked = selectedKeys.has(item.cartKey);
              const imgSrc    = item.image_url
                ? item.image_url.startsWith("http")
                  ? item.image_url
                  : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/uploads/${item.image_url}`
                : null;

              return (
                <div
                  key={item.cartKey}
                  className={clsx(
                    "bg-white rounded-3xl border p-4 sm:p-5 flex gap-3 transition-all",
                    isChecked ? "border-brand-200 shadow-sm" : "border-slate-100 opacity-60"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(item.cartKey)}
                    aria-label={isChecked ? "Désélectionner" : "Sélectionner"}
                    className="shrink-0 mt-1 self-start"
                  >
                    <span className={clsx(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isChecked ? "bg-brand-900 border-brand-900" : "border-slate-300 bg-white hover:border-brand-400"
                    )}>
                      {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>

                  {/* Thumbnail */}
                  <Link href={`/products/${item.reference}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 overflow-hidden shrink-0 relative"
                  >
                    {imgSrc ? (
                      <Image src={imgSrc} alt={item.nom} fill className="object-contain p-2" sizes="112px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8" strokeWidth={1} />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {item.categorie_nom && (
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-0.5">
                        {item.categorie_nom}
                      </p>
                    )}
                    <Link href={`/products/${item.reference}`}>
                      <h3 className="font-display font-700 text-slate-900 text-base leading-snug mb-2 line-clamp-2 hover:text-brand-900 transition-colors">
                        {item.nom}
                      </h3>
                    </Link>
                    {item.variantNom && (
                      <p className="text-xs text-slate-500 mb-2 font-medium">{item.variantNom}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={clsx("font-display font-800 text-lg", isPromo ? "text-accent-500" : "text-brand-900")}>
                        {formatPrice(itemPrice)}
                      </span>
                      {isPromo && (
                        <span className="text-sm text-slate-400 line-through">{formatPrice(item.prix_unitaire)}</span>
                      )}
                    </div>

                    {/* Qty + remove */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center border-2 border-slate-200 rounded-2xl px-1">
                        <button
                          onClick={() => updateQty(item.cartKey, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                          aria-label="Diminuer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-900">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.cartKey, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-display font-800 text-slate-800">
                          {formatPrice(itemPrice * item.qty)}
                        </span>
                        <button
                          onClick={() => {
                            removeItem(item.cartKey);
                            setSelectedKeys(prev => {
                              const next = new Set(prev);
                              next.delete(item.cartKey);
                              return next;
                            });
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" /> Vider le panier
              </button>
            </div>

            {/* Suggestions */}
            <CartSuggestions excludeIds={items.map(i => i.id)} />
          </div>

          {/* ── Order summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sticky top-24">
              <h2 className="font-display font-800 text-slate-900 text-lg mb-1">Récapitulatif</h2>
              {selectedItems.length < items.length && (
                <p className="text-xs text-brand-600 font-semibold mb-4">
                  {selectedItems.length} article{selectedItems.length > 1 ? "s" : ""} sélectionné{selectedItems.length > 1 ? "s" : ""} sur {items.length}
                </p>
              )}
              {selectedItems.length === items.length && <div className="mb-4" />}

              {/* Lines — selected only */}
              <div className="space-y-3 mb-5">
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">Aucun article sélectionné</p>
                ) : selectedItems.map(i => (
                  <div key={i.cartKey} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 line-clamp-1 flex-1">{i.nom}{i.variantNom ? ` · ${i.variantNom}` : ""} × {i.qty}</span>
                    <span className="font-semibold text-slate-800 shrink-0">{formatPrice(calcPrice(i) * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 mb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-semibold text-slate-800">{formatPrice(selectedTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Livraison</span>
                  <span className="font-semibold text-green-600">À confirmer</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="font-display font-800 text-slate-900">Total</span>
                <span className="font-display font-800 text-2xl text-brand-900">{formatPrice(selectedTotal)}</span>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={goToCheckout}
                  disabled={selectedItems.length === 0}
                  className="flex items-center justify-center w-full py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-all hover:shadow-brand disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Commander ({selectedItems.length})
                </button>

                <Link href="/products"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-brand-300 hover:text-brand-700 transition-all"
                >
                  Continuer les achats
                </Link>
              </div>

              {/* Trust */}
              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2">
                {[
                  { icon: Truck,       text: "Livraison le jour même à Lomé" },
                  { icon: ShieldCheck, text: "Paiement à la livraison" },
                  { icon: RefreshCw,   text: "Retours acceptés — 7 jours" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
