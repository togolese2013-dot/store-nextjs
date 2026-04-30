import { getSettings } from "@/lib/admin-db";
import WhatsAppAPISettingsForm from "@/components/admin/WhatsAppAPISettingsForm";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "WhatsApp Cloud API" };

export default async function WhatsAppAPIPage() {
  const settings = await getSettings();
  return (
    <AdminZonePage
      title="WhatsApp Cloud API"
      description="Connectez votre compte Meta Business pour recevoir et envoyer des messages WhatsApp."
      icon={MessageCircle}
      iconClass="bg-emerald-100 text-emerald-700"
      maxWidth="3xl"
    >
      <WhatsAppAPISettingsForm settings={settings} />
    </AdminZonePage>
  );
}
