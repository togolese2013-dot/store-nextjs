"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";

interface CachedOrder {
  id:             number;
  reference:      string;
  nom:            string;
  telephone:      string;
  zone_livraison: string;
  total:          number;
  status:         string;
  created_at:     string;
  _cached_at?:    number;
}

export default function OfflinePage() {
  const [orders,    setOrders]    = useState<CachedOrder[]>([]);
  const [cachedAt,  setCachedAt]  = useState<number | null>(null);
  const [isOnline,  setIsOnline]  = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cached orders from Service Worker cache
    loadCachedOrders();

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function loadCachedOrders() {
    try {
      if (!("caches" in window)) return;
      const cache    = await caches.open("ts-admin-orders-v1");
      const keys     = await cache.keys();
      // Find the orders page=1 entry
      const match    = keys.find(k => k.url.includes("/api/admin/orders"));
      if (!match) return;
      const response = await cache.match(match);
      if (!response) return;
      const data     = await response.json();
      if (data?.data?.length) {
        setOrders(data.data);
        if (data._cached_at) setCachedAt(data._cached_at);
      }
    } catch {
      // Cache API not available or empty
    }
  }

  function formatCachedAt(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString("fr-TG", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleString("fr-TG", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending:   { label: "En attente",  color: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmée",   color: "bg-blue-100 text-blue-700" },
    shipped:   { label: "En livraison",color: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Livrée",      color: "bg-green-100 text-green-700" },
    cancelled: { label: "Annulée",     color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-12">

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Mode hors-ligne</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Vous êtes actuellement sans connexion internet.
          {orders.length > 0
            ? " Voici les commandes enregistrées localement."
            : " Aucune donnée en cache disponible pour l'instant."}
        </p>

        {cachedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Données enregistrées à {formatCachedAt(cachedAt)}
          </div>
        )}
      </div>

      {/* Online → redirect button */}
      {isOnline ? (
        <div className="mb-6 text-center">
          <p className="text-sm text-green-600 font-semibold mb-3">Connexion rétablie !</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retour aux commandes
          </Link>
        </div>
      ) : (
        <button
          onClick={loadCachedOrders}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors mb-6"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser le cache
        </button>
      )}

      {/* Cached orders list */}
      {orders.length > 0 ? (
        <div className="w-full max-w-2xl space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">
            {orders.length} commande{orders.length > 1 ? "s" : ""} en cache
          </h2>
          {orders.map((order) => {
            const s = statusLabels[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600" };
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-900">{order.reference}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {order.nom || "Client"} · {order.telephone} · {order.zone_livraison}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">
                    {order.total.toLocaleString("fr-TG")} FCFA
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400 mt-4">
          <ShoppingBag className="w-10 h-10" strokeWidth={1} />
          <p className="text-sm">Aucune commande en cache</p>
          <p className="text-xs text-center max-w-xs">
            Visitez la page des commandes quand vous êtes en ligne pour les enregistrer localement.
          </p>
        </div>
      )}
    </div>
  );
}
