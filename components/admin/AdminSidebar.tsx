"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Package, ShoppingBag, Settings, Users, MessageCircle, Send, Star, Tag,
  LogOut, Menu, X, ChevronRight, Globe, Palette, MapPin, CreditCard, Link2,
  FolderOpen, Image, Warehouse, Zap, ArrowLeft, ShoppingCart,
  BarChart2, TrendingUp, Archive, FileText, FilePlus, DollarSign,
  Truck, Building2, PieChart,
} from "lucide-react";
import { useState } from "react";

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
};

// Maps URL prefixes → module key (more specific first)
const ROUTE_TO_MODULE: [string, string][] = [
  ["/admin/products",      "magasin"],
  ["/admin/categories",    "magasin"],
  ["/admin/entrepots",     "magasin"],
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
];

function getActiveModule(pathname: string): string | null {
  for (const [prefix, key] of ROUTE_TO_MODULE) {
    if (pathname.startsWith(prefix)) return key;
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  nom:  string;
  role: string;
}

export default function AdminSidebar({ nom, role }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const moduleKey    = getActiveModule(pathname);
  const activeModule = moduleKey ? MODULES[moduleKey] : null;

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const SidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo + breadcrumb */}
      <div className="px-5 py-5 border-b border-slate-100 space-y-3">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-800 text-sm text-slate-900 leading-none">Togolese Shop</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">Admin</p>
          </div>
        </Link>

        {activeModule && (
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Accueil
            </Link>
            <span className="text-slate-200">/</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${activeModule.color}`}>
              {activeModule.label}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {activeModule ? (
          <div className="space-y-0.5">
            {activeModule.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isActive(item.href)
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-sm shrink-0">
            {nom.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{nom}</p>
            <p className="text-xs text-slate-400 capitalize">{role.replace("_", " ")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <Globe className="w-3.5 h-3.5" /> Voir le site
          </Link>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors border border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col bg-white border-r border-slate-100 fixed left-0 top-0 h-full z-40">
        {SidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-700">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent-400" fill="currentColor" />
          </div>
          <span className="font-display font-800 text-sm text-slate-900">Admin</span>
        </Link>
        {activeModule && (
          <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${activeModule.color}`}>
            {activeModule.label}
          </span>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-xl flex flex-col">
            <button
              onClick={() => setOpen(false)}
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
