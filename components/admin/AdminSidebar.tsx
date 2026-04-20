"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Package, ShoppingBag, Settings, Users, MessageCircle, Send, Star, Tag,
  X, ChevronRight, Palette, MapPin, CreditCard, Link2,
  FolderOpen, Image, ShoppingCart, Zap,
  TrendingUp, Archive, FilePlus, DollarSign,
  Truck, Building2, PieChart, FileText, BarChart2,
  Gift, Mail, UserCheck, Home, LogOut, Globe,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const MODULES: Record<string, {
  label:  string;
  accent: string;
  ring:   string;
  dot:    string;
  items:  NavItem[];
}> = {
  magasin: {
    label:  "MAGASIN",
    accent: "bg-brand-700",
    ring:   "border-brand-600",
    dot:    "bg-brand-400",
    items: [
      { label: "Tous les produits", href: "/admin/products",      icon: Package },
      { label: "Catégories",        href: "/admin/categories",    icon: FolderOpen },
      { label: "Fournisseurs",      href: "/admin/fournisseurs",  icon: Building2 },
      { label: "Achats",            href: "/admin/achats",        icon: Truck },
      { label: "Import / Export",   href: "/admin/import-export", icon: Zap },
    ],
  },
  boutique: {
    label:  "BOUTIQUE",
    accent: "bg-amber-500",
    ring:   "border-amber-400",
    dot:    "bg-amber-300",
    items: [
      { label: "Ventes",         href: "/admin/ventes",                icon: TrendingUp },
      { label: "Livraisons",     href: "/admin/livraisons",            icon: Truck },
      { label: "Stock boutique", href: "/admin/stock-boutique",        icon: Archive },
      { label: "Proforma",       href: "/admin/proforma",              icon: FilePlus },
      { label: "Finance",        href: "/admin/finance",               icon: DollarSign },
      { label: "Clients",        href: "/admin/boutique-clients",      icon: Users },
      { label: "Segmentation",   href: "/admin/boutique-segmentation", icon: PieChart },
    ],
  },
  store: {
    label:  "STORE",
    accent: "bg-emerald-600",
    ring:   "border-emerald-500",
    dot:    "bg-emerald-400",
    items: [
      { label: "Commandes",          href: "/admin/orders",            icon: ShoppingCart },
      { label: "Coupons",            href: "/admin/coupons",           icon: Tag },
      { label: "Réglages généraux",  href: "/admin/settings",          icon: Settings },
      { label: "Hero & Bannières",   href: "/admin/settings/hero",     icon: Image },
      { label: "Zones de livraison", href: "/admin/settings/delivery", icon: MapPin },
      { label: "Apparence",          href: "/admin/settings/theme",    icon: Palette },
      { label: "WhatsApp API",       href: "/admin/settings/whatsapp", icon: ShoppingBag },
      { label: "Paiements",          href: "/admin/settings/payment",  icon: CreditCard },
      { label: "Domaine & URL",      href: "/admin/settings/domain",   icon: Link2 },
      { label: "Utilisateurs",       href: "/admin/users",             icon: Users },
    ],
  },
  crm: {
    label:  "CRM",
    accent: "bg-indigo-600",
    ring:   "border-indigo-500",
    dot:    "bg-indigo-400",
    items: [
      { label: "Clients",         href: "/admin/crm",             icon: Users },
      { label: "Avis clients",    href: "/admin/reviews",         icon: Star },
      { label: "Messages reçus",  href: "/admin/messages",        icon: MessageCircle },
      { label: "Diffusion",       href: "/admin/whatsapp",        icon: Send },
      { label: "Fidélité",        href: "/admin/fidelite",        icon: Gift },
      { label: "Parrainage",      href: "/admin/parrainage",      icon: Link2 },
      { label: "Newsletter",      href: "/admin/newsletter",      icon: Mail },
      { label: "Comptes clients", href: "/admin/comptes-clients", icon: UserCheck },
    ],
  },
  admin: {
    label:  "ADMIN",
    accent: "bg-violet-600",
    ring:   "border-violet-500",
    dot:    "bg-violet-400",
    items: [
      { label: "Rapports",             href: "/admin/rapports",  icon: FileText },
      { label: "Tendances des ventes", href: "/admin/tendances", icon: BarChart2 },
    ],
  },
};

