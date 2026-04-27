"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package, ChevronRight, ArrowLeft,
  Clock, CheckCircle, Truck, XCircle, Loader2, RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  nom:           string;
  qty?:          number;
  quantite?:     number;
  prix_unitaire?: number;
  prix?:         number;
  total?:        number;
}

interface Order {
  id:         number;
  reference:  string;
  nom:        string;
  telephone:  string;
  total:      number;
  status:     string;
  items:      string | OrderItem[];
  created_at: string;
}

function statusMeta(status: string) {
  switch (status) {
    case "confirmée":  return { label: "Confirmée",  bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   icon: CheckCircle };
    case "expédiée":   return { label: "Expédiée",   bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", icon: Truck };
    case "livrée":     return { label: "Livrée",     bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-500",icon: CheckCircle };
    case "annulée":    return { label: "Annulée",    bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-500",    icon: XCircle };
    default:           return { label: "En attente", bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  icon: Clock };
  }
}

function parseItems(raw: string | unknown[]): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  try { return JSON.parse(raw as string); } catch { return []; }
}

export default function CommandesPage() {
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
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
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href="/account"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-slate-900">Mes commandes</h1>
            <p className="text-xs text-slate-400">Historique &amp; suivi en temps réel</p>
          </div>
          {lastUpdate && (
            <button
              onClick={() => fetchOrders(false)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-700 transition-colors shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24 text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {/* Non connecté */}
        {!loading && error === "non_connecté" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-bold text-lg text-slate-800 mb-1">Connectez-vous pour voir vos commandes</p>
            <p className="text-sm text-slate-400 mb-6">Accès réservé aux clients avec un compte.</p>
            <Link
              href="/account"
              className="inline-block px-6 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        )}

        {/* Autre erreur */}
        {!loading && error && error !== "non_connecté" && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Aucune commande */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-bold text-lg text-slate-800 mb-1">Aucune commande pour le moment</p>
            <p className="text-sm text-slate-400 mb-6">Vos commandes apparaîtront ici après votre premier achat.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Découvrir les produits
            </Link>
          </div>
        )}

        {/* Compteur */}
        {!loading && !error && orders.length > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            <span className="font-bold text-slate-800">{orders.length}</span>{" "}
            commande{orders.length > 1 ? "s" : ""} passée{orders.length > 1 ? "s" : ""}
          </p>
        )}

        {/* Liste des commandes */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => {
              const meta  = statusMeta(order.status);
              const items = parseItems(order.items);
              const StatusIcon = meta.icon;
              return (
                <div
                  key={order.reference}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passée le</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(order.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="text-sm font-bold text-slate-900">{formatPrice(order.total)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">N° de commande</p>
                      <p className="text-sm font-semibold text-brand-700">#{order.reference}</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 flex items-start gap-4">
                    {/* Status */}
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${meta.text}`} />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      {items.length > 0 && (
                        <p className="text-sm text-slate-600 truncate">
                          {items.slice(0, 2).map(i => `${i.nom} ×${i.qty ?? i.quantite ?? 1}`).join(", ")}
                          {items.length > 2 && (
                            <span className="text-slate-400"> +{items.length - 2} article{items.length - 2 > 1 ? "s" : ""}</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/account/commandes/${order.reference}`}
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors whitespace-nowrap"
                    >
                      Voir les détails
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
