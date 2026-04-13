import { FilePlus } from "lucide-react";

export const metadata = { title: "Proformat" };

export default function ProformaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Proformat</h1>
        <p className="text-slate-500 text-sm mt-1">Création et gestion des devis proforma.</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <FilePlus className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="font-display font-700 text-lg text-slate-700">Page en construction</h2>
        <p className="text-slate-400 text-sm text-center max-w-xs">
          La gestion des proforma sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
