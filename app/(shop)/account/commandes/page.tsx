"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package, ChevronRight, ArrowLeft,
  Clock, CheckCircle, Truck, XCircle, Loader2, RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id:           number;
  reference:    string;
  nom:          string;
  telephone:    string;
  total:        number;
  status:       string;
  items:        string | { nom: string; quantite: number; prix: number }[];
  created_at:   string;
}

function statusMeta(status: string) {
  switch (status) {
    case "confirmée":  return { label: "Confirmée",  color: "bg-blue-50 text-blue-700",    icon: CheckCircle };
    case "expédiée":   return { label: "Expédiée",   color: "bg-indigo-50 text-indigo-700", icon: Truck };
    case "livrée":     return { label: "Livrée",     color: "bg-green-50 text-green-700",   icon: CheckCircle };
    case "annulée":    return { label: "Annulée",    color: "bg-red-50 text-red-600",       icon: XCircle };
    default:           return { label: "En attente", color: "bg-amber-50 text-amber-700",   icon: Clock };
  }
}

function parseItems(raw: string | unknown[]): { nom: string; quantite: number; prix: number }[] {
  if (Array.isArray(raw)) return raw as { nom: string; quantite: number; prix: number }[];
  try { return JSON.parse(raw as string); } catch { return []; }
}

export default function CommandesPage() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/account/orders", { credentials: "include" });
      const json = await res.json();
      if (res.status === 401) { setError("non_connecté"); return; }
      if (!res.ok) throw new Error(json.error);
      setOrders(json.orders ?? []);
      setLastUpdate(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-slate-900">Mes commandes</h1>
            <p className="text-sm text-slate-400">Historique &amp; suivi en temps réel</p>
          </div>
          {lastUpdate && (
            <button
              onClick={() => fetchOrders(false)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        )}

        {/* Non connecté */}
        {!loading && error === "non_connecté" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Connectez-vous pour voir vos commandes</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Accès réservé aux clients avec un compte.</p>
            <Link href="/account" className="inline-block px-5 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors">
              Se connecter
            </Link>
          </div>
        )}

        {/* Erreur autre */}
        {!loading && error && error !== "non_connecté" && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Aucune commande */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Aucune commande pour le moment</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Vos commandes apparaîtront ici après votre premier achat.</p>
            <Link href="/products" className="inline-block px-5 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors">
              Découvrir les produits
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map(order => {
              const meta  = statusMeta(order.status);
              const items = parseItems(order.items);
              const Icon  = meta.icon;
              return (
                <Link
                  key={order.reference}
                  href={`/account/commandes/${order.reference}`}
                  className="flex items-start gap-3 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all hover:border-brand-100 active:scale-[0.99]"
                >
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-sm text-slate-900">#{order.reference}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    {items.length > 0 && (
                      <p className="text-sm text-slate-500 truncate">
                        {items.map(i => `${i.nom} ×${i.quantite}`).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Total + arrow */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="font-bold text-slate-900">{formatPrice(order.total)}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
