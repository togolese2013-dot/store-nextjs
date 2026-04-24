"use client";

/**
 * RatingBadge — lazy star rating for ProductCard.
 *
 * All cards rendered within the same 80ms window share a SINGLE API call
 * (/api/reviews/ratings?ids=…). Results are cached at module level for the
 * lifetime of the page, so repeated renders never re-fetch.
 */

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Rating = { avg: number; count: number };

// ── Module-level batch state ──────────────────────────────────────────────────
const _cache    = new Map<number, Rating | null>();
const _pending  = new Map<number, Array<(r: Rating | null) => void>>();
let   _timer:    ReturnType<typeof setTimeout> | null = null;
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "")
  : "";

function queueRating(productId: number, cb: (r: Rating | null) => void) {
  // Serve from cache immediately
  if (_cache.has(productId)) {
    cb(_cache.get(productId)!);
    return;
  }

  // Queue callback
  const cbs = _pending.get(productId) ?? [];
  cbs.push(cb);
  _pending.set(productId, cbs);

  // Debounce: collect IDs for 80 ms then fire one request
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(async () => {
    const ids       = [..._pending.keys()];
    const callbacks = new Map(_pending);
    _pending.clear();

    try {
      const res  = await fetch(`${API_BASE}/api/reviews/ratings?ids=${ids.join(",")}`);
      const json = await res.json() as { ratings: Record<string, { avg: number; count: number }> };
      const data = json.ratings ?? {};

      for (const id of ids) {
        const rating = data[String(id)] ?? null;
        _cache.set(id, rating);
        callbacks.get(id)?.forEach(fn => fn(rating));
      }
    } catch {
      // On network error: cache null so we don't retry constantly
      for (const id of ids) {
        _cache.set(id, null);
        callbacks.get(id)?.forEach(fn => fn(null));
      }
    }
  }, 80);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RatingBadge({ productId }: { productId: number }) {
  const [rating, setRating] = useState<Rating | null | undefined>(undefined);

  useEffect(() => {
    queueRating(productId, setRating);
  }, [productId]);

  // undefined = still loading → render nothing (no layout shift)
  if (!rating) return null;

  const full = Math.round(rating.avg);

  return (
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="w-3 h-3"
          fill={s <= full ? "#f59e0b" : "none"}
          stroke={s <= full ? "#f59e0b" : "#d1d5db"}
          strokeWidth={1.5}
        />
      ))}
      <span className="text-[10px] text-slate-400 font-medium ml-1">
        {rating.avg.toFixed(1)}
        {rating.count > 0 && (
          <span className="text-slate-300"> ({rating.count})</span>
        )}
      </span>
    </div>
  );
}
