"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ts_recently_viewed";
const MAX_ITEMS   = 10;

export interface RecentItem {
  id:        number;
  reference: string;
  nom:       string;
  image_url: string | null;
  prix:      number;
  remise:    number;
}

function readItems(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function writeItems(items: RecentItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  // Load from localStorage once mounted
  useEffect(() => { setItems(readItems()); }, []);

  const addItem = useCallback((item: RecentItem) => {
    setItems(prev => {
      // Remove existing entry for same product, then prepend
      const filtered = prev.filter(i => i.id !== item.id);
      const next     = [item, ...filtered].slice(0, MAX_ITEMS);
      writeItems(next);
      return next;
    });
  }, []);

  const clearItems = useCallback(() => {
    writeItems([]);
    setItems([]);
  }, []);

  return { items, addItem, clearItems };
}
