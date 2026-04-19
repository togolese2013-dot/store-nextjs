"use client";

import { useEffect, useState } from "react";
import { User, Phone, Save, CheckCircle, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Profil {
  nom: string;
  telephone: string;
}

export default function ProfilPage() {
  const [profil, setProfil]   = useState<Profil>({ nom: "", telephone: "" });
  const [saved, setSaved]     = useState(false);
  const [points, setPoints]   = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) setProfil(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const tel = profil.telephone.trim();
    if (!tel) return;
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/fidelite?telephone=${encodeURIComponent(tel)}`);
        const json = await res.json();
        if (json.balance !== undefined) setPoints(json.balance);
      } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(t);
  }, [profil.telephone]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("ts_profil", JSON.stringify(profil));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">Mon profil</h1>
            <p className="text-sm text-slate-400">Nom, téléphone, points fidélité</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Avatar + points */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-900 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {profil.nom ? profil.nom.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base truncate">{profil.nom || "—"}</p>
            <p className="text-sm text-slate-400 truncate">{profil.telephone || "Numéro non renseigné"}</p>
          </div>
          {points !== null && (
            <div className="text-right shrink-0">
              <p className="font-bold text-xl text-amber-500">{points}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                <Star className="w-3 h-3 text-amber-400" />
                pts
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Informations personnelles
          </p>
          <form onSubmit={handleSave} className="px-4 pb-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nom complet</span>
              </label>
              <input
                type="text"
                value={profil.nom}
                onChange={e => setProfil(p => ({ ...p, nom: e.target.value }))}
                placeholder="Ex: Kofi Mensah"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:bg-white bg-slate-50 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Téléphone</span>
              </label>
              <input
                type="tel"
                value={profil.telephone}
                onChange={e => setProfil(p => ({ ...p, telephone: e.target.value }))}
                placeholder="Ex: +228 90 00 00 00"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:bg-white bg-slate-50 outline-none text-sm transition-all"
              />
              <p className="mt-1 text-xs text-slate-400">Utilisé pour retrouver vos commandes et votre fidélité.</p>
            </div>
            <button
              type="submit"
              disabled={loading || saved}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-all"
            >
              {saved
                ? <><CheckCircle className="w-4 h-4" /> Enregistré !</>
                : <><Save className="w-4 h-4" /> Enregistrer</>
              }
            </button>
          </form>
        </div>

        {points !== null && (
          <Link href="/fidelite"
            className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-800 text-sm">Programme Fidélité</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Vous avez <strong>{points} points</strong> — consultez vos avantages
                </p>
              </div>
              <Star className="w-7 h-7 text-amber-400 shrink-0" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
