import PaymentPlansManager from "@/components/admin/PaymentPlansManager";

export const metadata = { title: "Paiements échelonnés" };

export default function PaiementsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Paiements échelonnés</h1>
        <p className="text-sm text-slate-400 mt-1">
          Gérez les plans de paiement en 2, 3 ou 4 fois. Marquez chaque tranche reçue pour suivre la progression.
        </p>
      </div>
      <PaymentPlansManager />
    </div>
  );
}
