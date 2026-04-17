import { getDeliveryZones } from "@/lib/admin-db";
import DeliveryZonesManager from "@/components/admin/DeliveryZonesManager";

export const metadata = { title: "Zones de livraison" };

export default async function DeliverySettingsPage() {
  const zones = await getDeliveryZones();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Zones de livraison</h1>
        <p className="text-slate-500 text-sm mt-1">Configurez les zones et leurs frais. Ces zones apparaissent dans le formulaire de commande.</p>
      </div>
      <DeliveryZonesManager initialZones={zones} />
    </div>
  );
}
