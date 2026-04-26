import { listCoupons } from "@/lib/admin-db";
import CouponsManager from "@/components/admin/CouponsManager";
import { Tag } from "lucide-react";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const coupons = await listCoupons();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Coupons de réduction</h1>
          <p className="text-sm text-slate-500 mt-0.5">Créez et gérez les codes promo pour vos clients.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Tag className="w-5 h-5 text-emerald-700" />
        </div>
      </div>

      <CouponsManager initialCoupons={coupons} />
    </div>
  );
}
