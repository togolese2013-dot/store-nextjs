"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Package, Heart, Settings, MapPin,
  CreditCard, Bell, Star, Users, ChevronRight, LogOut,
} from "lucide-react";

const MENU = [
  {
    label: "Mon profil",
    desc:  "Nom, téléphone, points",
    href:  "/account/profil",
    icon:  User,
    color: "bg-brand-50 text-brand-700",
    border: "hover:border-brand-200",
  },
  {
    label: "Mes commandes",
    desc:  "Historique & suivi",
    href:  "/account/commandes",
    icon:  Package,
    color: "bg-blue-50 text-blue-700",
    border: "hover:border-blue-200",
  },
  {
    label: "Mes favoris",
    desc:  "Produits sauvegardés",
    href:  "/wishlist",
    icon:  Heart,
    color: "bg-red-50 text-red-600",
    border: "hover:border-red-200",
  },
  {
    label: "Programme Fidélité",
    desc:  "Mes points & coupons",
    href:  "/fidelite",
    icon:  Star,
    color: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
  },
  {
    label: "Parrainage",
    desc:  "Mon lien de parrainage",
    href:  "/parrainage",
    icon:  Users,
    color: "bg-purple-50 text-purple-600",
    border: "hover:border-purple-200",
  },
  {
    label: "Mes adresses",
    desc:  "Adresses enregistrées",
    href:  "/account/adresses",
    icon:  MapPin,
    color: "bg-slate-100 text-slate-600",
    border: "hover:border-slate-300",
  },
];

const SETTINGS = [
  { label: "Paiement",      href: "/account/paiement",      icon: CreditCard },
  { label: "Notifications", href: "/account/notifications",  icon: Bell },
];

interface Profil {
  nom:       string;
  telephone: string;
  photo_url?: string;
}

export default function AccountPage() {
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) setProfil(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    try {
      localStorage.removeItem("ts_profil");
      window.dispatchEvent(new Event("profil-updated"));
    } catch { /* ignore */ }
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            {profil?.photo_url ? (
              <Image
                src={profil.photo_url}
                alt={profil.nom}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {profil?.nom ? profil.nom.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {profil?.nom ?? "Mon compte"}
              </h1>
              <p className="text-sm text-slate-400">{profil?.telephone ?? "Complétez votre profil"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Card grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {MENU.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`bg-white rounded-2xl border border-slate-100 ${item.border} p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 leading-tight">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Settings row */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Paramètres</p>
          {SETTINGS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${i < SETTINGS.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-slate-500" />
              </div>
              <p className="flex-1 font-semibold text-sm text-slate-800">{item.label}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
