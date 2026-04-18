"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Package, ShoppingBag, Settings, Users, MessageCircle, Send, Star, Tag,
  X, ChevronRight, Palette, MapPin, CreditCard, Link2,
  FolderOpen, Image, ShoppingCart, Zap,
  TrendingUp, Archive, FilePlus, DollarSign,
  Truck, Building2, PieChart, Globe, FileText, BarChart2,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

// ─── Module definitions ────────────────────────────────────────────────────────

const MODULES: Record<string, {
  label:     string;
  color:     string;
  textColor: string;
  items:     NavItem[];
}> = {
  magasin: {
    label:     "MAGASIN",
    color:     "bg-brand-900",
    textColor: "text-brand-900",
    items: [
      { label: "Tous les produits", href: "/admin/products",      icon: Package },
      { label: "Catégories",        href: "/admin/categories",    icon: FolderOpen },
      { label: "Fournisseurs",      href: "/admin/fournisseurs",  icon: Building2 },
      { label: "Achats",            href: "/admin/achats",        icon: Truck },
      { label: "Import / Export",   href: "/admin/import-export", icon: Zap },
    ],
  },
  boutique: {
    label:     "BOUTIQUE",
    color:     "bg-amber-500",
    textColor: "text-amber-600",
    items: [
      { label: "Ventes",         href: "/admin/ventes",                icon: TrendingUp },
      { label: "Livraisons",     href: "/admin/livraisons",            icon: Truck },
      { label: "Stock boutique", href: "/admin/stock-boutique",        icon: Archive },
      { label: "Proformat",      href: "/admin/proforma",              icon: FilePlus },
      { label: "Finance",        href: "/admin/finance",               icon: DollarSign },
      { label: "Clients",        href: "/admin/boutique-clients",      icon: Users },
      { label: "Segmentation",   href: "/admin/boutique-segmentation", icon: PieChart },
    ],
  },
  store: {
    label:     "STORE",
    color:     "bg-emerald-700",
    textColor: "text-emerald-700",
    items: [
      { label: "Commandes",          href: "/admin/orders",            icon: ShoppingCart },
      { label: "Coupons",            href: "/admin/coupons",           icon: Tag },
      { label: "Réglages généraux",  href: "/admin/settings",          icon: Settings },
      { label: "Hero & Bannières",   href: "/admin/settings/hero",     icon: Image },
      { label: "Zones de livraison", href: "/admin/settings/delivery", icon: MapPin },
      { label: "Apparence",          href: "/admin/settings/theme",    icon: Palette },
      { label: "WhatsApp API",       href: "/admin/settings/whatsapp", icon: Globe },
      { label: "Paiements",          href: "/admin/settings/payment",  icon: CreditCard },
      { label: "Domaine & URL",      href: "/admin/settings/domain",   icon: Link2 },
      { label: "Utilisateurs",       href: "/admin/users",             icon: Users },
    ],
  },
  crm: {
    label:     "CRM",
    color:     "bg-indigo-700",
    textColor: "text-indigo-700",
    items: [
      { label: "Clients",         href: "/admin/crm",      icon: Users },
      { label: "Avis clients",    href: "/admin/reviews",  icon: Star },
      { label: "Messages reçus",  href: "/admin/messages", icon: MessageCircle },
      { label: "Diffusion",       href: "/admin/whatsapp", icon: Send },
    ],
  },
  admin: {
    label:     "ADMIN",
    color:     "bg-violet-700",
    textColor: "text-violet-700",
    items: [
      { label: "Rapports",              href: "/admin/rapports",  icon: FileText },
      { label: "Tendances des ventes",  href: "/admin/tendances", icon: BarChart2 },
    ],
  },
};

// Maps URL prefixes → module key (more specific first)
const ROUTE_TO_MODULE: [string, string][] = [
  ["/admin/products",      "magasin"],
  ["/admin/categories",    "magasin"],
  ["/admin/fournisseurs",  "magasin"],
  ["/admin/achats",        "magasin"],
  ["/admin/import-export", "magasin"],
  ["/admin/boutique-clients",      "boutique"],
  ["/admin/boutique-segmentation", "boutique"],
  ["/admin/livraisons",            "boutique"],
  ["/admin/stock-boutique",        "boutique"],
  ["/admin/stock",         "magasin"],
  ["/admin/orders",        "store"],
  ["/admin/ventes",        "boutique"],
  ["/admin/factures",      "boutique"],
  ["/admin/proforma",      "boutique"],
  ["/admin/finance",       "boutique"],
  ["/admin/coupons",       "store"],
  ["/admin/settings",      "store"],
  ["/admin/users",         "store"],
  ["/admin/reviews",       "crm"],
  ["/admin/crm",           "crm"],
  ["/admin/messages",      "crm"],
  ["/admin/whatsapp",      "crm"],
  ["/admin/rapports",      "admin"],
  ["/admin/tendances",     "admin"],
];

function getActiveModule(pathname: string): string | null {
  for (const [prefix, key] of ROUTE_TO_MODULE) {
    if (pathname.startsWith(prefix)) return key;
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  nom:           string;
  role:          string;
  mobileOpen:    boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function AdminSidebar({ nom, role, mobileOpen, setMobileOpen }: Props) {
  const pathname = usePathname();

  const moduleKey    = getActiveModule(pathname);
  const activeModule = moduleKey ? MODULES[moduleKey] : null;

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <ShoppingBag className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400">
              Retournez à l&apos;accueil pour sélectionner un module.
            </p>
          </div>
        )}
      </nav>

    </div>
  );

  return (
    <>
      {/* Desktop sidebar — starts below top bar (top-14) */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col bg-white border-r border-slate-100 fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-40">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
