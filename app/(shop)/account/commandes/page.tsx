"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone, Package, ChevronRight, ArrowLeft,
  Clock, CheckCircle, Truck, XCircle, Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id:              number;
  reference:       string;
  nom:             string;
  telephone:       string;
  total:           number;
  status:          string;
  items:           string | { nom: string; quantite: number; prix: number }[];
  created_at:      string;
}

function statusMeta(status: string) {
  switch (status) {
    case "confirmée":  return { label: "Confirmée",   color: "bg-blue-50 text-blue-700",   icon: CheckCircle };
    case "expédiée":   return { label: "Expédiée",    color: "bg-indigo-50 text-indigo-700", icon: Truck };
    case "livrée":     return { label: "Livrée",      color: "bg-green-50 text-green-700",  icon: CheckCircle };
    case "annulée":    return { label: "Annulée",     color: "bg-red-50 text-red-600",      icon: XCircle };
    default:           return { label: "En attente",  color: "bg-amber-50 text-amber-700",  icon: Clock };
  }
}

function parseItems(raw: string | unknown[]): { nom: string; quantite: number; prix: number }[] {
  if (Array.isArray(raw)) return raw as { nom: string; quantite: number; prix: number }[];
  try { return JSON.parse(raw as string); } catch { return []; }
}

export default function CommandesPage() {
  const [phone, setPhone]       = useState("");
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState("");

  /* Pre-fill phone from profil */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.telephone) setPhone(p.telephone);
      }
    } catch { /* ignore */ }
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const tel = phone.trim();
    if (!tel) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/account/orders?telephone=${encodeURIComponent(tel)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrders(json.orders ?? []);
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  /* Auto-search if phone pre-filled */
  useEffect(() => {
    if (phone) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-800 text-slate-900">Mes commandes</h1>
            <p className="text-sm text-slate-400">Historique &amp; suivi de livraison</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Phone search */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Retrouver mes commandes</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </form>

        {/* Orders list */}
        {searched && !loading && (
          orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Aucune commande trouvée</p>
              <p className="text-sm text-slate-400 mt-1">Vérifiez le numéro de téléphone utilisé lors de la commande.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const meta  = statusMeta(order.status);
                const items = parseItems(order.items);
                const Icon  = meta.icon;
                return (
                  <Link
                    key={order.reference}
                    href={`/account/commandes/${order.reference}`}
                    className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all hover:border-brand-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-800 text-sm text-slate-900">#{order.reference}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          {new Date(order.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                        {items.length > 0 && (
                          <p className="text-sm text-slate-600 line-clamp-1">
                            {items.map(i => `${i.nom} ×${i.quantite}`).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-800 text-slate-900 text-base">{formatPrice(order.total)}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-2" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
