"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, CheckCircle2, AlertCircle } from "lucide-react";

interface Produit { id: number; reference: string; nom: string; stock_boutique: number; }

export default function AjustementStockPage() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [form, setForm] = useState({
    produit_id: "",
    quantite:   "",
    motif:      "",
  });

  const qty = Number(form.quantite);
  const isPositive = qty > 0;
  const isNegative = qty < 0;
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
      const res = await fetch("/api/admin/stock/ajustement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit_id:  Number(form.produit_id),
          entrepot_id: 1,
          quantite:    Number(form.quantite),
          motif:       form.motif,
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
            <ArrowLeftRight className="w-6 h-6 text-blue-500" />
            Ajustement de Stock
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Corriger le niveau de stock d&apos;un produit</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
        <strong>Comment fonctionne l&apos;ajustement ?</strong><br />
        Entrez une quantité <strong>positive</strong> (+10) pour augmenter le stock,
        ou <strong>négative</strong> (−10) pour le réduire.
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        {success ? (
          <div className="flex flex-col items-center py-12 text-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="font-bold text-xl text-slate-800">Ajustement enregistré !</p>
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
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm transition-all"
              >
                <option value="">Sélectionner un produit</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.reference}] {p.nom} — stock: {p.stock_boutique}
                  </option>
                ))}
              </select>
              {selectedProduit && (
                <p className="text-xs mt-1.5 text-slate-500 font-semibold">
                  Stock actuel : <span className="text-slate-800">{selectedProduit.stock_boutique}</span> unité(s)
                  {form.quantite && qty !== 0 && (
                    <span className={`ml-2 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                      → {selectedProduit.stock_boutique + qty}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Ajustement de quantité <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                value={form.quantite}
                onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                placeholder="Ex: +20 ou -5"
                className={`w-full px-4 py-3 rounded-2xl border-2 outline-none text-sm font-bold transition-all ${
                  isPositive ? "border-green-300 focus:border-green-400 text-green-700" :
                  isNegative ? "border-red-300 focus:border-red-400 text-red-600" :
                               "border-slate-200 focus:border-blue-400 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Motif <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                value={form.motif}
                onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
                placeholder="Ex: Inventaire physique, perte, erreur de saisie…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm transition-all resize-none"
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
                className="flex-1 px-5 py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer l'ajustement"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