const ROUTE_TO_MODULE: [string, string][] = [
  ["/admin/products",              "magasin"],
  ["/admin/categories",            "magasin"],
  ["/admin/fournisseurs",          "magasin"],
  ["/admin/achats",                "magasin"],
  ["/admin/import-export",         "magasin"],
  ["/admin/stock",                 "magasin"],
  ["/admin/boutique-clients",      "boutique"],
  ["/admin/boutique-segmentation", "boutique"],
  ["/admin/livraisons",            "boutique"],
  ["/admin/stock-boutique",        "boutique"],
  ["/admin/ventes",                "boutique"],
  ["/admin/factures",              "boutique"],
  ["/admin/proforma",              "boutique"],
  ["/admin/finance",               "boutique"],
  ["/admin/orders",                "store"],
  ["/admin/coupons",               "store"],
  ["/admin/settings",              "store"],
  ["/admin/users",                 "store"],
  ["/admin/reviews",               "crm"],
  ["/admin/crm",                   "crm"],
  ["/admin/messages",              "crm"],
  ["/admin/whatsapp",              "crm"],
  ["/admin/fidelite",              "crm"],
  ["/admin/parrainage",            "crm"],
  ["/admin/newsletter",            "crm"],
  ["/admin/comptes-clients",       "crm"],
  ["/admin/rapports",              "admin"],
  ["/admin/tendances",             "admin"],
];

function getActiveModule(pathname: string): string | null {
  for (const [prefix, key] of ROUTE_TO_MODULE) {
    if (pathname.startsWith(prefix)) return key;
  }
  return null;
}

interface Props {
  nom:           string;
  role:          string;
  mobileOpen:    boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function AdminSidebar({ nom, role, mobileOpen, setMobileOpen }: Props) {
  const pathname     = usePathname();
  const router       = useRouter();
  const moduleKey    = getActiveModule(pathname);
  const activeModule = moduleKey ? MODULES[moduleKey] : null;

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800">

      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <img src="/logo-togolese-shop-white.svg" alt="" className="h-4 w-auto" />
          </div>
          <div>
            <p className="font-display font-800 text-white text-sm leading-none">Togolese Shop</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Administration</p>
          </div>
        </Link>
      </div>

      {/* Module badge */}
      <div className="px-3 pt-4 pb-2">
        {activeModule ? (
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${activeModule.ring} bg-white/5`}>
            <span className={`w-2 h-2 rounded-full ${activeModule.dot} shrink-0`} />
            <span className="text-white font-display font-800 text-xs tracking-widest">
              {activeModule.label}
            </span>
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-white/40 text-xs font-semibold tracking-widest">MODULE</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {activeModule ? (
          <div className="space-y-0.5">
            {activeModule.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive(item.href)
                    ? `${activeModule.accent} text-white shadow-sm`
                    : "text-white hover:bg-white/10"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                <span className="flex-1 leading-none">{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Sélectionnez un module depuis l&apos;accueil
            </p>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </nav>

      {/* Footer — home + logout */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-0.5">
        <Link
          href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white text-sm font-semibold hover:bg-white/10 transition-colors"
        >
          <Globe className="w-4 h-4 shrink-0 opacity-80" />
          Voir le site
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white text-sm font-semibold hover:bg-white/10 transition-colors"
        >
          <Home className="w-4 h-4 shrink-0 opacity-80" />
          Accueil admin
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 text-sm font-semibold hover:bg-red-500/15 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion — {nom}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — full height, no top offset */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col fixed left-0 top-0 h-screen z-40 shadow-xl">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full shadow-xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
