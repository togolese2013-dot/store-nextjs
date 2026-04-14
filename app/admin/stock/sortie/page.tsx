"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageMinus, CheckCircle2, AlertCircle } from "lucide-react";

interface Produit { id: number; reference: string; nom: string; stock_boutique: number; }

export default function NouvelleSortiePage() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [form, setForm] = useState({
    produit_id: "",
    quantite:   "",
    reference:  "",
    note:       "",
  });

  const selectedProduit = produits.find(p => p.id === Number(form.produit_id));

  useEffect(() => {
    fetch("/api/admin/stock/produits").then(r => r.json()).then(p => {
      setProduits(p.produits ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock/sortie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit_id:  Number(form.produit_id),
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
            <PackageMinus className="w-6 h-6 text-red-500" />
            Nouvelle Sortie de Stock
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Enregistrer un retrait de marchandise</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        {success ? (
          <div className="flex flex-col items-center py-12 text-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="font-bold text-xl text-slate-800">Sortie enregistrée !</p>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Produit <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.produit_id}
                onChange={e => setForm(f => ({ ...f, produit_id: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-400 outline-none text-sm transition-all"
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.reference}] {p.nom} — stock: {p.stock_boutique}
                  </option>
                ))}
              </select>
              {selectedProduit && (
                <p className={`text-xs mt-1.5 font-semibold ${
                  selectedProduit.stock_boutique === 0 ? "text-red-500" :
                  selectedProduit.stock_boutique <= 5  ? "text-amber-500" : "text-green-600"
                }`}>
                  Stock disponible : {selectedProduit.stock_boutique} unité(s)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Quantité sortie <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={selectedProduit?.stock_boutique ?? undefined}
                value={form.quantite}
                onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                placeholder="Ex: 10"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-400 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Référence
              </label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Ex: BON-SORTIE-001"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-slate-400 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Motif / Note
              </label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Raison de la sortie…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-slate-400 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/products"
                className="flex-1 text-center px-5 py-3 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer la sortie"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
