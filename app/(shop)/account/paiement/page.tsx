import Link from "next/link";
import { ArrowLeft, Smartphone, Banknote, CreditCard, ShieldCheck } from "lucide-react";

const METHODS = [
  {
    icon:  Banknote,
    label: "Paiement à la livraison",
    desc:  "Payez en cash à la réception de votre colis. Disponible sur tout le Togo.",
    color: "bg-green-50 text-green-700",
    badge: "Disponible",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    icon:  Smartphone,
    label: "Mobile Money",
    desc:  "T-Money, Flooz — bientôt disponible directement sur le site.",
    color: "bg-amber-50 text-amber-700",
    badge: "Bientôt",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon:  CreditCard,
    label: "Carte bancaire",
    desc:  "Paiement sécurisé en ligne — bientôt disponible.",
    color: "bg-blue-50 text-blue-700",
    badge: "Bientôt",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export default function PaiementPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-800 text-slate-900">Paiement</h1>
            <p className="text-sm text-slate-400">Moyens de paiement acceptés</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Methods */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Moyens de paiement</p>
          {METHODS.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`flex items-center gap-4 px-5 py-4 ${i < METHODS.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
            );
          })}
        </div>

        {/* Security note */}
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-brand-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-800 text-brand-800 text-sm">Vos paiements sont sécurisés</p>
            <p className="text-xs text-brand-600 mt-1 leading-relaxed">
              Nous ne collectons aucune donnée bancaire. Le paiement à la livraison vous permet
              de vérifier votre commande avant de payer. Votre satisfaction est notre priorité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
