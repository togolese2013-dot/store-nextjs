import { getOrdersStats } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import Link from "next/link";
import {
  ShoppingCart, Plus, TrendingUp, DollarSign,
  Clock, CheckCircle, XCircle, Truck, Package,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Commandes" };

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending:   "En attente",
  confirmed: "Confirmée",
  shipped:   "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

// ─── Mini bar chart (pure SVG) ────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 280, H = 56, BAR_W = 28, GAP = 8;
  const total = data.length;
  const startX = (W - total * (BAR_W + GAP) + GAP) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14">
      {data.map((d, i) => {
        const barH = Math.max(4, (d.count / max) * (H - 16));
        const x = startX + i * (BAR_W + GAP);
        const y = H - barH;
        const isToday = i === data.length - 1;
        return (
          <g key={d.date}>
            <rect
              x={x} y={y} width={BAR_W} height={barH}
              rx={5}
              fill={isToday ? "#059669" : "#d1fae5"}
            />
            <text
              x={x + BAR_W / 2} y={H}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
            >
              {d.date.slice(5)}
            </text>
            {d.count > 0 && (
              <text
                x={x + BAR_W / 2} y={y - 3}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={isToday ? "#059669" : "#64748b"}
              >
                {d.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Status funnel ────────────────────────────────────────────────────────────

const FUNNEL_STEPS = [
  { key: "pending",   label: "En attente", icon: Clock,        color: "bg-amber-100 text-amber-600",  bar: "bg-amber-400" },
  { key: "confirmed", label: "Confirmées", icon: CheckCircle,  color: "bg-blue-100 text-blue-600",    bar: "bg-blue-400" },
  { key: "shipped",   label: "Expédiées",  icon: Truck,        color: "bg-purple-100 text-purple-600",bar: "bg-purple-400" },
  { key: "delivered", label: "Livrées",    icon: Package,      color: "bg-green-100 text-green-600",  bar: "bg-emerald-500" },
  { key: "cancelled", label: "Annulées",   icon: XCircle,      color: "bg-red-100 text-red-600",      bar: "bg-red-400" },
];

export default async function OrdersPage() {
  const stats = await getOrdersStats();
  const total = stats.totalOrders;

  // Fill missing days in the 7-day trend
  const today = new Date();
  const trend: { date: string; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = stats.trend7d.find(t => t.date === key);
    trend.push({ date: key, count: found?.count ?? 0, revenue: found?.revenue ?? 0 });
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Commandes"
        subtitle={`${total} commande${total > 1 ? "s" : ""} au total`}
        accent="emerald"
        extra={
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle commande
          </Link>
        }
      />

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon:  DollarSign,
            label: "CA total",
            value: formatPrice(stats.totalRevenue),
            sub:   `${formatPrice(stats.revenue30d)} ce mois`,
            bg:    "bg-emerald-50",
            iconColor: "text-emerald-700",
          },
          {
            icon:  ShoppingCart,
            label: "Commandes (30j)",
            value: String(stats.orders30d),
            sub:   `${stats.ordersToday} aujourd'hui`,
            bg:    "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            icon:  TrendingUp,
            label: "Panier moyen",
            value: formatPrice(stats.avgOrderValue),
            sub:   `sur ${total} commandes`,
            bg:    "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            icon:  Clock,
            label: "En attente",
            value: String(stats.byStatus["pending"] ?? 0),
            sub:   `${stats.byStatus["confirmed"] ?? 0} confirmée${(stats.byStatus["confirmed"] ?? 0) > 1 ? "s" : ""}`,
            bg:    "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon className={`w-5 h-5 ${k.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide truncate">{k.label}</p>
              <p className="font-display font-800 text-slate-900 text-xl leading-tight">{k.value}</p>
              <p className="text-xs text-slate-400 truncate">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart — 7 days */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-slate-900 text-sm">Commandes — 7 derniers jours</p>
              <p className="text-xs text-slate-400 mt-0.5">{stats.orders7d} commande{stats.orders7d > 1 ? "s" : ""} cette semaine</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
              {formatPrice(trend.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <MiniBarChart data={trend} />
        </div>

        {/* Status funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <p className="font-bold text-slate-900 text-sm mb-4">Répartition par statut</p>
          <div className="space-y-2.5">
            {FUNNEL_STEPS.map(step => {
              const count = stats.byStatus[step.key] ?? 0;
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={step.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg ${step.color} flex items-center justify-center`}>
                        <step.icon className="w-3 h-3" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{step.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${step.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent orders table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-900 text-sm">Commandes récentes</p>
          <Link
            href="/admin/orders/all"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Réf.</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Client</th>
                  <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden md:table-cell">Zone</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Total</th>
                  <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-emerald-700 hover:underline">
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{order.nom || "—"}</p>
                      <p className="text-xs text-slate-400">{order.telephone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{order.zone_livraison}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-700 text-slate-900">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
