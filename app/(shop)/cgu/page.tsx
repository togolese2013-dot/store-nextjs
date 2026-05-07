import type { Metadata } from "next";
import Link from "next/link";
import { getSiteName, getSiteUrl } from "@/lib/site-settings";
import { ChevronRight, Shield, Scale, FileText, Mail } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, siteUrl] = await Promise.all([getSiteName(), getSiteUrl()]);
  return {
    title: `CGU & Mentions légales | ${siteName}`,
    description: `Conditions générales d'utilisation, mentions légales et politique de confidentialité de ${siteName}.`,
    alternates: { canonical: `${siteUrl}/cgu` },
  };
}

export default async function CguPage() {
  const siteName = await getSiteName();
  const year = new Date().getFullYear();

  const sections = [
    {
      icon: FileText,
      title: "1. Présentation du site",
      content: `${siteName} est une boutique en ligne proposant des produits électroniques, accessoires et divers articles, livrés au Togo et principalement à Lomé. L'utilisation du site implique l'acceptation pleine et entière des présentes conditions.`,
    },
    {
      icon: Scale,
      title: "2. Conditions d'utilisation",
      content: `Le site est accessible à tout utilisateur disposant d'un accès Internet. Tous les frais d'accès sont à la charge de l'utilisateur. ${siteName} se réserve le droit de modifier ou supprimer tout contenu à tout moment sans préavis. L'utilisateur s'engage à ne pas utiliser le site à des fins illicites ou frauduleuses.`,
    },
    {
      icon: Shield,
      title: "3. Propriété intellectuelle",
      content: `L'ensemble des éléments du site (textes, images, logos, icônes) sont la propriété exclusive de ${siteName} ou de leurs auteurs respectifs. Toute reproduction, même partielle, est strictement interdite sans autorisation écrite préalable.`,
    },
    {
      icon: Mail,
      title: "4. Données personnelles",
      content: `Les informations collectées (nom, téléphone, adresse) servent uniquement au traitement de vos commandes et à l'amélioration de nos services. Conformément aux lois en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer, contactez-nous par WhatsApp ou email.`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
            <Link href="/" className="hover:text-brand-700 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600 font-medium">CGU & Mentions légales</span>
          </nav>
          <h1 className="font-display font-800 text-2xl sm:text-3xl text-slate-900">
            CGU & Mentions légales
          </h1>
          <p className="text-slate-400 text-sm mt-2">Dernière mise à jour : {year}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {sections.map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-700" />
              </div>
              <h2 className="font-display font-700 text-slate-900">{title}</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
          </div>
        ))}

        {/* Responsabilité */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-700 text-slate-900 mb-3">5. Limitation de responsabilité</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {siteName} s'efforce d'assurer l'exactitude des informations publiées sur le site. Cependant, nous ne pouvons garantir l'absence d'erreurs. La responsabilité de {siteName} ne saurait être engagée pour :
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {[
              "Des imprécisions ou omissions dans les informations disponibles",
              "Des interruptions temporaires d'accès au site",
              "Des dommages directs ou indirects liés à l'utilisation du site",
              "Des retards de livraison dus à des circonstances exceptionnelles (intempéries, grèves, etc.)",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Droit applicable */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-700 text-slate-900 mb-3">6. Droit applicable</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Les présentes CGU sont soumises au droit togolais. En cas de litige, les tribunaux compétents de Lomé (Togo) seront seuls compétents.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6 flex items-start gap-4">
          <Mail className="w-5 h-5 text-brand-700 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-display font-700 text-slate-900 mb-1">Contact</h2>
            <p className="text-sm text-slate-600">
              Pour toute question relative à ces CGU ou à vos données personnelles, contactez-nous via WhatsApp ou depuis la page d'accueil du site.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/politique-retour" className="text-sm text-brand-700 font-semibold hover:underline">
            → Politique de retour & remboursement
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
