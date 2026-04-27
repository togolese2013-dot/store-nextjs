import { getOrdersStats } from "@/lib/admin-db";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import OrdersTableBody from "@/components/admin/OrdersTableBody";

export const metadata = { title: "Commandes" };

export default async function OrdersPage() {
  const stats = await getOrdersStats();
  const total = stats.totalOrders;

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

      {/* ── Orders table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-sm">Toutes les commandes</p>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-px">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-3 sm:px-5 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Réf.</th>
                  <th className="text-left px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Client</th>
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden md:table-cell">Zone</th>
                  <th className="text-right px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Total</th>
                  <th className="text-center px-3 sm:px-4 py-3 font-bold text-xs uppercase tracking-widest text-slate-400">Statut</th>
                  <th className="text-right px-3 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <OrdersTableBody orders={stats.recentOrders} />
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
