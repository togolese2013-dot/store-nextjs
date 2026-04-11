"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Package, AlertTriangle, XCircle, TrendingUp, TrendingDown, Plus, Minus, X } from "lucide-react";

interface StockItem {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_ref: string;
  prix_unitaire: number;
  categorie_nom: string | null;
  quantite: number;
  seuil_alerte: number;
}

interface Stats {
  total_produits: number;
  ruptures: number;
  faibles: number;
  disponibles: number;
  total_entrees: number;
  total_retraits: number;
}

type Filtre = "tous" | "disponible" | "faible" | "epuise";
type MouvementType = "entree" | "retrait";

interface MouvementModal {
  produit_id: number;
  produit_nom: string;
  quantite_actuelle: number;
  type: MouvementType;
}

export default function StockBoutiquePage() {
  const [stocks, setStocks]   = useState<StockItem[]>([]);
  const [stats, setStats]     = useState<Stats | null>(null);
  const [filtre, setFiltre]   = useState<Filtre>("tous");
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<MouvementModal | null>(null);
  const [qty, setQty]         = useState(1);
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async (f: Filtre) => {
    setLoading(true);
    const res = await fetch(`/api/admin/stock?filtre=${f}`);
    if (res.ok) {
      const data = await res.json();
      setStocks(data.stocks ?? []);
      setStats(data.stats ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(filtre); }, [load, filtre]);

  function openModal(item: StockItem, type: MouvementType) {
    setModal({ produit_id: item.produit_id, produit_nom: item.produit_nom, quantite_actuelle: item.quantite, type });
    setQty(1);
    setNote("");
  }

  async function submitMouvement() {
    if (!modal || qty < 1) return;
    setSaving(true);
    await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit_id: modal.produit_id, type: modal.type, quantite: qty, note: note || null }),
    });
    setSaving(false);
    setModal(null);
    load(filtre);
  }

  function statusBadge(item: StockItem) {
    if (item.quantite === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Épuisé</span>;
    if (item.quantite <= item.seuil_alerte) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Stock faible</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Disponible</span>;
  }

  const FILTRES: { key: Filtre; label: string }[] = [
    { key: "tous", label: "Tous" },
    { key: "disponible", label: "Disponible" },
    { key: "faible", label: "Faible" },
    { key: "epuise", label: "Épuisé" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Stock boutique</h1>
        <p className="text-slate-500 text-sm mt-1">Niveaux de stock et mouvements</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <p className="text-2xl font-800 font-display text-slate-900">{stats.total_produits}</p>
            <p className="text-xs text-slate-500 mt-0.5">Produits en boutique</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-800 font-display text-slate-900">{stats.faibles}</p>
            <p className="text-xs text-slate-500 mt-0.5">Stock faible</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-800 font-display text-slate-900">{stats.ruptures}</p>
            <p className="text-xs text-slate-500 mt-0.5">En rupture</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
            <p className="text-2xl font-800 font-display text-slate-900">{stats.total_entrees}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total entrées</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-violet-700" />
              </div>
            </div>
            <p className="text-2xl font-800 font-display text-slate-900">{stats.total_retraits}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total retraits</p>
          </div>
        </div>
      )}

      {/* Filter tabs + table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-1 p-4 border-b border-slate-100">
          {FILTRES.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filtre === f.key
                  ? "bg-brand-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Chargement…</div>
        ) : stocks.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">Aucun produit trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-semibold text-slate-500">Produit</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500">Catégorie</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-right">Prix unitaire</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center">Quantité</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center">Seuil alerte</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500">Statut</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stocks.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{item.produit_nom}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.produit_ref}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{item.categorie_nom ?? "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{formatPrice(item.prix_unitaire)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-8 rounded-xl text-sm font-bold ${
                        item.quantite === 0
                          ? "bg-red-100 text-red-600"
                          : item.quantite <= item.seuil_alerte
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {item.quantite}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500">{item.seuil_alerte}</td>
                    <td className="px-5 py-3.5">{statusBadge(item)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(item, "entree")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Entrée
                        </button>
                        <button
                          onClick={() => openModal(item, "retrait")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" /> Retrait
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movement modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-800 text-lg text-slate-900">
                {modal.type === "entree" ? "Entrée en stock" : "Retrait de stock"}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 mb-1">{modal.produit_nom}</p>
            <p className="text-xs text-slate-400 mb-4">Stock actuel : <span className="font-bold text-slate-700">{modal.quantite_actuelle}</span></p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Quantité</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number" min={1} value={qty}
                    onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center text-lg font-bold py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Note (optionnel)</label>
                <input
                  type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Fournisseur, motif..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={submitMouvement}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-2xl font-semibold text-sm text-white transition-colors disabled:opacity-50 ${
                  modal.type === "entree" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {saving ? "Enregistrement…" : modal.type === "entree" ? "Enregistrer entrée" : "Enregistrer retrait"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
