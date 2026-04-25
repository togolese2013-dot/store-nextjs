"use client";

import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  Truck, ShieldCheck, RefreshCw, Tag,
} from "lucide-react";
import { clsx } from "clsx";
import CartSuggestions from "@/components/CartSuggestions";

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.089.534 4.054 1.47 5.764L0 24l6.396-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.016-1.378l-.36-.214-3.72.846.862-3.636-.235-.373A9.775 9.775 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.423 0 9.818 4.396 9.818 9.818 0 5.423-4.395 9.818-9.818 9.818z" />
  </svg>
);

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();

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

  /* WhatsApp order summary */
  const waLines = items.map(i =>
    `• ${i.nom} × ${i.qty} = ${formatPrice(calcPrice(i) * i.qty)}`
  ).join("\n");
  const waText = encodeURIComponent(
    `Bonjour, je voudrais passer la commande suivante :\n\n${waLines}\n\n💰 *Total : ${formatPrice(total)}*\n\nPouvez-vous confirmer la disponibilité et les frais de livraison ?`
  );

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
        <h1 className="font-display text-2xl font-800 text-slate-900 mb-7">
          Mon panier <span className="text-slate-400 font-500 text-lg">({count} article{count > 1 ? "s" : ""})</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Items list ── */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const itemPrice  = calcPrice(item);
              const isPromo    = item.remise > 0;
              const imgSrc     = item.image_url
                ? item.image_url.startsWith("http")
                  ? item.image_url
                  : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/uploads/${item.image_url}`
                : null;

              return (
                <div key={item.cartKey}
                  className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 flex gap-4"
                >
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
                          onClick={() => removeItem(item.cartKey)}
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
              <h2 className="font-display font-800 text-slate-900 text-lg mb-5">Récapitulatif</h2>

              {/* Lines */}
              <div className="space-y-3 mb-5">
                {items.map(i => (
                  <div key={i.cartKey} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 line-clamp-1 flex-1">{i.nom}{i.variantNom ? ` · ${i.variantNom}` : ""} × {i.qty}</span>
                    <span className="font-semibold text-slate-800 shrink-0">{formatPrice(calcPrice(i) * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 mb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-semibold text-slate-800">{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Livraison</span>
                  <span className="font-semibold text-green-600">À confirmer</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-2xl px-4 py-3">
                <span className="font-display font-800 text-slate-900">Total</span>
                <span className="font-display font-800 text-2xl text-brand-900">{formatPrice(total)}</span>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <Link href="/checkout"
                  className="flex items-center justify-center w-full py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-all hover:shadow-brand"
                >
                  Commander maintenant
                </Link>

                <Link href="/products"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-brand-300 hover:text-brand-700 transition-all"
                >
                  Continuer les achats
                </Link>
              </div>

              {/* Trust */}
              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2">
                {[
                  { icon: Truck,       text: "Livraison rapide à Lomé" },
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
