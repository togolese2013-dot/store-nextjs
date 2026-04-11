import { notFound } from "next/navigation";
import { getClientById, getClientOrders, getClientStats } from "@/lib/admin-db";
import Link from "next/link";
import { ChevronLeft, Phone, MapPin, Crown, Ban, User, ShoppingCart, TrendingUp, Calendar, FileText } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import ClientEditForm from "@/components/admin/ClientEditForm";

export const metadata = { title: "Fiche client" };

interface PageProps { params: Promise<{ id: string }> }

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(Number(id));
  if (!client) notFound();

  const [orders, stats] = await Promise.all([
    getClientOrders(client.telephone),
    getClientStats(client.telephone),
  ]);

  const STATUS_ICON = {
    normal:    <User className="w-4 h-4" />,
    vip:       <Crown className="w-4 h-4 text-amber-500" />,
    blacklist: <Ban className="w-4 h-4 text-red-500" />,
  };

  const statusColors = {
    normal:    "bg-slate-100 text-slate-700",
    vip:       "bg-amber-100 text-amber-700",
    blacklist: "bg-red-100 text-red-700",
  };

  const orderStatusColors: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped:   "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const orderStatusLabels: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée",
    delivered: "Livrée", cancelled: "Annulée",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/crm" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-lg shrink-0">
            {(client.nom || client.telephone).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-800 text-xl text-slate-900">
              {client.nom || <span className="text-slate-400 italic font-normal">Sans nom</span>}
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Phone className="w-3.5 h-3.5" />
              {client.telephone}
              {client.ville && <><MapPin className="w-3.5 h-3.5 ml-1" />{client.ville}</>}
            </div>
          </div>
          <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${statusColors[client.statut]}`}>
            {STATUS_ICON[client.statut]} {client.statut === "vip" ? "VIP" : client.statut === "blacklist" ? "Blacklist" : "Normal"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingCart, label: "Commandes",      value: String(stats.total_orders), color: "bg-brand-50 text-brand-700" },
          { icon: TrendingUp,   label: "CA total",        value: formatPrice(stats.total_spent),  color: "bg-green-50 text-green-700" },
          { icon: FileText,     label: "Panier moyen",    value: formatPrice(stats.avg_basket),   color: "bg-accent-50 text-accent-700" },
          { icon: Calendar,     label: "Dernière commande",
            value: stats.last_order_at ? new Date(stats.last_order_at).toLocaleDateString("fr-FR") : "—",
            color: "bg-slate-50 text-slate-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            <p className="font-display font-800 text-slate-900 text-lg leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <ClientEditForm client={client} />
        </div>

        {/* Orders history */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Historique des commandes ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune commande</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {orders.map(o => (
                  <div key={o.id} className="px-5 py-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{o.reference}</p>
                      <p className="text-xs text-slate-400">{o.zone_livraison} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                      {o.note && <p className="text-xs text-slate-500 mt-0.5 italic">"{o.note}"</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{formatPrice(o.total)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold mt-1 ${orderStatusColors[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {orderStatusLabels[o.status] ?? o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
