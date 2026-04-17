"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Zap, Moon, Sun, Globe, LogOut, User, Settings, ChevronDown, Menu,
} from "lucide-react";

interface AdminTopBarProps {
  nom: string;
  role: string;
  /** Mobile hamburger — pass only when a sidebar is present */
  onMobileMenuToggle?: () => void;
}

function LiveDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () =>
      setDate(
        new Date().toLocaleDateString("fr-FR", {
          weekday: "short",
          day:     "2-digit",
          month:   "short",
          year:    "numeric",
        })
      );
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!date) return null;
  return (
    <span className="hidden md:block text-xs text-slate-500 dark:text-slate-400 capitalize select-none tabular-nums">
      {date}
    </span>
  );
}

export default function AdminTopBar({ nom, role, onMobileMenuToggle }: AdminTopBarProps) {
  const router  = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted,    setMounted]    = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close modal on outside click
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3 shadow-sm">

      {/* Mobile hamburger */}
      {onMobileMenuToggle && (
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Logo + name */}
      <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
        </div>
        <span className="font-bold text-sm text-slate-900 dark:text-white hidden sm:block">
          Togolese Shop
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Live date */}
        <LiveDate />

        {/* Dark / light toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Mode jour" : "Mode nuit"}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === "dark"
              ? <Sun  className="w-4 h-4" />
              : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Voir le site */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Globe className="w-3.5 h-3.5" />
          Voir le site →
        </Link>

        {/* Super Admin button + modal */}
        <div className="relative" ref={modalRef}>
          <button
            onClick={() => setModalOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initial}
            </div>
            {/* Name + role */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{nom}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                {role.replace("_", " ")}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${
                modalOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {modalOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">

              {/* Profile header */}
              <div className="flex flex-col items-center py-5 px-4 gap-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                  {initial}
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{nom}</p>
                <span className="px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold capitalize">
                  {role.replace("_", " ")}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-2">
                {/* Mon Profil */}
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Mon Profil</p>
                    <p className="text-xs text-slate-400">Gérer votre compte</p>
                  </div>
                </button>

                {/* Paramètres */}
                <Link
                  href="/admin/settings"
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Paramètres</p>
                    <p className="text-xs text-slate-400">Compte administrateur</p>
                  </div>
                </Link>

                {/* Déconnexion */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-600">Déconnexion</p>
                    <p className="text-xs text-slate-400">Se déconnecter de la session</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
