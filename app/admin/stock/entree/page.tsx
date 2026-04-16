"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackagePlus, CheckCircle2, AlertCircle, Search, X } from "lucide-react";

interface Produit { id: number; reference: string; nom: string; stock_boutique: number; }

export default function NouvelleEntreePage() {
  const router = useRouter();
  const [produits, setProduits]       = useState<Produit[]>([]);
  const [loading,  setLoading]        = useState(true);
  const [saving,   setSaving]         = useState(false);
  const [success,  setSuccess]        = useState(false);
  const [error,    setError]          = useState<string | null>(null);
  const [search,   setSearch]         = useState("");
  const [showList, setShowList]       = useState(false);
  const [selected, setSelected]       = useState<Produit | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    quantite:  "",
    reference: "",
    note:      "",
  });

  useEffect(() => {
    fetch("/api/admin/stock/produits").then(r => r.json()).then(p => {
      setProduits(p.produits ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = produits.filter(p =>
    search.trim() === "" ? false :
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  function selectProduit(p: Produit) {
    setSelected(p);
    setSearch("");
    setShowList(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock/entree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit_id:  selected.id,
          entrepot_id: 1,
          quantite:    Number(form.quantite),
          reference:   form.reference || undefined,
          note:        form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-emerald-500" />
            Nouvelle Entrée de Stock
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Enregistrer une réception de marchandise</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-8">
        {success ? (
          <div className="flex flex-col items-center py-12 text-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="font-bold text-xl text-slate-800">Entrée enregistrée !</p>
            <p className="text-slate-500 text-sm">Redirection en cours…</p>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-slate-400">Chargement…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Product search */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Produit <span className="text-red-400">*</span>
              </label>

              {selected ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selected.nom}</p>
                    <p className="text-xs text-slate-500 font-mono">{selected.reference} — stock actuel : {selected.stock_boutique}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)}
                    className="p-1.5 rounded-xl hover:bg-emerald-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setShowList(true); }}
                    onFocus={() => setShowList(true)}
                    placeholder="Rechercher un produit par nom ou référence…"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-400 outline-none text-sm transition-all"
                  />
                  {showList && filtered.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-56 overflow-y-auto">
                      {filtered.map(p => (
                        <li key={p.id}>
                          <button type="button" onClick={() => selectProduit(p)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm">
                            <span className="font-semibold text-slate-800">{p.nom}</span>
                            <span className="ml-2 text-xs text-slate-400 font-mono">{p.reference}</span>
                            <span className="ml-2 text-xs text-slate-500">stock: {p.stock_boutique}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {showList && search.trim() !== "" && filtered.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg px-4 py-3 text-sm text-slate-400">
                      Aucun produit trouvé
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Quantité reçue <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.quantite}
                onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                placeholder="Ex: 50"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-400 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Référence bon de livraison
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Ex: BL-2024-001"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Note
              </label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Informations complémentaires…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-400 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/products"
                className="flex-1 text-center px-5 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving || !selected}
                className="flex-1 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer l'entrée"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
