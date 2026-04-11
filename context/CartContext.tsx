"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/utils";

export interface SelectedVariant {
  id: number;
  nom: string;
  prix: number;
}

export interface CartItem extends Product {
  qty: number;
  cartKey: string;            // "productId" or "productId-v{variantId}"
  variantId?: number;
  variantNom?: string;
  variantPrix?: number;       // overrides prix_unitaire when set
}

interface CartCtx {
  items:        CartItem[];
  count:        number;
  total:        number;
  addItem:      (p: Product, qty?: number, variant?: SelectedVariant) => void;
  removeItem:   (cartKey: string) => void;
  updateQty:    (cartKey: string, qty: number) => void;
  clearCart:    () => void;
}

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "ts_cart";

export const calcPrice = (p: CartItem) =>
  p.variantPrix !== undefined
    ? p.variantPrix
    : p.remise > 0
    ? Math.round(p.prix_unitaire * (1 - p.remise / 100))
    : p.prix_unitaire;

function migrateItem(raw: Record<string, unknown>): CartItem {
  // Add cartKey to old items that lack it
  const cartKey =
    typeof raw.cartKey === "string"
      ? raw.cartKey
      : raw.variantId
      ? `${raw.id}-v${raw.variantId}`
      : String(raw.id);
  return { ...(raw as unknown as CartItem), cartKey };
}

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return (parsed as Record<string, unknown>[]).map(migrateItem);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => { setItems(load()); }, []);

  const save = useCallback((next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  }, []);

  const addItem = useCallback((p: Product, qty = 1, variant?: SelectedVariant) => {
    const cartKey = variant ? `${p.id}-v${variant.id}` : String(p.id);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.cartKey === cartKey);
      const newItem: CartItem = {
        ...p,
        qty,
        cartKey,
        ...(variant
          ? { variantId: variant.id, variantNom: variant.nom, variantPrix: variant.prix }
          : {}),
      };
      const next =
        idx >= 0
          ? prev.map((i, j) => (j === idx ? { ...i, qty: i.qty + qty } : i))
          : [...prev, newItem];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("cart-updated"));
      return next;
    });
  }, []);

  const removeItem = useCallback(
    (cartKey: string) => {
      save(items.filter((i) => i.cartKey !== cartKey));
    },
    [items, save]
  );

  const updateQty = useCallback(
    (cartKey: string, qty: number) => {
      if (qty <= 0) {
        save(items.filter((i) => i.cartKey !== cartKey));
        return;
      }
      save(items.map((i) => (i.cartKey === cartKey ? { ...i, qty } : i)));
    },
    [items, save]
  );

  const clearCart = useCallback(() => save([]), [save]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + calcPrice(i) * i.qty, 0);

  return (
    <Ctx.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be inside <CartProvider>");
  return ctx;
}
