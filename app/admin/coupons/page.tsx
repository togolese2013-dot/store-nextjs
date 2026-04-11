import { listCoupons } from "@/lib/admin-db";
import CouponsManager from "@/components/admin/CouponsManager";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const coupons = await listCoupons();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Coupons de réduction</h1>
        <p className="text-slate-500 text-sm mt-1">Créez des codes promo pour vos clients.</p>
      </div>
      <CouponsManager initialCoupons={coupons} />
    </div>
  );
}
