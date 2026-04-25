import { getOrderById, getOrderEvents } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import OrderTimeline from "@/components/admin/OrderTimeline";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Package, Phone, MapPin, MessageSquare, Link2 } from "lucide-react";

export const metadata = { title: "Détail commande" };

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

interface PageProps { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [order, events] = await Promise.all([
    getOrderById(Number(id)),
    getOrderEvents(Number(id)),
  ]);

  if (!order) notFound();

  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-800 text-2xl text-slate-900">{order.reference}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/orders/${id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger la facture
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — items + status */}
        <div className="lg:col-span-2 space-y-5">

          {/* Articles */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Articles commandés
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Article</th>
                    <th className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Qté</th>
                    <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">P.U.</th>
                    <th className="text-right px-3 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item: { nom: string; reference?: string; qty: number; prix_unitaire: number; total: number }, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{item.nom}</p>
                        {item.reference && <p className="text-xs text-slate-400">{item.reference}</p>}
                      </td>
                      <td className="py-3 text-center text-slate-600">{item.qty}</td>
                      <td className="py-3 text-right text-slate-500">{formatPrice(item.prix_unitaire)}</td>
                      <td className="py-3 text-right font-display font-700 text-slate-900">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Livraison ({order.zone_livraison})</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-display font-800 text-lg text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-emerald-700">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-700 mb-5">Suivi de la livraison</h2>
            <OrderTimeline events={events} currentStatus={order.status} />
          </div>
        </div>

        {/* Right — client info + status change */}
        <div className="space-y-5">

          {/* Client */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-bold text-slate-700">Client</h2>
            <div>
              <p className="font-semibold text-slate-900 text-base">{order.nom || "Client"}</p>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{order.telephone}</span>
              </div>
              {order.adresse && (
                <div className="flex items-start gap-1.5 text-sm text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{order.adresse}</span>
                </div>
              )}
              {(order as any).lien_localisation && (
                <a
                  href={(order as any).lien_localisation}
                  target="_blank" rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" /> Voir sur la carte
                </a>
              )}
              <p className="text-xs text-slate-400 mt-2">Zone : {order.zone_livraison}</p>
            </div>
            {order.note && (
              <div className="bg-amber-50 rounded-2xl px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">{order.note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Changer le statut */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <h2 className="font-bold text-slate-700">Changer le statut</h2>
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
            <p className="text-xs text-slate-400">Le changement de statut est automatiquement enregistré dans l&apos;historique.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
