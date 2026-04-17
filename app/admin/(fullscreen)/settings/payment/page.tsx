import { getSettings } from "@/lib/admin-db";
import PaymentMethodsManager from "@/components/admin/PaymentMethodsManager";

export const metadata = { title: "Moyens de paiement" };

export default async function PaymentSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Moyens de paiement</h1>
        <p className="text-slate-500 text-sm mt-1">Configurez les modes de paiement acceptés sur la boutique.</p>
      </div>
      <PaymentMethodsManager settings={settings} />
    </div>
  );
}
