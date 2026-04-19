"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle } from "lucide-react";

interface Adresse {
  id:     string;
  label:  string;
  adresse: string;
  zone:   string;
}

export default function AdressesPage() {
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ label: "", adresse: "", zone: "" });
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_adresses");
      if (raw) setAdresses(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function persist(list: Adresse[]) {
    setAdresses(list);
    localStorage.setItem("ts_adresses", JSON.stringify(list));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.adresse.trim()) return;
    const newAddr: Adresse = {
      id:      Date.now().toString(),
      label:   form.label || "Adresse",
      adresse: form.adresse.trim(),
      zone:    form.zone.trim(),
    };
    persist([...adresses, newAddr]);
    setForm({ label: "", adresse: "", zone: "" });
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDelete(id: string) {
    persist(adresses.filter(a => a.id !== id));
  }

  const ZONES = [
    "Lomé Centre", "Agoè", "Bè", "Nyékonakpoè", "Adidogomé",
    "Cacavéli", "Hédzranawoé", "Kégué", "Hors Lomé",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-800 text-slate-900">Mes adresses</h1>
            <p className="text-sm text-slate-400">Adresses de livraison enregistrées</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Saved message */}
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Adresse enregistrée !
          </div>
        )}

        {/* Addresses list */}
        {adresses.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {adresses.map((addr, i) => (
              <div
                key={addr.id}
                className={`flex items-start gap-4 px-5 py-4 ${i < adresses.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900">{addr.label}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{addr.adresse}</p>
                  {addr.zone && <p className="text-xs text-slate-400 mt-0.5">{addr.zone}</p>}
                </div>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {adresses.length === 0 && !showForm && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Aucune adresse enregistrée</p>
            <p className="text-sm text-slate-400 mt-1">Ajoutez une adresse pour accélérer vos prochaines commandes.</p>
          </div>
        )}

        {/* Add form */}
        {showForm ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Nouvelle adresse</p>
            <form onSubmit={handleAdd} className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Libellé (ex: Maison, Bureau)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Maison"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adresse complète *</label>
                <input
                  type="text"
                  required
                  value={form.adresse}
                  onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                  placeholder="Ex: Rue de la Paix, derrière l'église..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Zone de livraison</label>
                <select
                  value={form.zone}
                  onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                >
                  <option value="">Choisir...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-semibold text-sm hover:border-brand-400 hover:text-brand-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Ajouter une adresse
          </button>
        )}
      </div>
    </div>
  );
}
