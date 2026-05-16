"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, TrendingUp, Users, AlertTriangle, Store } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface KpiData {
  orders_today:    number;
  ca_today:        number;
  orders_pending:  number;
  ventes_today:    number;
  ca_ventes_today: number;
  clients_today:   number;
  low_stock:       number;
  ca_week:         number;
}

function KpiCard({ icon: Icon, label, value, sub, color, href }: {
  icon:   React.ElementType;
  label:  string;
  value:  string;
  sub?:   string;
  color:  string;
  href?:  string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3 hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
  if (href) return <a href={href}>{content}</a>;
  return content;
}

export default function DashboardKpis() {
  const [data,    setData]    = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-20 animate-pulse" />
      ))}
    </div>
  );

  if (!data) return null;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aujourd'hui</h2>
        <span className="text-[10px] text-slate-300">Actualisation auto · 60s</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={ShoppingBag}
          label="Commandes en ligne"
          value={String(data.orders_today)}
          sub={data.ca_today > 0 ? formatPrice(data.ca_today) : "Aucune commande"}
          color="bg-emerald-500"
          href="/admin/orders"
        />
        <KpiCard
          icon={Clock}
          label="En attente"
          value={String(data.orders_pending)}
          sub="commande(s) à traiter"
          color={data.orders_pending > 0 ? "bg-orange-500" : "bg-slate-300"}
          href="/admin/orders"
        />
        <KpiCard
          icon={Store}
          label="Ventes boutique"
          value={String(data.ventes_today)}
          sub={data.ca_ventes_today > 0 ? formatPrice(data.ca_ventes_today) : "Aucune vente"}
          color="bg-amber-500"
          href="/admin/ventes"
        />
        <KpiCard
          icon={TrendingUp}
          label="CA semaine"
          value={formatPrice(data.ca_week)}
          sub="7 derniers jours"
          color="bg-indigo-500"
        />
      </div>
      {(data.clients_today > 0 || data.low_stock > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {data.clients_today > 0 && (
            <KpiCard
              icon={Users}
              label="Nouveaux clients"
              value={String(data.clients_today)}
              sub="aujourd'hui"
              color="bg-blue-500"
              href="/admin/boutique-clients"
            />
          )}
          {data.low_stock > 0 && (
            <KpiCard
              icon={AlertTriangle}
              label="Stock faible"
              value={String(data.low_stock)}
              sub="produit(s) ≤ 3 unités"
              color="bg-red-500"
              href="/admin/stock"
            />
          )}
        </div>
      )}
    </div>
  );
}
