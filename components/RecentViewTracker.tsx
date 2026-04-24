"use client";

import { useEffect } from "react";
import { useRecentlyViewed, type RecentItem } from "@/hooks/useRecentlyViewed";

export default function RecentViewTracker({ item }: { item: RecentItem }) {
  const { addItem } = useRecentlyViewed();

  useEffect(() => {
    // Small delay so the page is visible before we write to localStorage
    const t = setTimeout(() => addItem(item), 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return null; // renders nothing
}
