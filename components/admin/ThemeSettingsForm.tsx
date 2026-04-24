"use client";

import { useState } from "react";
import { Loader2, Save, Image as ImageIcon, X, ShoppingBag, Tag } from "lucide-react";
import { applyThemeToDOM, isSystemFont, SYSTEM_FONT_STACK, buildRamp } from "@/lib/theme-utils";

const FONTS = [
  "Système", "Montserrat", "Inter", "Poppins", "Raleway",
  "Nunito", "Plus Jakarta Sans", "Outfit", "DM Sans",
];

const PRESETS = [
  { label: "Vert forêt (actuel)", primary: "#14532d", accent: "#f59e0b", footer: "#052e16" },
  { label: "Vert & Or",           primary: "#1B4332", accent: "#D4A017", footer: "#0a1f17" },
  { label: "Vert vif & Ambre",    primary: "#15803d", accent: "#d97706", footer: "#052e16" },
  { label: "Navy & Terracotta",   primary: "#0A2463", accent: "#F4623A", footer: "#060f2a" },
  { label: "Noir & Orange",       primary: "#111827", accent: "#F97316", footer: "#030712" },
  { label: "Violet & Rose",       primary: "#4C1D95", accent: "#EC4899", footer: "#1e0850" },
];

/** Derive a hex preview from a brand ramp shade */
function rampHex(primary: string, shade: number): string {
  const ramp = buildRamp(primary);
  const val = ramp[shade];
  if (!val) return primary;
  const [r, g, b] = val.split(" ").map(Number);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function ThemeSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [primary, setPrimary] = useState(settings.theme_primary ?? "#14532d");
  const [accent,  setAccent]  = useState(settings.theme_accent  ?? "#f59e0b");
  const [footer,  setFooter]  = useState(settings.theme_footer  ?? "#052e16");
  const [font,    setFont]    = useState(settings.theme_font    ?? "Montserrat");
  const [logo,    setLogo]    = useState(settings.site_logo     ?? "");
  const [siteName] = useState(settings.site_name ?? "Togolese Shop");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  function handlePrimary(val: string) {
    setPrimary(val);
    applyThemeToDOM(val, accent, font);
  }
  function handleAccent(val: string) {
    setAccent(val);
    applyThemeToDOM(primary, val, font);
  }
  function handleFont(val: string) {
    setFont(val);
    applyThemeToDOM(primary, accent, val);
  }
  function applyPreset(p: typeof PRESETS[0]) {
    setPrimary(p.primary);
    setAccent(p.accent);
    setFooter(p.footer);
    applyThemeToDOM(p.primary, p.accent, font);
  }

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        theme_primary: primary,
        theme_accent:  accent,
        theme_footer:  footer,
        theme_font:    font,
        site_logo:     logo,
      }),
    });
    setLoading(false);
    if (res.ok) {
      applyThemeToDOM(primary, accent, font);
      setMsg("Thème sauvegardé et appliqué ✓");
    } else {
      setMsg("Erreur lors de la sauvegarde");
    }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

  // Colors derived from primary for preview
  const p500 = rampHex(primary, 500);
  const p700 = rampHex(primary, 700);
  const p900 = rampHex(primary, 900);

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

      {/* ── LEFT: CONTROLS ── */}
      <div className="space-y-6">

        {msg && (
          <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg}
          </div>
        )}

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
          <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Logo</h2>
          <div>
            <label className={labelCls}>URL du logo (externe)</label>
            <div className="flex gap-3 items-start">
              <input className={`${inputCls} flex-1`} placeholder="https://... (SVG ou PNG recommandé)"
                value={logo} onChange={e => setLogo(e.target.value)} />
              {logo && (
                <button type="button" onClick={() => setLogo("")}
                  className="p-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {logo ? (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 inline-flex items-center gap-3">
                <img src={logo} alt="Logo preview" className="h-10 w-auto object-contain" />
                <span className="text-xs text-slate-500">Aperçu logo</span>
              </div>
            ) : (
              <div className="mt-3 h-14 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <ImageIcon className="w-4 h-4 opacity-50" /> Aucun logo — le nom du site sera affiché
              </div>
            )}
          </div>
        </div>

        {/* Couleurs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-sm">
          <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Couleurs</h2>

          {/* Presets */}
          <div>
            <label className={labelCls}>Thèmes prédéfinis</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p.label} type="button"
                  onClick={() => applyPreset(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    primary === p.primary && accent === p.accent
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-slate-200 text-slate-700 hover:border-brand-300"
                  }`}
                >
                  <span className="flex gap-0.5">
                    <span className="w-4 h-4 rounded-l-full border border-white/50 shadow-sm" style={{ background: p.primary }} />
                    <span className="w-4 h-4 rounded-r-full border border-white/50 shadow-sm" style={{ background: p.accent }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Primary */}
            <div>
              <label className={labelCls}>Couleur principale</label>
              <p className="text-[11px] text-slate-400 mb-2">Boutons, badges, liens, sidebar</p>
              <div className="flex gap-2 items-center">
                <input type="color" value={primary} onChange={e => handlePrimary(e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1 shrink-0" />
                <input type="text" value={primary} onChange={e => handlePrimary(e.target.value)}
                  className={`${inputCls} font-mono text-xs`} />
              </div>
              {/* Ramp preview */}
              <div className="mt-2 flex gap-0.5 h-3 rounded-lg overflow-hidden">
                {[50,100,200,300,400,500,600,700,800,900,950].map(s => (
                  <div key={s} className="flex-1" style={{ background: rampHex(primary, s) }} />
                ))}
              </div>
            </div>

            {/* Accent */}
            <div>
              <label className={labelCls}>Couleur accent</label>
              <p className="text-[11px] text-slate-400 mb-2">Promos, highlights, hover</p>
              <div className="flex gap-2 items-center">
                <input type="color" value={accent} onChange={e => handleAccent(e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1 shrink-0" />
                <input type="text" value={accent} onChange={e => handleAccent(e.target.value)}
                  className={`${inputCls} font-mono text-xs`} />
              </div>
              <div className="mt-2 flex gap-0.5 h-3 rounded-lg overflow-hidden">
                {[50,100,200,300,400,500,600,700,800,900].map(s => (
                  <div key={s} className="flex-1" style={{ background: rampHex(accent, s) }} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div>
              <label className={labelCls}>Pied de page</label>
              <p className="text-[11px] text-slate-400 mb-2">Fond du footer</p>
              <div className="flex gap-2 items-center">
                <input type="color" value={footer} onChange={e => setFooter(e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1 shrink-0" />
                <input type="text" value={footer} onChange={e => setFooter(e.target.value)}
                  className={`${inputCls} font-mono text-xs`} />
              </div>
              <div className="mt-2 h-3 rounded-lg" style={{ background: footer }} />
            </div>
          </div>
        </div>

        {/* Police */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
          <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Police</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FONTS.map(f => (
              <button key={f} type="button" onClick={() => handleFont(f)}
                className={`px-3 py-3 rounded-xl border-2 text-sm transition-all ${
                  font === f
                    ? "border-brand-700 bg-brand-50 text-brand-900 font-bold"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                style={{ fontFamily: isSystemFont(f) ? SYSTEM_FONT_STACK : `'${f}', sans-serif` }}
              >
                {isSystemFont(f) ? "Système" : f}
                <span className="block text-[11px] opacity-50 font-normal mt-0.5">Aa Bb Cc</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={loading}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-brand-800 text-white font-bold text-sm hover:bg-brand-900 transition-colors disabled:opacity-60 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Enregistrement…" : "Sauvegarder le thème"}
        </button>
      </div>

      {/* ── RIGHT: LIVE PREVIEW ── */}
      <div className="lg:sticky lg:top-20 space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Aperçu en direct</p>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">

          {/* Header preview */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100"
            style={{ background: "white" }}>
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt="Logo" className="h-7 w-auto object-contain" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: primary }}>
                  {siteName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-bold" style={{ color: primary, fontFamily: isSystemFont(font) ? SYSTEM_FONT_STACK : `'${font}',sans-serif` }}>
                {siteName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {["Accueil", "Produits", "Promos"].map(n => (
                <span key={n} className="text-[11px] font-medium text-slate-500">{n}</span>
              ))}
              <div className="relative">
                <ShoppingBag className="w-5 h-5" style={{ color: primary }} />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: accent }}>2</span>
              </div>
            </div>
          </div>

          {/* Hero preview */}
          <div className="relative px-5 py-6 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${p900}, ${p700})` }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                Électronique Premium
              </p>
              <p className="text-white font-bold text-lg leading-tight mb-1"
                style={{ fontFamily: isSystemFont(font) ? SYSTEM_FONT_STACK : `'${font}',sans-serif` }}>
                Capturez chaque<br />moment parfait
              </p>
              <p className="text-white/60 text-xs mb-3">Caméras, drones et accessoires.</p>
              <button className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: accent }}>
                Découvrir le catalogue
              </button>
            </div>
          </div>

          {/* Product card preview */}
          <div className="p-4 bg-slate-50 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Produits</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Caméra 4K Pro",   price: "185 000",  promo: true  },
                { name: "Drone DJI Mini",   price: "320 000",  promo: false },
              ].map(p => (
                <div key={p.name} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="h-16 flex items-center justify-center"
                    style={{ background: `${primary}10` }}>
                    <div className="w-10 h-10 rounded-lg opacity-30"
                      style={{ background: primary }} />
                  </div>
                  <div className="p-2">
                    {p.promo && (
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white mb-1"
                        style={{ background: accent }}>-30%</span>
                    )}
                    <p className="text-[11px] font-semibold text-slate-800 leading-tight">{p.name}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color: primary }}>{p.price} F</p>
                    <button className="mt-1.5 w-full py-1 rounded-lg text-[10px] font-bold text-white"
                      style={{ background: p500 }}>
                      Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer preview */}
          <div className="px-4 py-4" style={{ background: footer }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {logo ? (
                  <img src={logo} alt="Logo" className="h-5 w-auto object-contain opacity-80" />
                ) : (
                  <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold opacity-80"
                    style={{ background: primary }}>
                    {siteName.charAt(0)}
                  </div>
                )}
                <span className="text-[11px] font-bold text-white/70">{siteName}</span>
              </div>
              <div className="flex gap-2">
                {["Produits", "Contact"].map(l => (
                  <span key={l} className="text-[10px] text-white/40 font-medium">{l}</span>
                ))}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] text-white/30">© 2025 {siteName}</span>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3" style={{ color: accent }} />
                <span className="text-[9px] font-bold" style={{ color: accent }}>Promos</span>
              </div>
            </div>
          </div>

        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Les couleurs s'appliquent immédiatement après sauvegarde.
        </p>
      </div>
    </div>
  );
}
