"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, CheckCircle2, Truck, Clock, XCircle, CreditCard, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { clsx } from "clsx";

interface TrackedOrder {
  id:              number;
  reference:       string;
  nom:             string;
  zone_livraison:  string;
  total:           number;
  status:          string;
  statut_paiement: string | null;
  payment_mode:    string | null;
  created_at:      string;
  item_count:      number;
  item_names:      string[];
}

/* ── Status display config ──────────────────────────────────────────────── */
type StatusKey = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "plan_paiement" | "paye" | "default";

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  pending:       { label: "En attente",    color: "bg-amber-100 text-amber-700 border-amber-200",   icon: <Clock       className="w-4 h-4" />, step: 1 },
  plan_paiement: { label: "Plan de paiement", color: "bg-violet-100 text-violet-700 border-violet-200", icon: <CreditCard className="w-4 h-4" />, step: 1 },
  confirmed:     { label: "Confirmée",     color: "bg-blue-100 text-blue-700 border-blue-200",     icon: <CheckCircle2 className="w-4 h-4" />, step: 2 },
  shipped:       { label: "Expédiée",      color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Truck       className="w-4 h-4" />, step: 3 },
  delivered:     { label: "Livrée",        color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle2 className="w-4 h-4" />, step: 4 },
  cancelled:     { label: "Annulée",       color: "bg-red-100 text-red-700 border-red-200",        icon: <XCircle     className="w-4 h-4" />, step: 0 },
  paye:          { label: "Payée",         color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle2 className="w-4 h-4" />, step: 2 },
  default:       { label: "En cours",      color: "bg-slate-100 text-slate-600 border-slate-200",  icon: <Package     className="w-4 h-4" />, step: 1 },
};

const STEPS = [
  { label: "Reçue",      step: 1 },
  { label: "Confirmée",  step: 2 },
  { label: "Expédiée",   step: 3 },
  { label: "Livrée",     step: 4 },
];

function getStatusConfig(order: TrackedOrder) {
  /* If payment confirmed → show "Confirmée" even if status still 'pending' */
  if (order.statut_paiement === "paye" && order.status === "pending") {
    return STATUS_CONFIG["confirmed"];
  }
  return STATUS_CONFIG[order.status as StatusKey] ?? STATUS_CONFIG["default"];
}

/* ── Order card ─────────────────────────────────────────────────────────── */
function OrderCard({ order }: { order: TrackedOrder }) {
  const cfg  = getStatusConfig(order);
  const step = cfg.step;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-xs text-slate-400 mb-0.5">{order.reference}</p>
          <p className="font-bold text-slate-900">{order.nom || "Client"}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div className={clsx("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border", cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </div>
      </div>

      {/* Progress bar (not for cancelled) */}
      {step > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            {STEPS.map((s, idx) => {
              const active  = step >= s.step;
              const current = step === s.step;
              return (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    active  ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400",
                    current ? "ring-2 ring-emerald-300" : "",
                  )}>
                    {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span className={clsx("text-[10px] font-medium text-center leading-tight",
                    active ? "text-emerald-700" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Connector line */}
          <div className="relative h-1 bg-slate-100 rounded-full mx-3 -mt-8 mb-6">
            <div
              className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((step - 1) / 3) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Payment status */}
      {order.statut_paiement === "paye" ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Paiement confirmé
        </div>
      ) : order.payment_mode && ["moov_direct", "yas_direct"].includes(order.payment_mode) ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Clock className="w-4 h-4 shrink-0" />
          Paiement en attente de vérification
        </div>
      ) : null}

      {/* Items summary */}
      {order.item_names.length > 0 && (
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{order.item_count} article{order.item_count > 1 ? "s" : ""}</span> :{" "}
            {order.item_names.join(", ")}{order.item_names.length < order.item_count ? "…" : ""}
          </p>
        </div>
      )}

      {/* Total + zone */}
      <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
        <span className="text-slate-500">{order.zone_livraison || "Zone non précisée"}</span>
        <span className="font-bold text-slate-900">{formatPrice(order.total)}</span>
      </div>
    </div>
  );
}

/* ── Main search component ──────────────────────────────────────────────── */
function TrackingSearch() {
  const searchParams = useSearchParams();
  const [query,   setQuery]   = useState(searchParams.get("ref") ?? searchParams.get("tel") ?? "");
  const [results, setResults] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [searched, setSearched] = useState(false);

  /* Auto-search when ref comes from URL */
  useEffect(() => {
    const ref = searchParams.get("ref") ?? searchParams.get("tel");
    if (ref && ref.trim().length >= 3) {
      doSearch(ref.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(q: string) {
    setLoading(true);
    setError("");
    setSearched(false);
    try {
      const res  = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur de recherche."); setResults([]); }
      else         { setResults(data.data ?? []); setSearched(true); }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) { setError("Saisissez au moins 3 caractères."); return; }
    doSearch(q);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">

      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
      </Link>

      {/* Title */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-emerald-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Suivi de commande</h1>
        <p className="text-slate-500 text-sm">
          Entrez votre numéro de téléphone ou votre référence de commande.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(""); }}
            placeholder="Ex : 90123456 ou CMD-1234"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
        )}
      </form>

      {/* Results */}
      {searched && results.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700 mb-1">Aucune commande trouvée</p>
          <p className="text-sm">Vérifiez votre numéro de téléphone ou votre référence.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {results.length} commande{results.length > 1 ? "s" : ""} trouvée{results.length > 1 ? "s" : ""}
          </p>
          {results.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuiviCommandePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <span className="w-8 h-8 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    }>
      <TrackingSearch />
    </Suspense>
  );
}
