"use client";

import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderRow {
  id:             number;
  reference:      string;
  nom:            string;
  telephone:      string;
  zone_livraison: string;
  total:          number;
  status:         string;
  created_at:     string;
}

export default function OrdersTableBody({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();

  return (
    <tbody className="divide-y divide-slate-50">
      {orders.map(order => (
        <tr
          key={order.id}
          className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
          onClick={() => router.push(`/admin/orders/${order.id}`)}
        >
          <td className="px-3 sm:px-5 py-3">
            <span className="font-mono text-xs text-emerald-700 font-semibold">
              {order.reference}
            </span>
          </td>
          <td className="px-3 sm:px-4 py-3">
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{order.nom || "—"}</p>
            <p className="text-xs text-slate-400 hidden sm:block">{order.telephone}</p>
          </td>
          <td className="px-3 py-3 text-slate-500 text-xs hidden md:table-cell">
            {order.zone_livraison}
          </td>
          <td className="px-3 sm:px-4 py-3 text-right">
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatPrice(order.total)}</span>
          </td>
          <td className="px-3 sm:px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
            <OrderStatusBadge orderId={order.id} status={order.status} />
          </td>
          <td className="px-3 py-3 text-right text-xs text-slate-400 hidden sm:table-cell">
            {new Date(order.created_at).toLocaleDateString("fr-FR")}
          </td>
        </tr>
      ))}
    </tbody>
  );
}
