import { FilePlus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Proformat" };

export default function ProformaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proformat"
        subtitle="Création et gestion des devis proforma."
        accent="amber"
      />
      <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-24 gap-4">
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
