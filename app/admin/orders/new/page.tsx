import { getDeliveryZones } from "@/lib/admin-db";
import CreateOrderForm from "@/components/admin/CreateOrderForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nouvelle commande" };

export default async function NewOrderPage() {
  const zones = await getDeliveryZones(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Nouvelle commande</h1>
          <p className="text-slate-500 text-sm mt-0.5">Créer une commande manuellement</p>
        </div>
      </div>

      <CreateOrderForm zones={zones} />
    </div>
  );
}
