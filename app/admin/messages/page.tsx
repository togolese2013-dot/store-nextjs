import MessagesClient from "@/components/admin/MessagesClient";

export const metadata = { title: "Messages WhatsApp" };

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Messages WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-1">
          Messages reçus via WhatsApp Cloud API. Configurez d'abord le webhook dans Réglages → WhatsApp API.
        </p>
      </div>
      <MessagesClient />
    </div>
  );
}
