import { getDashboardStats } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart, Package, MessageCircle, TrendingUp,
  Clock, CheckCircle2, Truck, XCircle, ArrowRight,
} from "lucide-react";

export const metadata = { title: "Tableau de bord" };

function StatCard({
  label, value, icon: Icon, color, href,
}: { label: string; value: string | number; icon: React.ElementType; color: string; href?: string }) {
  const inner = (
    <div className={`bg-white rounded-3xl border border-slate-100 p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-slate-300" />}
      </div>
      <p className="font-display font-800 text-2xl text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const STATUS_STYLES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "En attente",  color: "bg-amber-100 text-amber-700",  icon: Clock },
  confirmed: { label: "Confirmée",   color: "bg-blue-100 text-blue-700",    icon: CheckCircle2 },
  shipped:   { label: "Expédiée",    color: "bg-purple-100 text-purple-700", icon: Truck },
  delivered: { label: "Livrée",      color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  cancelled: { label: "Annulée",     color: "bg-red-100 text-red-700",      icon: XCircle },
};

export default async function AdminDashboardPage() {
  const [session, stats] = await Promise.all([
    getAdminSession(),
    getDashboardStats(),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">
          {greeting}, {session?.nom ?? "Admin"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Voici un résumé de l'activité des 30 derniers jours.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Commandes (30j)"   value={stats.orders30d}                   icon={ShoppingCart}   color="bg-brand-900"   href="/admin/orders" />
        <StatCard label="Chiffre (30j)"     value={formatPrice(stats.revenue30d)}     icon={TrendingUp}     color="bg-accent-500" />
        <StatCard label="Produits actifs"   value={stats.productsActive}              icon={Package}        color="bg-emerald-600" href="/admin/products" />
        <StatCard label="Messages non lus"  value={stats.unreadMessages}              icon={MessageCircle}  color="bg-[#25D366]"  href="/admin/messages" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-700 text-slate-900">Dernières commandes</h2>
          <Link href="/admin/orders"
            className="text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune commande pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {stats.recentOrders.map((order) => {
              const s = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              const Icon = s.icon;
              return (
                <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">
                      {order.nom || "Client"}{" "}
                      <span className="font-normal text-slate-400 text-xs">#{order.reference}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.telephone} · {order.zone_livraison}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-700 text-sm text-slate-900">{formatPrice(order.total)}</p>
                    <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                    <Icon className="w-3 h-3" /> {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Nouveau produit",  href: "/admin/products/new",       icon: Package,       color: "bg-brand-50 text-brand-700 border-brand-200" },
          { label: "Voir les messages", href: "/admin/messages",           icon: MessageCircle, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "Gérer les zones",  href: "/admin/settings/delivery",  icon: ShoppingCart,  color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: "Réglages",         href: "/admin/settings",           icon: TrendingUp,    color: "bg-purple-50 text-purple-700 border-purple-200" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={label} href={href}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-semibold text-sm transition-all hover:shadow-sm ${color}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
