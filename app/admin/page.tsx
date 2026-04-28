import { getAdminSession } from "@/lib/auth";
import { getAccessibleModules } from "@/lib/admin-permissions";
import Link from "next/link";
import { Package, ShoppingBag, Settings, Users, ArrowRight, BarChart2 } from "lucide-react";

export const metadata = { title: "Accueil Admin" };

const ALL_MODULES = [
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
    desc:  "Commandes en ligne, coupons, zones de livraison, paiements",
    href:  "/admin/store",
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
  {
    key:   "admin",
    label: "Admin",
    sub:   "CONFIG & RAPPORTS",
    desc:  "Réglages, apparence, hero, domaine, utilisateurs, rapports",
    href:  "/admin/config",
    icon:  BarChart2,
    grad:  "from-violet-800 to-violet-700",
    dot:   "bg-violet-400",
  },
];

export default async function AdminHomePage() {
  const session = await getAdminSession();
  const accessible = session
    ? new Set(getAccessibleModules(session.role, session.permissions))
    : new Set<string>();

  const MODULES = ALL_MODULES.filter(m => accessible.has(m.key));

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-3xl">

          <div className="text-center mb-10">
            <h1 className="font-display font-800 text-3xl sm:text-4xl text-slate-900 mb-2">
              Que souhaitez-vous gérer ?
            </h1>
            <p className="text-slate-400 text-sm">Sélectionnez un espace de travail</p>
          </div>

          {MODULES.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-semibold mb-2">Aucun accès configuré</p>
              <p className="text-sm">Contactez votre administrateur pour obtenir des permissions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {MODULES.map(({ key, label, sub, desc, href, icon: Icon, grad, dot }, idx) => (
                <Link
                  key={key}
                  href={href}
                  className={[
                    `group relative flex flex-col justify-between bg-gradient-to-br ${grad}`,
                    "rounded-2xl p-4 sm:p-7 min-h-[155px] sm:min-h-[200px] overflow-hidden",
                    "hover:shadow-2xl hover:-translate-y-1 transition-all duration-300",
                    idx === MODULES.length - 1 && MODULES.length % 2 !== 0
                      ? "col-span-2 max-w-sm mx-auto w-full"
                      : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                  <div className="flex items-start justify-between relative z-10 gap-1">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/15 border border-white/20 text-white/70 text-[8px] sm:text-[10px] font-bold tracking-widest leading-tight text-right">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <span className="hidden sm:inline">{sub}</span>
                      <span className="sm:hidden">{sub.split(" ")[0]}</span>
                    </span>
                  </div>

                  <div className="relative z-10 mt-3">
                    <h2 className="font-display font-800 text-xl sm:text-3xl text-white leading-none mb-1.5">
                      {label}
                    </h2>
                    <p className="text-white/55 text-[11px] sm:text-sm leading-snug line-clamp-2 mb-3">{desc}</p>
                    <div className="flex items-center gap-1 text-white/0 group-hover:text-white/80 transition-all duration-200 text-xs font-semibold">
                      Accéder <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
