import BroadcastClient from "@/components/admin/BroadcastClient";

export const metadata = { title: "Diffusion WhatsApp" };

export default function BroadcastPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Diffusion WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-1">
          Envoyez un message à plusieurs numéros en une seule fois via WhatsApp Cloud API.
        </p>
      </div>
      <BroadcastClient />
    </div>
  );
}
