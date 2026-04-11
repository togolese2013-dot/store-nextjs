"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Package, ShoppingCart, Settings, MessageCircle,
  Send, Star, Tag, Users, Zap, LogOut, Menu, X, ChevronRight,
  Globe, Palette, MapPin, CreditCard, Link2, FolderOpen, Image, Warehouse,
  Upload, PlusCircle, Receipt, Boxes as BoxesIcon, FileText, FilePlus,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  {
    section: "CRM",
    accent: "#7C3AED",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    items: [
      { label: "Clients",       href: "/admin/crm",      icon: Users },
      { label: "Messages",      href: "/admin/messages", icon: MessageCircle },
      { label: "Diffusion",     href: "/admin/whatsapp", icon: Send },
      { label: "Avis clients",  href: "/admin/reviews",  icon: Star },
    ],
  },
  {
    section: "BOUTIQUE",
    accent: "#1E3A8A",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    items: [
      { label: "Commandes",       href: "/admin/orders",          icon: ShoppingCart },
      { label: "Produits",        href: "/admin/products",        icon: Package },
      { label: "Catégories",      href: "/admin/categories",      icon: FolderOpen },
      { label: "Coupons",         href: "/admin/coupons",         icon: Tag },
      { label: "Nouvelle vente",  href: "/admin/ventes/nouvelle", icon: PlusCircle },
      { label: "Ventes",          href: "/admin/ventes",          icon: Receipt },
      { label: "Stock boutique",  href: "/admin/stock",           icon: BoxesIcon },
      { label: "Factures",        href: "/admin/factures",        icon: FileText },
      { label: "Proformat",       href: "/admin/proformat",       icon: FilePlus },
    ],
  },
  {
    section: "MAGASIN",
    accent: "#D97706",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    items: [
      { label: "Entrepôts",       href: "/admin/entrepots",       icon: Warehouse },
      { label: "Import / Export", href: "/admin/import-export",   icon: Upload },
    ],
  },
  {
    section: "STORE",
    accent: "#0F766E",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    items: [
      { label: "Réglages",         href: "/admin/settings",            icon: Settings },
      { label: "Hero & Bannières", href: "/admin/settings/hero",       icon: Image },
      { label: "Livraison",        href: "/admin/settings/delivery",   icon: MapPin },
      { label: "Apparence",        href: "/admin/settings/theme",      icon: Palette },
      { label: "WhatsApp API",     href: "/admin/settings/whatsapp",   icon: Globe },
      { label: "Paiements",        href: "/admin/settings/payment",    icon: CreditCard },
      { label: "Domaine",          href: "/admin/settings/domain",     icon: Link2 },
      { label: "Utilisateurs",     href: "/admin/users",               icon: Users },
    ],
  },
];

interface Props {
  nom:  string;
  role: string;
}

export default function AdminSidebar({ nom, role }: Props) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  /* Detect which group is active based on current path */
  const activeGroup = NAV.find(g => g.items.some(i => isActive(i.href))) ?? null;

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + back to hub */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/admin" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent-400" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-800 text-sm text-slate-900 leading-none">Togolese Shop</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">Admin</p>
          </div>
        </Link>
      </div>

      {/* Active group header */}
      {activeGroup && (
        <div className={`mx-3 mt-4 mb-1 px-3 py-2.5 rounded-2xl ${activeGroup.bg} border ${activeGroup.border}`}>
          <span className={`font-black text-sm tracking-widest ${activeGroup.text}`}>
            {activeGroup.section}
          </span>
        </div>
      )}

      {/* Nav — only active group items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {activeGroup
          ? activeGroup.items.map(item => (
              <Link
                key={item.label} href={item.href}
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
            ))
          : null
        }
      </nav>

      {/* User */}
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
          <Link href="/" target="_blank"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <Globe className="w-3.5 h-3.5" /> Voir le site
          </Link>
          <button onClick={logout}
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
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col">
            <button onClick={() => setOpen(false)}
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
