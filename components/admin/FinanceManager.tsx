"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Wallet,
  Search, Pencil, Trash2, X, Plus,
} from "lucide-react";
import type { FinanceEntry, FinanceStats } from "@/lib/admin-db";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " XOF";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

const TYPE_LABELS: Record<string, string> = {
  caisse:  "Caisse",
  depense: "Dépense",
  rentree: "Rentrée",
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  defaultType: FinanceEntry["type"];
  entry?: FinanceEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

function EntryModal({ defaultType, entry, onClose, onSaved }: ModalProps) {
  const isEdit = !!entry;
  const [type,        setType]        = useState<FinanceEntry["type"]>(entry?.type ?? defaultType);
  const [categorie,   setCategorie]   = useState(entry?.categorie   ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [montant,     setMontant]     = useState(entry ? String(entry.montant) : "");
  const [date,        setDate]        = useState(entry?.date_entree?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || !date) { setError("Montant et date requis."); return; }
    setSaving(true);
    setError("");
    try {
      const body = { type, categorie: categorie || null, description: description || null, montant: Number(montant), date_entree: date };
      const res = isEdit
        ? await fetch(`/api/admin/finance/${entry!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/finance",               { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erreur"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const typeColor = type === "depense" ? "bg-red-500" : type === "caisse" ? "bg-blue-500" : "bg-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-display font-800 text-lg text-slate-900">
            {isEdit ? "Modifier l'entrée" : "Nouvelle entrée"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Type selector */}
          {!isEdit && (
            <div className="flex gap-2">
              {(["caisse", "depense", "rentree"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    type === t
                      ? t === "depense" ? "bg-red-500 text-white" : t === "caisse" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Catégorie</label>
            <input value={categorie} onChange={e => setCategorie(e.target.value)} placeholder="Ex: Vente carte mémoire"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Montant (XOF) *</label>
            <input type="number" min="0" step="1" value={montant} onChange={e => setMontant(e.target.value)} required placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${typeColor} hover:opacity-90 disabled:opacity-50`}>
              {saving ? "Enregistrement…" : isEdit ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "depense" | "rentree";

interface Props {
  initialItems: FinanceEntry[];
  initialStats: FinanceStats;
  initialTotal: number;
}

export default function FinanceManager({ initialItems, initialStats, initialTotal }: Props) {
  const [tab,    setTab]    = useState<Tab>("rentree");
  const [items,  setItems]  = useState<FinanceEntry[]>(initialItems);
  const [stats,  setStats]  = useState<FinanceStats>(initialStats);
  const [total,  setTotal]  = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [modal,  setModal]  = useState<{ type: FinanceEntry["type"]; entry?: FinanceEntry } | null>(null);
  const [delId,  setDelId]  = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = items.filter(item => {
    const matchTab = tab === "depense" ? item.type === "depense" : item.type !== "depense";
    const matchSearch = !search || item.reference.toLowerCase().includes(search.toLowerCase()) || (item.categorie ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance?limit=200");
      const data = await res.json();
      setItems(data.items ?? []);
      setStats(data.stats ?? { total_recettes: 0, total_depenses: 0, solde_net: 0 });
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleDelete(id: number) {
    await fetch(`/api/admin/finance/${id}`, { method: "DELETE" });
    setDelId(null);
    reload();
  }

  const soldePositif = stats.solde_net >= 0;

  const isRecetteTab = tab === "rentree";
  const dateLabel    = isRecetteTab ? "DATE DE RECETTE"   : "DATE DE DÉPENSE";
  const refLabel     = isRecetteTab ? "RÉFÉRENCE RECETTE" : "RÉFÉRENCE DÉPENSE";
  const catLabel     = isRecetteTab ? "CATÉGORIE RECETTE" : "CATÉGORIE DÉPENSE";
  const mntLabel     = isRecetteTab ? "MONTANT REÇU"      : "MONTANT";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Finances</h1>
          <p className="text-slate-400 text-sm mt-1">Suivez vos recettes et dépenses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 w-48"
            />
          </div>
          <button
            onClick={() => setModal({ type: tab === "depense" ? "depense" : "rentree" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle entrée
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Recettes</p>
            <p className="text-2xl font-800 text-green-600">{fmt(stats.total_recettes)}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Dépenses</p>
            <p className="text-2xl font-800 text-red-500">{fmt(stats.total_depenses)}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Solde Net</p>
            <p className={`text-2xl font-800 ${soldePositif ? "text-green-600" : "text-red-500"}`}>
              {soldePositif ? "+" : ""}{fmt(stats.solde_net)}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${soldePositif ? "bg-green-50" : "bg-red-50"}`}>
            <Wallet className={`w-5 h-5 ${soldePositif ? "text-green-500" : "text-red-500"}`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {(["depense", "rentree"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px ${
              tab === t
                ? t === "depense" ? "border-red-500 text-red-600" : "border-green-500 text-green-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t === "depense" ? "Dépenses" : "Rentrées"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Aucune entrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{dateLabel}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{refLabel}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{catLabel}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{mntLabel}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-300">📅</span>
                        {fmtDate(item.date_entree)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">{item.reference}</td>
                    <td className="px-4 py-3.5">
                      {item.categorie
                        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            🏷 {item.categorie.toUpperCase()}
                          </span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                      {item.description ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap">
                      <span className={item.type === "depense" ? "text-red-500" : "text-green-600"}>
                        {item.type === "depense" ? "-" : "+"}{fmt(item.montant)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ type: item.type, entry: item })}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDelId(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal add/edit */}
      {modal && (
        <EntryModal
          defaultType={modal.type}
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}

      {/* Confirm delete */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-display font-800 text-lg text-slate-900">Confirmer la suppression</h2>
            <p className="text-slate-500 text-sm">Cette entrée sera définitivement supprimée.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={() => handleDelete(delId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
