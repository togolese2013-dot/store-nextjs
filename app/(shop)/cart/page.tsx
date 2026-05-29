"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { calcPrice } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, Plus, Minus, Check, Truck, ShieldCheck } from "lucide-react";
import CartSuggestions from "@/components/CartSuggestions";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function resolveImg(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `${SITE}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const router = useRouter();

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
    sessionStorage.setItem("cart_selected", JSON.stringify([...selectedKeys]));
    router.push("/checkout");
  }

  /* Empty state */
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: "#E8E1D4" }}
        >
          <ShoppingBag className="w-10 h-10" style={{ color: "#8A8278" }} strokeWidth={1.5} />
        </div>
        <h1 className="text-[22px] font-medium tracking-[-0.02em] mb-2" style={{ color: "#14110E" }}>
          Votre panier est vide
        </h1>
        <p className="text-sm mb-7 max-w-xs" style={{ color: "#6B635B" }}>
          Parcourez notre catalogue pour trouver ce qu'il vous faut.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] text-white text-[14px] font-medium"
          style={{ background: "#14110E" }}
        >
          Voir les produits →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FBF7F1" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white/80" style={{ borderColor: "#E8E1D4" }}>
        <Link href="/products" className="p-1 grid place-items-center" style={{ color: "#14110E" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div className="flex-1 text-[17px] font-medium tracking-[-0.025em]" style={{ color: "#14110E" }}>
          Mon Panier{" "}
          <span className="text-[15px] font-normal" style={{ color: "#8A8278" }}>
            ({count} article{count > 1 ? "s" : ""})
          </span>
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-[12px] font-medium"
          style={{ color: "#6B635B" }}
        >
          <span
            className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
            style={{ background: allSelected ? "#14110E" : "white", borderColor: allSelected ? "#14110E" : "#E8E1D4" }}
          >
            {allSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </span>
          Tous
        </button>
      </div>

      <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:px-6 lg:py-8">

        {/* ── Items list ── */}
        <div className="flex-1 min-w-0 px-4 py-3 lg:px-0 space-y-3 lg:col-span-2">
          {items.map(item => {
            const itemPrice = calcPrice(item);
            const isPromo   = item.remise > 0;
            const isChecked = selectedKeys.has(item.cartKey);
            const imgSrc    = resolveImg(item.image_url);

            return (
              <div
                key={item.cartKey}
                className="flex gap-3 p-3 rounded-[14px] border bg-white transition-opacity"
                style={{
                  borderColor: isChecked ? "#C8BBAA" : "#E8E1D4",
                  opacity: isChecked ? 1 : 0.55,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggle(item.cartKey)}
                  className="shrink-0 mt-1 self-start"
                  aria-label={isChecked ? "Désélectionner" : "Sélectionner"}
                >
                  <span
                    className="w-5 h-5 rounded border-[1.5px] flex items-center justify-center"
                    style={{ background: isChecked ? "#14110E" : "white", borderColor: isChecked ? "#14110E" : "#E8E1D4" }}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                </button>

                {/* Image */}
                <Link
                  href={`/products/${item.slug ?? item.reference}`}
                  className="w-[72px] h-[72px] rounded-[10px] overflow-hidden shrink-0 relative"
                  style={{ background: "rgba(232,225,212,0.25)" }}
                >
                  {imgSrc ? (
                    <Image src={imgSrc} alt={item.nom} fill className="object-contain p-2" sizes="72px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7" style={{ color: "#C8BBAA" }} strokeWidth={1} />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {item.categorie_nom && (
                    <p className="text-[9.5px] uppercase tracking-[0.06em] mb-0.5" style={{ color: "#8A8278" }}>
                      {item.categorie_nom}
                    </p>
                  )}
                  <Link href={`/products/${item.slug ?? item.reference}`}>
                    <h3 className="text-[13px] font-medium leading-[1.25] mb-[6px] tracking-[-0.01em] line-clamp-2" style={{ color: "#14110E" }}>
                      {item.nom}
                    </h3>
                  </Link>
                  {item.variantNom && (
                    <p className="text-[11px] mb-1.5" style={{ color: "#8A8278" }}>{item.variantNom}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="flex items-center overflow-hidden rounded-[8px] border" style={{ borderColor: "#E8E1D4" }}>
                      <button
                        onClick={() => updateQty(item.cartKey, item.qty - 1)}
                        className="w-[30px] h-[30px] grid place-items-center"
                        style={{ background: "#FBF7F1" }}
                        aria-label="Diminuer"
                      >
                        <Minus className="w-3 h-3" style={{ color: "#14110E" }} strokeWidth={2.4} />
                      </button>
                      <div className="w-[30px] h-[30px] text-center text-[13px] font-medium grid place-items-center font-mono border-x" style={{ borderColor: "#E8E1D4", color: "#14110E" }}>
                        {item.qty}
                      </div>
                      <button
                        onClick={() => updateQty(item.cartKey, item.qty + 1)}
                        className="w-[30px] h-[30px] grid place-items-center"
                        style={{ background: "#FBF7F1" }}
                        aria-label="Augmenter"
                      >
                        <Plus className="w-3 h-3" style={{ color: "#14110E" }} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-mono font-medium" style={{ color: "#14110E" }}>
                        {formatPrice(itemPrice * item.qty)}
                      </span>
                      <button
                        onClick={() => {
                          removeItem(item.cartKey);
                          setSelectedKeys(prev => { const n = new Set(prev); n.delete(item.cartKey); return n; });
                        }}
                        className="p-1 grid place-items-center"
                        style={{ color: "#8A8278" }}
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
              className="flex items-center gap-1.5 text-[12px]"
              style={{ color: "#8A8278" }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Vider le panier
            </button>
          </div>

          {/* Suggestions */}
          <CartSuggestions excludeIds={items.map(i => i.id)} />
        </div>

        {/* ── Order summary ── */}
        <div className="px-4 pb-4 lg:w-80 lg:shrink-0 lg:px-0">
          <div className="rounded-[14px] border bg-white p-[14px_16px] sticky top-24" style={{ borderColor: "#E8E1D4" }}>
            <h2 className="text-[14px] font-medium tracking-[-0.02em] mb-3" style={{ color: "#14110E" }}>
              Récapitulatif
            </h2>

            {selectedItems.length === 0 ? (
              <p className="text-[12px] text-center py-3" style={{ color: "#8A8278" }}>Aucun article sélectionné</p>
            ) : (
              <div className="space-y-2 mb-3">
                {selectedItems.map(i => (
                  <div key={i.cartKey} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="line-clamp-1 flex-1" style={{ color: "#6B635B" }}>
                      {i.nom}{i.variantNom ? ` · ${i.variantNom}` : ""} × {i.qty}
                    </span>
                    <span className="font-mono shrink-0" style={{ color: "#14110E" }}>
                      {formatPrice(calcPrice(i) * i.qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 mb-3 space-y-2" style={{ borderColor: "#E8E1D4" }}>
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "#6B635B" }}>Sous-total</span>
                <span className="font-mono" style={{ color: "#14110E" }}>{formatPrice(selectedTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: "#6B635B" }}>Livraison</span>
                <span className="font-medium" style={{ color: "#2D6A4F" }}>À confirmer</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between mb-4 rounded-[10px] px-3 py-2.5" style={{ background: "#FBF7F1" }}>
              <span className="text-[15px] font-medium" style={{ color: "#14110E" }}>Total</span>
              <span className="text-[17px] font-mono font-medium" style={{ color: "#14110E" }}>
                {formatPrice(selectedTotal)}
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-[10px]">
              <button
                onClick={goToCheckout}
                disabled={selectedItems.length === 0}
                className="w-full h-[50px] rounded-[14px] text-white text-[15px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: "#14110E" }}
              >
                Passer la commande →
              </button>
              <Link
                href="/products"
                className="w-full h-[44px] rounded-[14px] border text-[14px] font-medium flex items-center justify-center tracking-[-0.01em]"
                style={{ borderColor: "#E8E1D4", color: "#14110E" }}
              >
                Continuer les achats
              </Link>
            </div>

            {/* Trust */}
            <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: "#E8E1D4" }}>
              {[
                { Icon: Truck,       text: "Livraison rapide — Lomé & Togo" },
                { Icon: ShieldCheck, text: "Paiement à la livraison" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[11.5px]" style={{ color: "#8A8278" }}>
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.85} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
