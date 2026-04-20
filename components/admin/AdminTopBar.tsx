"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe, LogOut, Settings, ChevronDown, Menu, Home,
} from "lucide-react";

interface AdminTopBarProps {
  nom:  string;
  role: string;
  onMobileMenuToggle?: () => void;
}

function LiveDate() {
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () =>
      setDate(new Date().toLocaleDateString("fr-FR", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
      }));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  if (!date) return null;
  return (
    <span className="hidden md:block text-xs text-slate-400 capitalize select-none tabular-nums">
      {date}
    </span>
  );
}

export default function AdminTopBar({ nom, role, onMobileMenuToggle }: AdminTopBarProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOpen(false);
      }
    }
    if (modalOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modalOpen]);

  async function logout() {
    setModalOpen(false);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const initial = nom.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-brand-950 border-b border-white/10 flex items-center px-4 gap-3">

      {/* Mobile hamburger */}
      {onMobileMenuToggle && (
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-brand-900 flex items-center justify-center">
          <img src="/logo-togolese-shop-white.svg" alt="" className="h-4 w-auto" />
        </div>
        <div className="hidden sm:block">
          <p className="font-display font-800 text-xs text-white leading-none">Togolese Shop</p>
          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Admin</p>
        </div>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">

        <LiveDate />

        {/* Voir le site */}
        <Link
          href="/" target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/15"
        >
          <Globe className="w-3.5 h-3.5" />
          Site →
        </Link>

        {/* Home */}
        <Link
          href="/admin"
          className="p-2 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          title="Accueil admin"
        >
          <Home className="w-4 h-4" />
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={modalRef}>
          <button
            onClick={() => setModalOpen(o => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white leading-none">{nom}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">{role.replace("_", " ")}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform hidden sm:block ${modalOpen ? "rotate-180" : ""}`} />
          </button>

          {modalOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">

              {/* Profile header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-brand-50">
                <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {initial}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-none">{nom}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold uppercase tracking-wide">
                    {role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="py-1.5">
                <Link
                  href="/admin/settings"
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Paramètres
                </Link>
                <Link
                  href="/" target="_blank"
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm text-slate-700 font-medium sm:hidden"
                >
                  <Globe className="w-4 h-4 text-slate-400" /> Voir le site
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-sm font-semibold text-red-600"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
