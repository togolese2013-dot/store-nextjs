"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface Props { settings: Record<string, string> }

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all font-sans";
const labelCls = "block text-xs font-bold text-slate-600 mb-1.5";

export default function GeneralSettingsForm({ settings }: Props) {
  const [siteName,    setSiteName]    = useState(settings.site_name ?? "Togolese Shop");
  const [tagline,     setTagline]     = useState(settings.site_tagline ?? "");
  const [annBar,      setAnnBar]      = useState(settings.announcement_bar ?? "");
  const [waNums,      setWaNums]      = useState<string[]>(() => {
    try { return JSON.parse(settings.whatsapp_numbers ?? "[]"); } catch { return []; }
  });
  const [mainWa,      setMainWa]      = useState(settings.whatsapp_number ?? "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        site_name:          siteName,
        site_tagline:       tagline,
        announcement_bar:   annBar,
        whatsapp_number:    mainWa,
        whatsapp_numbers:   JSON.stringify(waNums.filter(Boolean)),
      }),
    });
    setLoading(false);
    setMsg(res.ok ? "Réglages sauvegardés ✓" : "Erreur lors de la sauvegarde");
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">Site</h2>
        <div>
          <label className={labelCls}>Nom du site</label>
          <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Slogan</label>
          <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Boutique Premium au Togo" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Texte de la barre d'annonce (en-tête)</label>
          <input type="text" value={annBar} onChange={e => setAnnBar(e.target.value)}
            placeholder="🚚 Livraison rapide · Paiement à la livraison ✅" className={inputCls} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-display font-700 text-slate-900 border-b border-slate-100 pb-3">WhatsApp (bouton flottant)</h2>
        <div>
          <label className={labelCls}>Numéro principal (format : 22890000000)</label>
          <input type="text" value={mainWa} onChange={e => setMainWa(e.target.value)} className={inputCls} placeholder="22890000000" />
        </div>
        <div>
          <label className={labelCls}>Numéros supplémentaires (le bouton flottant les affichera tous)</label>
          <div className="space-y-2">
            {waNums.map((num, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={num}
                  onChange={e => { const n = [...waNums]; n[i] = e.target.value; setWaNums(n); }}
                  placeholder="22890000000 — Nom du contact" className={`${inputCls} flex-1`}
                />
                <button onClick={() => setWaNums(waNums.filter((_, j) => j !== i))}
                  className="p-2.5 rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={() => setWaNums([...waNums, ""])}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter un numéro
            </button>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder"}
      </button>
    </div>
  );
}
