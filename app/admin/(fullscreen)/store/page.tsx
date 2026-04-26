import { getOrdersStats, getSettings, listReviews } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";
import Link from "next/link";
import {
  ShoppingCart, DollarSign, TrendingUp, Clock,
  Users, Star, CheckCircle, XCircle, Truck, Package,
  ArrowRight,
} from "lucide-react";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import StoreUrlEditor from "@/components/admin/StoreUrlEditor";

export const metadata = { title: "Dashboard Store" };

/* ── Mini bar chart ── */
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 300, H = 60, BAR_W = 30, GAP = 8;
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
            <rect x={x} y={y} width={BAR_W} height={barH} rx={5}
              fill={isToday ? "#059669" : "#d1fae5"} />
            <text x={x + BAR_W / 2} y={H} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {d.date.slice(5)}
            </text>
            {d.count > 0 && (
              <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" fontSize="9"
                fontWeight="600" fill={isToday ? "#059669" : "#64748b"}>
                {d.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const FUNNEL = [
  { key: "en attente", label: "En attente", icon: Clock,       color: "bg-amber-100 text-amber-600",  bar: "bg-amber-400" },
  { key: "confirmée",  label: "Confirmées", icon: CheckCircle, color: "bg-blue-100 text-blue-600",    bar: "bg-blue-400" },
  { key: "expédiée",   label: "Expédiées",  icon: Truck,       color: "bg-purple-100 text-purple-600",bar: "bg-purple-400" },
  { key: "livrée",     label: "Livrées",    icon: Package,     color: "bg-green-100 text-green-600",  bar: "bg-emerald-500" },
  { key: "annulée",    label: "Annulées",   icon: XCircle,     color: "bg-red-100 text-red-600",      bar: "bg-red-400" },
];

export default async function StoreDashboardPage() {
  const [stats, settings, reviews] = await Promise.all([
    getOrdersStats(),
    getSettings(),
    listReviews(),
  ]);

  /* Client accounts count */
  let clientCount = 0;
  try {
    const pool = db as import("mysql2/promise").Pool;
    const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM client_users"
    );
    clientCount = Number(row?.cnt ?? 0);
  } catch { /* table may not exist yet */ }

  /* Reviews stats */
  const approvedReviews = reviews.filter(r => r.approved);
  const avgRating = approvedReviews.length
    ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length
    : 0;

  /* 7-day trend */
  const today = new Date();
  const trend: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = stats.trend7d.find(t => t.date === key);
    trend.push({ date: key, count: found?.count ?? 0 });
  }

  const siteUrl   = settings.site_url   || process.env.NEXT_PUBLIC_SITE_URL || "";
  const shareText = settings.store_share_text ||
    `🛍️ Découvrez notre boutique en ligne !\n\n${siteUrl}\n\nLivraison rapide partout au Togo 🇹🇬`;

  const total = stats.totalOrders;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Dashboard Store</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble de la boutique en ligne</p>
        </div>
        <Link
          href="/admin/orders/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-colors"
        >
          <ShoppingCart className="w-4 h-4" /> Nouvelle commande
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: DollarSign, label: "CA total",
            value: formatPrice(stats.totalRevenue),
            sub: `${formatPrice(stats.revenue30d)} ce mois`,
            bg: "bg-emerald-50", iconColor: "text-emerald-700",
          },
          {
            icon: ShoppingCart, label: "Commandes (30j)",
            value: String(stats.orders30d),
            sub: `${stats.ordersToday} aujourd'hui`,
            bg: "bg-blue-50", iconColor: "text-blue-600",
          },
          {
            icon: TrendingUp, label: "Panier moyen",
            value: formatPrice(stats.avgOrderValue),
            sub: `sur ${total} commandes`,
            bg: "bg-purple-50", iconColor: "text-purple-600",
          },
          {
            icon: Clock, label: "En attente",
            value: String(stats.byStatus["en attente"] ?? stats.byStatus["pending"] ?? 0),
            sub: `${stats.byStatus["confirmée"] ?? stats.byStatus["confirmed"] ?? 0} confirmée(s)`,
            bg: "bg-amber-50", iconColor: "text-amber-600",
          },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon className={`w-5 h-5 ${k.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide truncate">{k.label}</p>
              <p className="font-bold text-slate-900 text-lg leading-tight">{k.value}</p>
              <p className="text-xs text-slate-400 truncate">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Clients inscrits</p>
            <p className="font-bold text-slate-900 text-lg">{clientCount}</p>
            <Link href="/admin/comptes-clients" className="text-xs text-indigo-600 hover:underline">Voir les comptes →</Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avis clients</p>
            <p className="font-bold text-slate-900 text-lg">
              {approvedReviews.length}
              {approvedReviews.length > 0 && (
                <span className="text-sm font-normal text-slate-500 ml-1">· {avgRating.toFixed(1)} ★</span>
              )}
            </p>
            <Link href="/admin/reviews" className="text-xs text-amber-600 hover:underline">Gérer les avis →</Link>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-slate-900 text-sm">Commandes — 7 derniers jours</p>
              <p className="text-xs text-slate-400 mt-0.5">{stats.orders7d} commande{stats.orders7d > 1 ? "s" : ""} cette semaine</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
              {formatPrice(stats.trend7d.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <MiniBarChart data={trend} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <p className="font-bold text-slate-900 text-sm mb-4">Répartition par statut</p>
          <div className="space-y-2.5">
            {FUNNEL.map(step => {
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
                    <div className={`h-full rounded-full transition-all ${step.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── URL + Partage ── */}
      <StoreUrlEditor initialUrl={siteUrl} initialShareText={shareText} />

      {/* ── Commandes récentes ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-900 text-sm">Commandes récentes</p>
          <Link href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
            Toutes les commandes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold text-sm">Aucune commande pour le moment</p>
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
                      <span className="font-bold text-slate-900">{formatPrice(order.total)}</span>
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
