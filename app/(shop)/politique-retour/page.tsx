import type { Metadata } from "next";
import Link from "next/link";
import { getSiteName, getSiteUrl } from "@/lib/site-settings";
import { ChevronRight, RefreshCw, Clock, AlertTriangle, PhoneCall, CheckCircle } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, siteUrl] = await Promise.all([getSiteName(), getSiteUrl()]);
  return {
    title: `Politique de retour | ${siteName}`,
    description: `Conditions de retour, échange et remboursement chez ${siteName}. Retours acceptés sous 7 jours.`,
    alternates: { canonical: `${siteUrl}/politique-retour` },
  };
}

export default async function PolitiqueRetourPage() {
  const siteName = await getSiteName();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-medium">Politique de retour</span>
          </nav>
          <h1 className="font-display font-800 text-2xl sm:text-3xl text-slate-900">
            Retours & Remboursements
          </h1>
          <p className="text-slate-400 text-sm mt-2">Dernière mise à jour : {year}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Résumé rapide */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Clock,       label: "Délai de retour",   value: "7 jours",         color: "bg-blue-50 text-blue-700" },
            { icon: RefreshCw,   label: "Échange possible",  value: "Oui",             color: "bg-green-50 text-green-700" },
            { icon: PhoneCall,   label: "Contact retour",    value: "WhatsApp",        color: "bg-emerald-50 text-emerald-700" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="font-display font-700 text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Conditions de retour */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-700 text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" /> Conditions acceptées
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            {[
              { ok: true,  text: "Article retourné dans les 7 jours suivant la livraison" },
              { ok: true,  text: "Produit non utilisé, dans son emballage d'origine" },
              { ok: true,  text: "Tous les accessoires, notices et factures présents" },
              { ok: true,  text: "Défaut constaté à la livraison (produit endommagé ou non conforme)" },
              { ok: false, text: "Articles utilisés, endommagés ou sans emballage" },
              { ok: false, text: "Produits consommables ouverts (batteries, câbles déroulés…)" },
              { ok: false, text: "Retours sans contact préalable avec notre service client" },
            ].map(({ ok, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                  {ok ? "✓" : "✕"}
                </span>
                <span className={ok ? "" : "text-slate-400"}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Procédure */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-700 text-slate-900 mb-4">Procédure de retour</h2>
          <ol className="space-y-4">
            {[
              { step: "1", title: "Contactez-nous", desc: "Envoyez-nous un message WhatsApp avec votre numéro de commande, la photo du produit et le motif du retour." },
              { step: "2", title: "Validation",     desc: "Notre équipe examine votre demande sous 24 à 48 heures et vous confirme l'accord de retour." },
              { step: "3", title: "Renvoi",         desc: "Retournez l'article via notre livreur (frais de retour à notre charge si le produit est défectueux) ou déposez-le en boutique." },
              { step: "4", title: "Remboursement",  desc: "Après réception et vérification, vous êtes remboursé sous 3 à 5 jours ouvrés via le mode de paiement initial, ou échangé si vous préférez." },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Remboursement */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-700 text-slate-900 mb-3">Modes de remboursement</h2>
          <p className="text-sm text-slate-600 mb-3">Le remboursement est effectué selon le mode de paiement initial :</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              "Paiement à la livraison → remboursement en espèces ou Mobile Money",
              "Moov Money → remboursement sur votre numéro Moov",
              "Mixx by Yas → remboursement sur votre compte Yas",
              "Paiement échelonné → remboursement des versements effectués",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Avertissement */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Retour sans accord préalable refusé</p>
            <p>Tout colis retourné sans accord préalable de {siteName} sera refusé et renvoyé à l'expéditeur. Contactez-nous d'abord via WhatsApp.</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cgu" className="text-sm text-brand-700 font-semibold hover:underline">
            → Consulter nos CGU
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
