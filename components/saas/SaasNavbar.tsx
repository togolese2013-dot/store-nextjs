"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment",         label: "Comment ça marche" },
  { href: "#tarifs",          label: "Tarifs" },
  { href: "#temoignages",     label: "Témoignages" },
];

export default function SaasNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Afrisika</span>
        </div>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="hover:text-blue-600 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTAs — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/saas/onboarding"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4">
          <div className="space-y-0 mb-3">
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center py-3 text-sm font-medium text-gray-600 hover:text-blue-600 border-b border-gray-50 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/admin/login"
              className="block text-center py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/saas/onboarding"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
