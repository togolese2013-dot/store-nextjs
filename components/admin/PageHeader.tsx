"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, Plus } from "lucide-react";

// ─── Accent palette per module ────────────────────────────────────────────────

const ACCENT_MAP = {
  amber: {
    focus:   "focus:border-amber-400",
    cta:     "bg-amber-500 hover:bg-amber-600",
    refresh: "hover:text-amber-600",
  },
  brand: {
    focus:   "focus:border-brand-500",
    cta:     "bg-brand-900 hover:bg-brand-800",
    refresh: "hover:text-brand-700",
  },
  emerald: {
    focus:   "focus:border-emerald-500",
    cta:     "bg-emerald-700 hover:bg-emerald-800",
    refresh: "hover:text-emerald-600",
  },
  indigo: {
    focus:   "focus:border-indigo-500",
    cta:     "bg-indigo-700 hover:bg-indigo-800",
    refresh: "hover:text-indigo-600",
  },
} as const;

export type AccentColor = keyof typeof ACCENT_MAP;

// ─── Live clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div className="text-right hidden sm:block select-none">
      <p className="text-sm font-semibold text-slate-700 tabular-nums leading-none">
        {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
        {now.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Subtitle / description */
  subtitle: string;
  /** Module accent color — controls focus ring, CTA bg, refresh hover */
  accent?: AccentColor;
  /** Show the live clock (date + time) */
  showClock?: boolean;

  // Search
  searchValue?:    string;
  onSearchChange?: (v: string) => void;
  onSearch?:       (e: React.FormEvent) => void;
  searchPlaceholder?: string;

  // Refresh button
  onRefresh?: () => void;
  refreshLoading?: boolean;

  // Primary CTA button
  ctaLabel?:   string;
  ctaIcon?:    React.ElementType;
  onCtaClick?: () => void;

  /** Extra elements inserted between refresh and CTA (e.g. secondary buttons) */
  extra?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageHeader({
  title,
  subtitle,
  accent = "brand",
  showClock = true,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Rechercher…",
  onRefresh,
  refreshLoading = false,
  ctaLabel,
  ctaIcon: CtaIcon = Plus,
  onCtaClick,
  extra,
}: PageHeaderProps) {
  const a = ACCENT_MAP[accent];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      {/* Left — title + subtitle */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
        <p className="text-sm text-slate-500 leading-snug">{subtitle}</p>
      </div>

      {/* Right — clock + search + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {showClock && <LiveClock />}

        {/* Search */}
        {onSearch && onSearchChange !== undefined && (
          <form onSubmit={onSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className={`pl-9 pr-4 py-2 text-sm bg-white rounded-xl border border-slate-200 ${a.focus} focus:outline-none w-52 transition-colors`}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
            />
          </form>
        )}

        {/* Extra slot (filters, selects, secondary buttons…) */}
        {extra}

        {/* Refresh */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Rafraîchir"
            className={`p-2 rounded-xl border border-slate-200 text-slate-500 ${a.refresh} transition-colors`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshLoading ? "animate-spin" : ""}`} />
          </button>
        )}

        {/* Primary CTA */}
        {ctaLabel && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${a.cta} text-white text-sm font-bold transition-colors`}
          >
            <CtaIcon className="w-4 h-4" />
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
