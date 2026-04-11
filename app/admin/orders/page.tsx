import { listOrders, countOrders } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";

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

interface PageProps { searchParams: Promise<{ page?: string }> }

export default async function OrdersPage({ searchParams }: PageProps) {
  const sp     = await searchParams;
  const page   = Math.max(1, Number(sp.page) || 1);
  const limit  = 25;
  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    listOrders(limit, offset),
    countOrders(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Commandes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} commande{total > 1 ? "s" : ""} au total</p>
        </div>
        <Link href="/admin/orders/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Nouvelle commande
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucune commande</p>
          </div>
        ) : (
          <>
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
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs text-brand-600 hover:underline">
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {page}/{totalPages}</p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/admin/orders?page=${page - 1}`}
                      className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 transition-colors"
                    >← Préc.</Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/admin/orders?page=${page + 1}`}
                      className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-brand-400 transition-colors"
                    >Suiv. →</Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
