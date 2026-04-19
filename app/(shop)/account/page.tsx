"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, Package, Heart, Settings, MapPin,
  CreditCard, Bell, Star, Users, ChevronRight,
} from "lucide-react";

const MENU = [
  {
    label: "Mon profil",
    desc:  "Nom, téléphone, points fidélité",
    href:  "/account/profil",
    icon:  User,
    color: "bg-brand-50 text-brand-700",
  },
  {
    label: "Mes commandes",
    desc:  "Historique & suivi de livraison",
    href:  "/account/commandes",
    icon:  Package,
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Mes favoris",
    desc:  "Produits sauvegardés",
    href:  "/wishlist",
    icon:  Heart,
    color: "bg-red-50 text-red-600",
  },
  {
    label: "Programme Fidélité",
    desc:  "Consulter mes points & coupons",
    href:  "/fidelite",
    icon:  Star,
    color: "bg-accent-50 text-accent-600",
  },
  {
    label: "Parrainage",
    desc:  "Mon lien de parrainage",
    href:  "/parrainage",
    icon:  Users,
    color: "bg-purple-50 text-purple-600",
  },
];

const SETTINGS = [
  { label: "Mes adresses",  href: "/account/adresses",     icon: MapPin },
  { label: "Paiement",      href: "/account/paiement",     icon: CreditCard },
  { label: "Notifications", href: "/account/notifications", icon: Bell },
];

export default function AccountPage() {
  const [profil, setProfil] = useState<{ nom: string; telephone: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) setProfil(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-900 flex items-center justify-center text-white font-800 text-xl">
              {profil?.nom ? profil.nom.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="font-display text-xl font-800 text-slate-900">
                {profil?.nom ?? "Mon compte"}
              </h1>
              <p className="text-sm text-slate-500">{profil?.telephone ?? "Complétez votre profil"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Main menu */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {MENU.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < MENU.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Paramètres</p>
          {SETTINGS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < SETTINGS.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-slate-500" />
              </div>
              <p className="flex-1 font-semibold text-sm text-slate-900">{item.label}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
