"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Settings, Globe } from "lucide-react";
import { clsx } from "clsx";
import type { AdminPermissions, ModuleKey } from "@/lib/admin-permissions";
import { hasPageAccess } from "@/lib/admin-permissions";

type NavItem = { label: string; href: string };

const MODULES: Record<string, { items: NavItem[] }> = {
  magasin: {
    items: [
      { label: "Produits",     href: "/admin/products" },
      { label: "Catégories",   href: "/admin/categories" },
      { label: "Fournisseurs", href: "/admin/fournisseurs" },
      { label: "Achats",       href: "/admin/achats" },
    ],
  },
  boutique: {
    items: [
      { label: "Ventes",       href: "/admin/ventes" },
      { label: "Livraisons",   href: "/admin/livraisons" },
      { label: "Stock",        href: "/admin/stock-boutique" },
      { label: "Proforma",     href: "/admin/proforma" },
      { label: "Finance",      href: "/admin/finance" },
      { label: "Clients",      href: "/admin/boutique-clients" },
      { label: "Segments",     href: "/admin/boutique-segmentation" },
    ],
  },
  store: {
    items: [
      { label: "Dashboard",    href: "/admin/store" },
      { label: "Commandes",    href: "/admin/orders" },
      { label: "Coupons",      href: "/admin/coupons" },
      { label: "Avis",         href: "/admin/reviews" },
      { label: "Paiements",    href: "/admin/paiements" },
      { label: "KYC",          href: "/admin/verifications" },
      { label: "Livraison",    href: "/admin/settings/delivery" },
    ],
  },
  crm: {
    items: [
      { label: "Clients",      href: "/admin/crm" },
      { label: "Messages",     href: "/admin/messages" },
      { label: "WhatsApp",     href: "/admin/whatsapp" },
      { label: "Fidélité",     href: "/admin/fidelite" },
      { label: "Parrainage",   href: "/admin/parrainage" },
      { label: "Newsletter",   href: "/admin/newsletter" },
      { label: "Comptes",      href: "/admin/comptes-clients" },
    ],
  },
  admin: {
    items: [
      { label: "Rapports",     href: "/admin/rapports" },
      { label: "Tendances",    href: "/admin/tendances" },
      { label: "Réglages",     href: "/admin/settings" },
      { label: "Apparence",    href: "/admin/settings/theme" },
      { label: "Hero",         href: "/admin/settings/hero" },
      { label: "WhatsApp API", href: "/admin/settings/whatsapp" },
      { label: "Utilisateurs", href: "/admin/users" },
    ],
  },
};

const ROUTE_TO_MODULE: [string, string][] = [
  ["/admin/products",              "magasin"],
  ["/admin/categories",            "magasin"],
  ["/admin/fournisseurs",          "magasin"],
  ["/admin/achats",                "magasin"],
  ["/admin/boutique-clients",      "boutique"],
  ["/admin/boutique-segmentation", "boutique"],
  ["/admin/livraisons",            "boutique"],
  ["/admin/stock-boutique",        "boutique"],
  ["/admin/ventes",                "boutique"],
  ["/admin/proforma",              "boutique"],
  ["/admin/finance",               "boutique"],
  ["/admin/store",                 "store"],
  ["/admin/orders",                "store"],
  ["/admin/coupons",               "store"],
  ["/admin/reviews",               "store"],
  ["/admin/verifications",         "store"],
  ["/admin/paiements",             "store"],
  ["/admin/settings/delivery",     "store"],
  ["/admin/settings/payment",      "store"],
  ["/admin/settings",              "admin"],
  ["/admin/users",                 "admin"],
  ["/admin/rapports",              "admin"],
  ["/admin/tendances",             "admin"],
  ["/admin/crm",                   "crm"],
  ["/admin/messages",              "crm"],
  ["/admin/whatsapp",              "crm"],
  ["/admin/fidelite",              "crm"],
  ["/admin/parrainage",            "crm"],
  ["/admin/newsletter",            "crm"],
  ["/admin/comptes-clients",       "crm"],
];

function getModuleKey(pathname: string): string | null {
  for (const [prefix, key] of ROUTE_TO_MODULE) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return key;
  }
  return null;
}

function hrefToPageId(href: string): string {
  return href.replace(/^\/admin\//, "");
}

interface Props {
  nom:         string;
  role:        string;
  permissions: AdminPermissions | null;
}

export default function AdminTopNav({ nom, role, permissions }: Props) {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function logout() {
    setOpen(false);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const moduleKey    = getModuleKey(pathname);
  const activeModule = moduleKey ? MODULES[moduleKey] : null;

  const visibleItems = activeModule
    ? activeModule.items.filter(item =>
        hasPageAccess(role, permissions, moduleKey as ModuleKey, hrefToPageId(item.href))
      )
    : [];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initial   = nom.charAt(0).toUpperCase();
  const roleLabel = role.replace("_", " ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-brand-900 flex items-center px-4 sm:px-6 gap-3 shadow-sm">

      {/* Logo */}
      <Link href="/admin" className="shrink-0 mr-2">
        <span className="font-display font-800 text-white text-lg tracking-tight">
          Togolese<span className="text-white/50">.</span>
        </span>
      </Link>

      {/* Nav items — scrollable on small screens */}
      <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0">
        {visibleItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
              isActive(item.href)
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User chip */}
      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {initial}
          </div>
          <span className="text-white text-sm font-semibold hidden sm:block leading-none">
            {nom}
          </span>
          <ChevronDown className={clsx(
            "w-3.5 h-3.5 text-white/60 transition-transform hidden sm:block",
            open && "rotate-180"
          )} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-up">

            {/* Profile */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-base shrink-0">
                {initial}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm leading-none">{nom}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold uppercase tracking-wide">
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="py-1.5">
              <Link
                href="/admin/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Paramètres
              </Link>
              <Link
                href="/" target="_blank"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
              >
                <Globe className="w-4 h-4 text-slate-400" /> Voir le site
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm font-semibold text-red-600 text-left"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
