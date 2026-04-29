"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, Globe } from "lucide-react";

interface Props {
  nom:  string;
  role: string;
}

export default function AdminUserChip({ nom, role }: Props) {
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

  const initial   = nom.charAt(0).toUpperCase();
  const roleLabel = role.replace("_", " ");

  return (
    <div className="fixed top-4 right-4 z-50" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-brand-900 hover:bg-brand-800 transition-colors shadow-md"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initial}
        </div>
        <span className="text-white text-sm font-semibold leading-none">{nom}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
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
  );
}
