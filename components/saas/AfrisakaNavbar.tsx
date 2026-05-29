"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ArrowRight, Globe } from "lucide-react";
import { useLang } from "./useLang";

export default function AfrisakaNavbar() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useLang();

  const NAV_LINKS = lang === "fr"
    ? [
        { l: "Fonctionnalités", h: "#fonctionnalites" },
        { l: "Comment ça marche", h: "#comment" },
        { l: "Tarifs",            h: "#tarifs" },
        { l: "Aperçu",            h: "#apercu" },
      ]
    : [
        { l: "Features",    h: "#fonctionnalites" },
        { l: "How it works", h: "#comment" },
        { l: "Pricing",     h: "#tarifs" },
        { l: "Preview",     h: "#apercu" },
      ];

  const loginLabel = lang === "fr" ? "Connexion" : "Login";
  const ctaLabel   = lang === "fr" ? "Démarrer gratuitement" : "Get started free";

  return (
    <header
      className="sticky top-0 z-50 border-b border-transparent"
      style={{ background: "rgba(251,247,241,0.82)", backdropFilter: "saturate(140%) blur(14px)" }}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/saas" className="flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-[9px] grid place-items-center"
            style={{
              background: "radial-gradient(120% 120% at 20% 20%, #F2A765 0%, #E07A2C 45%, #B8501A 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 10px -4px rgba(184,80,26,0.55)",
            }}
          >
            <ShoppingBag className="w-[15px] h-[15px] text-[#14110E]" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-[17px] tracking-tight">Afrisika</span>
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-1.5">
          {NAV_LINKS.map((x) => (
            <a
              key={x.h}
              href={x.h}
              className="text-[14px] text-[#2A2522] px-3 py-2 rounded-lg hover:bg-black/5 transition-colors"
            >
              {x.l}
            </a>
          ))}
        </nav>

        {/* CTAs + lang picker — desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Lang toggle */}
          <div className="flex items-center gap-0.5 bg-[#F0EBE0] rounded-full p-0.5">
            <Globe className="w-3.5 h-3.5 text-[#6B635B] ml-2 mr-1" />
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`text-[12px] font-medium px-2.5 py-1 rounded-full transition-all ${
                  lang === l
                    ? "bg-white text-[#14110E] shadow-sm"
                    : "text-[#6B635B] hover:text-[#14110E]"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <Link
            href="/admin/login"
            className="inline-flex items-center h-9 px-3.5 rounded-full text-[13.5px] font-medium text-[#14110E] hover:bg-black/5 transition-colors"
          >
            {loginLabel}
          </Link>
          <Link
            href="/saas/onboarding"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13.5px] font-medium text-white bg-[#14110E] hover:bg-black transition-all hover:-translate-y-px"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -8px rgba(20,17,14,0.5)" }}
          >
            {ctaLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="md:hidden p-2 rounded-lg text-[#14110E] hover:bg-black/5 transition-colors"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t border-[#E8E1D4] px-5 pb-5"
          style={{ background: "rgba(251,247,241,0.97)" }}
        >
          <div className="space-y-0 mb-4">
            {NAV_LINKS.map((x) => (
              <a
                key={x.h}
                href={x.h}
                onClick={() => setOpen(false)}
                className="flex items-center py-3 text-[14px] font-medium text-[#2A2522] border-b border-[#E8E1D4]/60 hover:text-[#B8501A] transition-colors"
              >
                {x.l}
              </a>
            ))}
          </div>

          {/* Lang toggle — mobile */}
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-[#6B635B]" />
            <div className="flex items-center gap-0.5 bg-[#F0EBE0] rounded-full p-0.5">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all ${
                    lang === l
                      ? "bg-white text-[#14110E] shadow-sm"
                      : "text-[#6B635B] hover:text-[#14110E]"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/admin/login"
              className="block text-center py-2.5 text-[13.5px] font-medium text-[#14110E] border border-[#E8E1D4] rounded-full hover:bg-white transition-colors"
            >
              {loginLabel}
            </Link>
            <Link
              href="/saas/onboarding"
              className="flex items-center justify-center gap-2 py-2.5 text-[13.5px] font-medium text-white rounded-full transition-all hover:-translate-y-px"
              style={{
                background: "#14110E",
                boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -8px rgba(20,17,14,0.5)",
              }}
            >
              {ctaLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
