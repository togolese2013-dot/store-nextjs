"use client";

import { useState, useRef } from "react";
import { Loader2, Save, Upload, Image as ImageIcon, X } from "lucide-react";

interface Props { settings: Record<string, string> }

export default function HeroSettingsForm({ settings }: Props) {
  const [slides, setSlides] = useState([
    {
      title:     settings.hero_slide_1_title    ?? "Capturez chaque moment parfait",
      subtitle:  settings.hero_slide_1_subtitle ?? "Caméras, drones et accessoires de qualité professionnelle.",
      cta:       settings.hero_slide_1_cta      ?? "Découvrir le catalogue",
      image:     settings.hero_slide_1_image    ?? "",
      gradient:  settings.hero_slide_1_gradient ?? "from-[#0A2463] via-[#1E3A8A] to-[#1e40af]",
    },
    {
      title:     settings.hero_slide_2_title    ?? "Les bonnes affaires sont ici",
      subtitle:  settings.hero_slide_2_subtitle ?? "Jusqu'à -50% sur des centaines de produits.",
      cta:       settings.hero_slide_2_cta      ?? "Voir les promotions",
      image:     settings.hero_slide_2_image    ?? "",
      gradient:  settings.hero_slide_2_gradient ?? "from-[#1a0533] via-[#3b0764] to-[#4c0d99]",
    },
    {
      title:     settings.hero_slide_3_title    ?? "Son cristallin, expérience ultime",
      subtitle:  settings.hero_slide_3_subtitle ?? "Les meilleurs casques et accessoires gaming.",
      cta:       settings.hero_slide_3_cta      ?? "Explorer l'audio",
      image:     settings.hero_slide_3_image    ?? "",
      gradient:  settings.hero_slide_3_gradient ?? "from-[#0c1445] via-[#1a2570] to-[#0A2463]",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [msg,     setMsg]     = useState("");
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  function updateSlide(index: number, field: string, value: string) {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function uploadImage(index: number, file: File) {
    setUploading(index);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(null);
    if (res.ok) {
      updateSlide(index, "image", data.url);
    } else {
      setMsg(data.error ?? "Erreur upload");
    }
  }

  async function save() {
    setLoading(true); setMsg("");
    const body: Record<string, string> = {};
    slides.forEach((s, i) => {
      const n = i + 1;
      body[`hero_slide_${n}_title`]    = s.title;
      body[`hero_slide_${n}_subtitle`] = s.subtitle;
      body[`hero_slide_${n}_cta`]      = s.cta;
      body[`hero_slide_${n}_image`]    = s.image;
      body[`hero_slide_${n}_gradient`] = s.gradient;
    });
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setLoading(false);
    setMsg(res.ok ? "Hero sauvegardé ✓" : "Erreur lors de la sauvegarde");
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

  const GRADIENT_PRESETS = [
    { label: "Navy bleu",   value: "from-[#0A2463] via-[#1E3A8A] to-[#1e40af]" },
    { label: "Violet",      value: "from-[#1a0533] via-[#3b0764] to-[#4c0d99]" },
    { label: "Bleu foncé",  value: "from-[#0c1445] via-[#1a2570] to-[#0A2463]" },
    { label: "Noir",        value: "from-[#111827] via-[#1f2937] to-[#374151]" },
    { label: "Vert forêt",  value: "from-[#064e3b] via-[#065f46] to-[#047857]" },
  ];

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {slides.map((slide, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">
            Slide {i + 1}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Titre</label>
              <input className={inputCls} value={slide.title}
                onChange={e => updateSlide(i, "title", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Texte du bouton CTA</label>
              <input className={inputCls} value={slide.cta}
                onChange={e => updateSlide(i, "cta", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Sous-titre</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={slide.subtitle}
              onChange={e => updateSlide(i, "subtitle", e.target.value)} />
          </div>

          {/* Image upload */}
          <div>
            <label className={labelCls}>Image (droite du hero)</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input className={inputCls} placeholder="URL de l'image ou uploader ci-contre"
                  value={slide.image}
                  onChange={e => updateSlide(i, "image", e.target.value)} />
              </div>
              <button type="button"
                onClick={() => fileRefs[i].current?.click()}
                disabled={uploading === i}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading === i
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />}
                Uploader
              </button>
              <input ref={fileRefs[i]} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(i, f); }} />
            </div>
            {slide.image && (
              <div className="mt-3 relative inline-block">
                <img src={slide.image} alt="Preview"
                  className="h-24 w-auto rounded-xl object-cover border border-slate-200" />
                <button type="button"
                  onClick={() => updateSlide(i, "image", "")}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {!slide.image && (
              <div className="mt-3 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">Aucune image</p>
                </div>
              </div>
            )}
          </div>

          {/* Gradient preset */}
          <div>
            <label className={labelCls}>Dégradé de fond</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map(g => (
                <button key={g.value} type="button"
                  onClick={() => updateSlide(i, "gradient", g.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    slide.gradient === g.value
                      ? "border-brand-900 text-brand-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-8 h-4 rounded-md bg-gradient-to-r ${g.value}`} />
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${slide.gradient} p-5 min-h-[80px] flex items-center gap-4`}>
            <div className="flex-1 text-white">
              <p className="font-bold text-base leading-tight">{slide.title || "Titre du slide"}</p>
              <p className="text-white/70 text-xs mt-1">{slide.subtitle || "Sous-titre..."}</p>
              {slide.cta && (
                <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold">
                  {slide.cta}
                </span>
              )}
            </div>
            {slide.image && (
              <img src={slide.image} alt="" className="h-16 w-16 object-contain opacity-80 shrink-0" />
            )}
          </div>
        </div>
      ))}

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder le hero"}
      </button>
    </div>
  );
}
