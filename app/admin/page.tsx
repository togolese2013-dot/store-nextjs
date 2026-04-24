import { getAdminSession } from "@/lib/auth";
import Link from "next/link";
import {
  Package, ShoppingBag, Settings, Users, ArrowRight,
  BarChart2, Globe, Megaphone, Palette, MessageCircle,
} from "lucide-react";

export const metadata = { title: "Accueil Admin" };

const MAIN_MODULES = [
  {
    key:   "magasin",
    label: "Magasin",
    sub:   "GESTION DES STOCKS",
    desc:  "Produits, catégories, marques, fournisseurs, achats",
    href:  "/admin/products",
    icon:  Package,
    grad:  "from-brand-900 to-brand-800",
    dot:   "bg-brand-400",
  },
  {
    key:   "boutique",
    label: "Boutique",
    sub:   "VENTES & CAISSE",
    desc:  "Ventes du jour, stock boutique, finance, clients physiques",
    href:  "/admin/ventes",
    icon:  ShoppingBag,
    grad:  "from-amber-600 to-amber-500",
    dot:   "bg-amber-300",
  },
  {
    key:   "store",
    label: "Store",
    sub:   "E-COMMERCE",
    desc:  "Commandes en ligne, coupons, réglages, paiements, thème",
    href:  "/admin/orders",
    icon:  Settings,
    grad:  "from-emerald-800 to-emerald-700",
    dot:   "bg-emerald-400",
  },
  {
    key:   "crm",
    label: "CRM",
    sub:   "RELATION CLIENT",
    desc:  "Comptes clients, fidélité, parrainage, newsletter, WhatsApp",
    href:  "/admin/crm",
    icon:  Users,
    grad:  "from-indigo-800 to-indigo-700",
    dot:   "bg-indigo-400",
  },
];

const ADMIN_ITEMS = [
  { label: "Rapports",        href: "/admin/rapports",          icon: BarChart2,     desc: "Stats & tendances" },
  { label: "Réglages",        href: "/admin/settings",          icon: Settings,      desc: "Nom, contacts, SEO" },
  { label: "Hero & Bannière", href: "/admin/settings/hero",     icon: Megaphone,     desc: "Slides, images, CTA" },
  { label: "Apparence",       href: "/admin/settings/theme",    icon: Palette,       desc: "Couleurs, fonts, logo" },
  { label: "Domaine & URL",   href: "/admin/settings/domain",   icon: Globe,         desc: "SEO, redirections" },
  { label: "WhatsApp API",    href: "/admin/settings/whatsapp", icon: MessageCircle, desc: "Cloud API, webhook" },
  { label: "Utilisateurs",    href: "/admin/users",             icon: Users,         desc: "Admins & accès" },
];

export default async function AdminHomePage() {
  await getAdminSession();

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-3xl">

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="font-display font-800 text-3xl sm:text-4xl text-slate-900 mb-2">
              Que souhaitez-vous gérer ?
            </h1>
            <p className="text-slate-400 text-sm">Sélectionnez un espace de travail</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">

            {/* 4 main modules */}
            {MAIN_MODULES.map(({ key, label, sub, desc, href, icon: Icon, grad, dot }) => (
              <Link
                key={key}
                href={href}
                className={[
                  `group relative flex flex-col justify-between bg-gradient-to-br ${grad}`,
                  "rounded-2xl p-6 sm:p-8 min-h-[180px] sm:min-h-[210px] overflow-hidden",
                  "hover:shadow-2xl hover:-translate-y-1 transition-all duration-300",
                ].join(" ")}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white/70 text-[10px] font-bold tracking-widest">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {sub}
                  </span>
                </div>

                <div className="relative z-10 mt-4">
                  <h2 className="font-display font-800 text-2xl sm:text-3xl text-white leading-none mb-2">
                    {label}
                  </h2>
                  <p className="text-white/55 text-xs sm:text-sm leading-snug line-clamp-2 mb-4">{desc}</p>
                  <div className="flex items-center gap-1 text-white/0 group-hover:text-white/80 transition-all duration-200 text-xs font-semibold">
                    Accéder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}

            {/* Admin hub — full width */}
            <div className="col-span-2 rounded-2xl overflow-hidden shadow-lg border border-violet-900/20">

              {/* Header strip */}
              <div className="relative bg-gradient-to-br from-violet-900 to-violet-700 px-6 py-4 flex items-center justify-between overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-bold tracking-widest">ADMINISTRATION</p>
                    <h2 className="font-display font-800 text-xl text-white leading-none">Admin</h2>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white/70 text-[10px] font-bold tracking-widest relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
                  CONFIG & RAPPORTS
                </span>
              </div>

              {/* Sub-items grid */}
              <div className="bg-white grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-100">
                {ADMIN_ITEMS.map(({ label, href, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-3 px-5 py-4 hover:bg-violet-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                      <Icon className="w-4 h-4 text-violet-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 text-sm font-semibold leading-tight truncate">{label}</p>
                      <p className="text-slate-400 text-[11px] leading-tight truncate">{desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-violet-500 ml-auto shrink-0 transition-all group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
