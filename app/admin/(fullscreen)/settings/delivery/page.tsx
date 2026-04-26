import { getDeliveryZones } from "@/lib/admin-db";
import DeliveryZonesManager from "@/components/admin/DeliveryZonesManager";
import { MapPin } from "lucide-react";

export const metadata = { title: "Zones de livraison" };

export default async function DeliverySettingsPage() {
  const zones = await getDeliveryZones();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Zones de livraison</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configurez les zones et leurs frais — apparaissent dans le formulaire de commande.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-emerald-700" />
        </div>
      </div>
      <div className="max-w-2xl">
        <DeliveryZonesManager initialZones={zones} />
      </div>
    </div>
  );
}
