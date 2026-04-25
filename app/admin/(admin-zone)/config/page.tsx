import { getAdminSession } from "@/lib/auth";
import Link from "next/link";
import {
  BarChart2, Settings, Megaphone, Palette,
  Globe, MessageCircle, Users, ArrowRight, ChevronLeft,
} from "lucide-react";

export const metadata = { title: "Admin — Configuration" };

const ITEMS = [
  {
    label: "Rapports",
    desc:  "Statistiques de ventes, tendances, performances",
    href:  "/admin/rapports",
    icon:  BarChart2,
    color: "bg-violet-100 text-violet-700",
  },
  {
    label: "Réglages généraux",
    desc:  "Nom du site, slogan, numéros WhatsApp flottant",
    href:  "/admin/settings",
    icon:  Settings,
    color: "bg-slate-100 text-slate-700",
  },
  {
    label: "Hero & Bannière",
    desc:  "Slides du carousel hero, images, CTA et barre d'annonce",
    href:  "/admin/settings/hero",
    icon:  Megaphone,
    color: "bg-brand-100 text-brand-700",
  },
  {
    label: "Apparence",
    desc:  "Couleurs, police, logo et pied de page du site vitrine",
    href:  "/admin/settings/theme",
    icon:  Palette,
    color: "bg-pink-100 text-pink-700",
  },
  {
    label: "Domaine & URL",
    desc:  "Domaine personnalisé, redirections, SEO",
    href:  "/admin/settings/domain",
    icon:  Globe,
    color: "bg-sky-100 text-sky-700",
  },
  {
    label: "WhatsApp API",
    desc:  "Configuration Cloud API, webhook, messages automatiques",
    href:  "/admin/settings/whatsapp",
    icon:  MessageCircle,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Utilisateurs",
    desc:  "Comptes administrateurs et gestion des accès",
    href:  "/admin/users",
    icon:  Users,
    color: "bg-indigo-100 text-indigo-700",
  },
];

export default async function AdminConfigPage() {
  await getAdminSession();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-display font-800 text-2xl text-slate-900">Administration</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration du site, apparence et gestion des accès.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {ITEMS.map(({ label, desc, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm leading-tight">{label}</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug line-clamp-2">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-violet-500 shrink-0 transition-all group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

    </div>
  );
}
