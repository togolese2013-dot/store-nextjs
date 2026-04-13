import { BarChart2 } from "lucide-react";

export const metadata = { title: "Niveau de stock" };

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Niveau de stock</h1>
        <p className="text-slate-500 text-sm mt-1">Suivi des stocks par produit et par entrepôt.</p>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
          <BarChart2 className="w-8 h-8 text-brand-700" />
        </div>
        <h2 className="font-display font-700 text-lg text-slate-700">Page en construction</h2>
        <p className="text-slate-400 text-sm text-center max-w-xs">
          Le tableau de bord des niveaux de stock sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
