import { getSettings } from "@/lib/admin-db";
import WhatsAppAPISettingsForm from "@/components/admin/WhatsAppAPISettingsForm";

export const metadata = { title: "WhatsApp Cloud API" };

export default async function WhatsAppAPIPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">WhatsApp Cloud API</h1>
        <p className="text-slate-500 text-sm mt-1">
          Connectez votre compte Meta Business pour recevoir et envoyer des messages WhatsApp.
        </p>
      </div>
      <WhatsAppAPISettingsForm settings={settings} />
    </div>
  );
}
