import { getSettings } from "@/lib/admin-db";
import PaymentMethodsManager from "@/components/admin/PaymentMethodsManager";
import { CreditCard } from "lucide-react";

export const metadata = { title: "Moyens de paiement" };

export default async function PaymentSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Moyens de paiement</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configurez les modes de paiement acceptés sur la boutique.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-emerald-700" />
        </div>
      </div>
      <div className="max-w-2xl">
        <PaymentMethodsManager settings={settings} />
      </div>
    </div>
  );
}
