"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { applyThemeToDOM } from "@/lib/theme-utils";

const FONTS = [
  "Montserrat", "Inter", "Poppins", "Raleway",
  "Nunito", "Plus Jakarta Sans", "Outfit", "DM Sans",
];

const PRESETS = [
  { label: "Navy & Terracotta (défaut)", primary: "#0A2463", accent: "#F4623A" },
  { label: "Vert & Or",                 primary: "#1B4332", accent: "#D4A017" },
  { label: "Violet & Rose",             primary: "#4C1D95", accent: "#EC4899" },
  { label: "Noir & Orange",             primary: "#111827", accent: "#F97316" },
  { label: "Bleu & Cyan",               primary: "#1E3A5F", accent: "#06B6D4" },
];

export default function ThemeSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [primary, setPrimary] = useState(settings.theme_primary ?? "#0A2463");
  const [accent,  setAccent]  = useState(settings.theme_accent  ?? "#F4623A");
  const [font,    setFont]    = useState(settings.theme_font    ?? "Montserrat");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  function handlePrimary(val: string) { setPrimary(val); applyThemeToDOM(val, accent, font); }
  function handleAccent(val: string)  { setAccent(val);  applyThemeToDOM(primary, val, font); }
  function handleFont(val: string)    { setFont(val);    applyThemeToDOM(primary, accent, val); }

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ theme_primary: primary, theme_accent: accent, theme_font: font }),
    });
    setLoading(false);
    if (res.ok) {
      applyThemeToDOM(primary, accent, font);
      setMsg("Thème sauvegardé et appliqué ✓");
    } else {
      setMsg("Erreur lors de la sauvegarde");
    }
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Couleurs</h2>

        {/* Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Thèmes prédéfinis</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.label} type="button"
                onClick={() => { handlePrimary(p.primary); handleAccent(p.accent); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-brand-400 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="flex gap-1">
                  <span className="w-4 h-4 rounded-full border border-white/50 shadow-sm" style={{ background: p.primary }} />
                  <span className="w-4 h-4 rounded-full border border-white/50 shadow-sm" style={{ background: p.accent }} />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Couleur principale (navy)</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={primary} onChange={e => handlePrimary(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1"
              />
              <input type="text" value={primary} onChange={e => handlePrimary(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Couleur accent (terracotta)</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={accent} onChange={e => handleAccent(e.target.value)}
                className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1"
              />
              <input type="text" value={accent} onChange={e => handleAccent(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-white rounded-2xl border border-slate-200 focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: primary }}>TS</div>
          <div>
            <p className="font-bold text-sm" style={{ color: primary }}>Togolese Shop</p>
            <p className="text-xs font-semibold" style={{ color: accent }}>-30% de remise</p>
          </div>
          <button className="ml-auto px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: accent }}>Commander</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Police (font)</h2>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Choisir une police Google Fonts</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONTS.map(f => (
              <button key={f} type="button" onClick={() => handleFont(f)}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                  font === f
                    ? "border-brand-900 bg-brand-50 text-brand-900 font-bold"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                style={{ fontFamily: `'${f}', sans-serif` }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder le thème"}
      </button>
    </div>
  );
}
