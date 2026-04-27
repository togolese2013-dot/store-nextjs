"use client";

/**
 * RatingBadge — lazy star rating for ProductCard.
 *
 * All cards rendered within the same 80ms window share a SINGLE API call
 * (/api/reviews/ratings?ids=…). Results are cached at module level for the
 * lifetime of the page, so repeated renders never re-fetch.
 *
 * When a product has no real reviews, a deterministic pseudo-random rating
 * (4.0–5.0) is generated from the product ID so every product shows stars.
 */

import { useEffect, useState } from "react";

type Rating = { avg: number; count: number; fake?: boolean };

// ── Module-level batch state ──────────────────────────────────────────────────
const _cache    = new Map<number, Rating | null>();
const _pending  = new Map<number, Array<(r: Rating | null) => void>>();
let   _timer:    ReturnType<typeof setTimeout> | null = null;
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "")
  : "";

function queueRating(productId: number, cb: (r: Rating | null) => void) {
  if (_cache.has(productId)) { cb(_cache.get(productId)!); return; }
  const cbs = _pending.get(productId) ?? [];
  cbs.push(cb);
  _pending.set(productId, cbs);
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
      for (const id of ids) {
        _cache.set(id, null);
        callbacks.get(id)?.forEach(fn => fn(null));
      }
    }
  }, 80);
}

// Deterministic fake rating between 4.0 and 5.0, consistent per product
function fakeRating(id: number): Rating {
  const h     = ((id * 2654435761) >>> 0);
  const avg   = 4.0 + (h % 11) * 0.1;          // 4.0 → 5.0 in 0.1 steps
  const count = 5  + (h % 53);                  // 5 → 57
  return { avg: Math.round(avg * 10) / 10, count, fake: true };
}

// Half-star row using layered overflow clip
function StarRow({ avg, size }: { avg: number; size: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const pct = (avg / 5) * 100;
  return (
    <div className="relative inline-flex items-center gap-0.5">
      {/* Empty stars layer */}
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round"
          />
        </svg>
      ))}
      {/* Filled stars layer clipped to avg percentage */}
      <div
        className="absolute inset-0 overflow-hidden flex items-center gap-0.5"
        style={{ width: `${pct}%` }}
      >
        {[1,2,3,4,5].map(i => (
          <svg key={i} viewBox="0 0 24 24" className={`${cls} shrink-0`} aria-hidden>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RatingBadge({
  productId,
  size = "sm",
}: {
  productId: number;
  size?: "sm" | "md";
}) {
  const [rating, setRating] = useState<Rating | null | undefined>(undefined);

  useEffect(() => {
    queueRating(productId, (r) => {
      // Use real rating if it exists, otherwise show deterministic fake
      setRating(r ?? fakeRating(productId));
    });
  }, [productId]);

  if (rating === undefined) return null;
  if (!rating) return null;

  return (
    <div className="flex items-center gap-1.5 mb-2">
      <StarRow avg={rating.avg} size={size} />
      <span className={`font-semibold text-slate-700 ${size === "md" ? "text-sm" : "text-[11px]"}`}>
        {rating.avg.toFixed(1)}
      </span>
      <span className={`text-slate-400 ${size === "md" ? "text-xs" : "text-[10px]"}`}>
        ({rating.count})
      </span>
    </div>
  );
}
