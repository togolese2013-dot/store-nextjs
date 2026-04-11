"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "@/lib/utils";

export interface CartItem extends Product {
  qty: number;
}

interface CartCtx {
  items:        CartItem[];
  count:        number;
  total:        number;
  addItem:      (p: Product, qty?: number) => void;
  removeItem:   (id: number) => void;
  updateQty:    (id: number, qty: number) => void;
  clearCart:    () => void;
}

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "ts_cart";

const calcPrice = (p: Product) =>
  p.remise > 0 ? Math.round(p.prix_unitaire * (1 - p.remise / 100)) : p.prix_unitaire;

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  /* hydrate from localStorage */
  useEffect(() => { setItems(load()); }, []);

  const save = useCallback((next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  }, []);

  const addItem = useCallback((p: Product, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      const next = idx >= 0
        ? prev.map((i, j) => j === idx ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { ...p, qty }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("cart-updated"));
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    save(items.filter(i => i.id !== id));
  }, [items, save]);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) { save(items.filter(i => i.id !== id)); return; }
    save(items.map(i => i.id === id ? { ...i, qty } : i));
  }, [items, save]);

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

export { calcPrice };
