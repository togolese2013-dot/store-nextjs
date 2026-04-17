import { getAdminSession } from "@/lib/auth";
import Link from "next/link";
import { Package, ShoppingBag, Settings, Users, ArrowRight, Zap, LogOut, BarChart2 } from "lucide-react";

export const metadata = { title: "Accueil Admin" };

const MODULES = [
  {
    key:         "magasin",
    label:       "MAGASIN",
    description: "Produits, catégories, entrepôts, avis clients",
    href:        "/admin/products",
    icon:        Package,
    bg:          "bg-brand-900",
    ring:        "ring-brand-800",
  },
  {
    key:         "boutique",
    label:       "BOUTIQUE",
    description: "Ventes, stock boutique, finance, clients",
    href:        "/admin/ventes",
    icon:        ShoppingBag,
    bg:          "bg-amber-500",
    ring:        "ring-amber-400",
  },
  {
    key:         "store",
    label:       "STORE",
    description: "Commandes, coupons, réglages, thème, paiements",
    href:        "/admin/settings",
    icon:        Settings,
    bg:          "bg-emerald-700",
    ring:        "ring-emerald-600",
  },
  {
    key:         "crm",
    label:       "CRM",
    description: "Clients, messages WhatsApp, diffusion",
    href:        "/admin/crm",
    icon:        Users,
    bg:          "bg-indigo-700",
    ring:        "ring-indigo-600",
  },
  {
    key:         "admin",
    label:       "ADMIN",
    description: "Rapports, statistiques, tendances des ventes",
    href:        "/admin/rapports",
    icon:        BarChart2,
    bg:          "bg-violet-700",
    ring:        "ring-violet-600",
  },
];

export default async function AdminHomePage() {
  const session = await getAdminSession();

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-800 text-sm text-slate-900 leading-none">Togolese Shop</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session && (
            <p className="text-sm text-slate-500 hidden sm:block">
              Bonjour, <span className="font-semibold text-slate-800">{session.nom}</span>
            </p>
          )}
          <Link
            href="/"
            target="_blank"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Voir le site →
          </Link>
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="font-display font-800 text-3xl sm:text-4xl text-slate-900">
              Que souhaitez-vous gérer ?
            </h1>
            <p className="text-slate-400 text-sm mt-2">Sélectionnez un espace de travail</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {MODULES.map(({ key, label, description, href, icon: Icon, bg, ring }, idx) => (
              <Link
                key={key}
                href={href}
                className={`group relative flex flex-col justify-between ${bg} ring-1 ${ring} rounded-2xl p-6 sm:p-8 min-h-[170px] sm:min-h-[200px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300${idx === MODULES.length - 1 && MODULES.length % 2 !== 0 ? " col-span-2 max-w-sm mx-auto w-full" : ""}`}
              >
                {/* Decorative circle */}
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

                {/* Icon */}
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text */}
                <div>
                  <h2 className="font-display font-800 text-2xl sm:text-3xl text-white tracking-wide leading-none mb-1.5">
                    {label}
                  </h2>
                  <p className="text-white/65 text-xs sm:text-sm leading-snug">{description}</p>
                  <div className="flex items-center gap-1 mt-3 text-white/0 group-hover:text-white/90 transition-colors text-xs font-semibold">
                    Accéder <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
