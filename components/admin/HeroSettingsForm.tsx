"use client";

import { useState } from "react";
import {
  Loader2, Save, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Image as ImageIcon, X, Eye, EyeOff, Upload, Monitor, Smartphone,
} from "lucide-react";

interface HeroSlide {
  image:        string;
  image_mobile: string;
  gradient:     string;
  accent:       string;
}

interface Props { settings: Record<string, string> }

const inputCls = "w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

const DEFAULT_SLIDE: HeroSlide = {
  image:        "",
  image_mobile: "",
  gradient:     "from-[#052e16] via-[#14532d] to-[#166534]",
  accent:       "#22c55e",
};

function parseSlides(settings: Record<string, string>): HeroSlide[] {
  if (settings.hero_slides_json) {
    try {
      const parsed = JSON.parse(settings.hero_slides_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: HeroSlide & Record<string, string>) => ({
          image:        s.image        ?? "",
          image_mobile: s.image_mobile ?? "",
          gradient:     s.gradient     ?? DEFAULT_SLIDE.gradient,
          accent:       s.accent       ?? DEFAULT_SLIDE.accent,
        }));
      }
    } catch { /* fall through */ }
  }
  return [{ ...DEFAULT_SLIDE }];
}

export default function HeroSettingsForm({ settings }: Props) {
  const [slides,    setSlides]    = useState<HeroSlide[]>(() => parseSlides(settings));
  const [open,      setOpen]      = useState<number | null>(0);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // "d-0", "m-0" etc.
  const [msg,       setMsg]       = useState("");

  /* Bannière */
  const [banEnabled, setBanEnabled] = useState(settings.announcement_bar_enabled !== "false");
  const [banText,    setBanText]    = useState(settings.announcement_bar          ?? "");
  const [banBg,      setBanBg]      = useState(settings.announcement_bar_bg       ?? "#14532d");
  const [banColor,   setBanColor]   = useState(settings.announcement_bar_color    ?? "#ffffff");
  const [banStart,   setBanStart]   = useState(settings.announcement_bar_start    ?? "");
  const [banEnd,     setBanEnd]     = useState(settings.announcement_bar_end      ?? "");

  function updateSlide(i: number, field: keyof HeroSlide, value: string) {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function uploadImage(key: string, i: number, field: keyof HeroSlide, file: File) {
    setUploading(key);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res  = await fetch("/api/admin/upload", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ file: { data: base64, type: file.type, name: file.name } }),
    });
    const data = await res.json();
    setUploading(null);
    if (res.ok && data.urls?.[0]) updateSlide(i, field, data.urls[0]);
    else setMsg(data.errors?.[0] ?? "Erreur upload");
  }

  function addSlide() {
    setSlides(prev => [...prev, { ...DEFAULT_SLIDE }]);
    setOpen(slides.length);
  }

  function removeSlide(i: number) {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, idx) => idx !== i));
    setOpen(null);
  }

  function moveSlide(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setOpen(j);
  }

  async function save() {
    setLoading(true); setMsg("");
    const body: Record<string, string> = {
      hero_slides_json:         JSON.stringify(slides),
      announcement_bar_enabled: banEnabled ? "true" : "false",
      announcement_bar:         banText,
      announcement_bar_bg:      banBg,
      announcement_bar_color:   banColor,
      announcement_bar_start:   banStart,
      announcement_bar_end:     banEnd,
    };
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    setLoading(false);
    setMsg(res.ok ? "Sauvegardé ✓" : "Erreur lors de la sauvegarde");
  }

  /* ─── Image upload zone component ─── */
  function ImageUploadZone({
    label, hint, aspectClass, value, uploadKey,
    onUpload, onClear,
  }: {
    label: string; hint: string; aspectClass: string; value: string; uploadKey: string;
    onUpload: (f: File) => void; onClear: () => void;
  }) {
    const isUploading = uploading === uploadKey;
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls} style={{ marginBottom: 0 }}>{label}</label>
          <span className="text-[11px] text-slate-400 font-medium">{hint}</span>
        </div>
        {value ? (
          <div className="space-y-2">
            <div className={`relative w-full rounded-xl overflow-hidden bg-slate-100 ${aspectClass}`}>
              <img src={value} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 text-xs font-semibold text-slate-600 hover:text-brand-700 transition-colors cursor-pointer">
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Remplacer
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              </label>
              <button type="button" onClick={onClear}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 text-xs font-semibold transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 transition-colors cursor-pointer group bg-slate-50 ${aspectClass}`}>
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            ) : (
              <>
                <ImageIcon className="w-7 h-7 text-slate-300 group-hover:text-brand-400 transition-colors mb-2" />
                <span className="text-xs text-slate-400 group-hover:text-brand-600 font-semibold transition-colors">Cliquer pour uploader</span>
                <span className="text-[11px] text-slate-300 mt-0.5">{hint}</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      {/* ── HERO SLIDES ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-700 text-lg text-slate-900">Slides Hero</h2>
            <p className="text-xs text-slate-400 mt-0.5">{slides.length} slide{slides.length > 1 ? "s" : ""} — cliquez pour modifier</p>
          </div>
          <button onClick={addSlide}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un slide
          </button>
        </div>

        <div className="space-y-3">
          {slides.map((slide, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

              {/* Slide header */}
              <button type="button" onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

                {/* Desktop thumbnail */}
                <div className="w-14 h-8 rounded-lg bg-slate-100 shrink-0 overflow-hidden relative flex items-center justify-center">
                  {slide.image
                    ? <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <Monitor className="w-4 h-4 text-slate-300" />
                  }
                </div>

                {/* Mobile thumbnail */}
                <div className="w-6 h-8 rounded-lg bg-slate-100 shrink-0 overflow-hidden relative flex items-center justify-center">
                  {slide.image_mobile
                    ? <img src={slide.image_mobile} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <Smartphone className="w-3 h-3 text-slate-300" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Slide {i + 1}</p>
                  <p className="text-xs text-slate-400">
                    {slide.image ? "Desktop ✓" : "Desktop vide"}{" · "}
                    {slide.image_mobile ? "Mobile ✓" : "Mobile vide"}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={e => { e.stopPropagation(); moveSlide(i, -1); }}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
                  ><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); moveSlide(i, 1); }}
                    disabled={i === slides.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
                  ><ChevronDown className="w-4 h-4" /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); removeSlide(i); }}
                    disabled={slides.length <= 1}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  ><Trash2 className="w-4 h-4" /></button>
                  {open === i
                    ? <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />}
                </div>
              </button>

              {/* Slide form */}
              {open === i && (
                <div className="border-t border-slate-100 p-5 space-y-6">

                  {/* Desktop image */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-4 h-4 text-brand-600" />
                      <span className="text-sm font-bold text-slate-700">Image Desktop</span>
                    </div>
                    <ImageUploadZone
                      label="Image de fond desktop"
                      hint="1920 × 700 px · JPG / PNG / WebP"
                      aspectClass="aspect-[1920/700]"
                      value={slide.image}
                      uploadKey={`d-${i}`}
                      onUpload={f => uploadImage(`d-${i}`, i, "image", f)}
                      onClear={() => updateSlide(i, "image", "")}
                    />
                  </div>

                  {/* Mobile image */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-brand-600" />
                      <span className="text-sm font-bold text-slate-700">Image Mobile</span>
                    </div>
                    <ImageUploadZone
                      label="Image de fond mobile"
                      hint="750 × 500 px · JPG / PNG / WebP"
                      aspectClass="aspect-[3/2]"
                      value={slide.image_mobile}
                      uploadKey={`m-${i}`}
                      onUpload={f => uploadImage(`m-${i}`, i, "image_mobile", f)}
                      onClear={() => updateSlide(i, "image_mobile", "")}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Si aucune image mobile n'est définie, l'image desktop sera utilisée.
                    </p>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── BANNIÈRE D'ANNONCE ── */}
      <section>
        <h2 className="font-display font-700 text-lg text-slate-900 mb-4">Barre d'annonce</h2>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Afficher la barre d'annonce</p>
              <p className="text-xs text-slate-400 mt-0.5">La barre apparaît tout en haut du site</p>
            </div>
            <button type="button" onClick={() => setBanEnabled(!banEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                banEnabled
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {banEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {banEnabled ? "Activée" : "Désactivée"}
            </button>
          </div>

          <div>
            <label className={labelCls}>Texte de la bannière</label>
            <input className={inputCls} placeholder="🚚 Livraison rapide · Paiement à la livraison ✅"
              value={banText} onChange={e => setBanText(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Couleur de fond</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={banBg} onChange={e => setBanBg(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 shrink-0" />
                <input type="text" value={banBg} onChange={e => setBanBg(e.target.value)}
                  className={`${inputCls} font-mono`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Couleur du texte</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={banColor} onChange={e => setBanColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 shrink-0" />
                <input type="text" value={banColor} onChange={e => setBanColor(e.target.value)}
                  className={`${inputCls} font-mono`} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date de début (optionnel)</label>
              <input type="date" value={banStart} onChange={e => setBanStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date de fin (optionnel)</label>
              <input type="date" value={banEnd} onChange={e => setBanEnd(e.target.value)} className={inputCls} />
            </div>
          </div>

        </div>
      </section>

      {/* Save */}
      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-brand-800 text-white font-bold text-sm hover:bg-brand-900 transition-colors disabled:opacity-60 shadow-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder"}
      </button>
    </div>
  );
}
