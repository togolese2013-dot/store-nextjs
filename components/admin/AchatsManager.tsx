"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck, Plus, Trash2, X, Save, Loader2, AlertCircle,
  ShoppingCart, Clock, CheckCircle2, XCircle, ChevronDown,
  DollarSign, Package,
} from "lucide-react";
import type { Achat, Fournisseur } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";

interface Props {
  initialAchats: Achat[];
  total:         number;
  stats:         { total: number; en_attente: number; recu: number; montant_total: number };
  fournisseurs:  Fournisseur[];
  page:          number;
  limit:         number;
}

interface LineItem {
  designation:   string;
  quantite:      number | "";
  prix_unitaire: number | "";
}

const inputCls = "w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 transition-colors";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  recu:       "Reçu",
  valide:     "Validé",
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-700",
  recu:       "bg-blue-100 text-blue-700",
  valide:     "bg-green-100 text-green-700",
};

function emptyLine(): LineItem { return { designation: "", quantite: "", prix_unitaire: "" }; }

export default function AchatsManager({ initialAchats, total, stats, fournisseurs, page, limit }: Props) {
  const router = useRouter();
  const [achats, setAchats]   = useState<Achat[]>(initialAchats);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error,    setError]    = useState("");

  const [form, setForm] = useState({
    fournisseur_id: "",
    reference:      "",
    date_achat:     new Date().toISOString().slice(0, 10),
    statut:         "en_attente" as "en_attente" | "recu" | "valide",
    notes:          "",
  });
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  function addLine()             { setLines(l => [...l, emptyLine()]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function setLine(i: number, key: keyof LineItem, val: string) {
    setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: key === "designation" ? val : (val === "" ? "" : Number(val)) } : ln));
  }

  const montantTotal = lines.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0);

  async function handleSave() {
    setError("");
    if (!form.reference.trim()) { setError("La référence est obligatoire."); return; }
    if (!form.date_achat)       { setError("La date est obligatoire."); return; }
    const validLines = lines.filter(l => l.designation.trim() && Number(l.quantite) > 0);
    if (!validLines.length)     { setError("Ajoutez au moins un article valide."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/achats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fournisseur_id: form.fournisseur_id ? Number(form.fournisseur_id) : null,
          reference:      form.reference,
          date_achat:     form.date_achat,
          statut:         form.statut,
          note:           form.notes || null,
          items: validLines.map(l => ({
            produit_id:    null,
            designation:   l.designation,
            quantite:      Number(l.quantite),
            prix_unitaire: Number(l.prix_unitaire) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet achat ?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/achats/${id}`, { method: "DELETE" });
      setAchats(l => l.filter(a => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleStatut(id: number, statut: string) {
    await fetch(`/api/admin/achats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setAchats(l => l.map(a => a.id === id ? { ...a, statut: statut as Achat["statut"] } : a));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">

      <PageHeader
        title="Achats fournisseurs"
        subtitle="Suivi des commandes fournisseurs"
        accent="brand"
        onRefresh={() => router.refresh()}
        ctaLabel="Nouvel achat"
        ctaIcon={Plus}
        onCtaClick={() => { setShowForm(true); setError(""); }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total achats</p>
            <ShoppingCart className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">En attente</p>
            <Clock className="w-8 h-8 text-amber-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.en_attente}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reçus</p>
            <CheckCircle2 className="w-8 h-8 text-green-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.recu}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Montant total</p>
            <DollarSign className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatPrice(stats.montant_total)}{" "}
            <span className="text-base font-semibold text-emerald-500">FCFA</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {achats.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <Truck className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Aucun achat enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Référence</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Fournisseur</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Montant</th>
                  <th className="text-center px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Statut</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {achats.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 font-mono text-xs">{a.reference}</p>
                      {a.notes && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.notes}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                      {a.fournisseur_nom ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500 hidden sm:table-cell text-xs">
                      {new Date(a.date_achat).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-700 text-slate-900">{formatPrice(a.montant_total)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="relative inline-block">
                        <select
                          value={a.statut}
                          onChange={e => handleStatut(a.id, e.target.value)}
                          className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-bold cursor-pointer border-0 outline-none ${STATUT_COLORS[a.statut] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="recu">Reçu</option>
                          <option value="valide">Validé</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-40">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} sur {totalPages} · {total} résultats</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors">
                  ← Précédent
                </a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-400 transition-colors">
                  Suivant →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-lg text-slate-900">Nouvel achat fournisseur</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Form fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Référence *</label>
                <input type="text" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="Ex: ACH-2026-001" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fournisseur</label>
                <select value={form.fournisseur_id} onChange={e => setForm(f => ({ ...f, fournisseur_id: e.target.value }))}
                  className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date d'achat *</label>
                <input type="date" value={form.date_achat} onChange={e => setForm(f => ({ ...f, date_achat: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as "en_attente" | "recu" | "valide" }))}
                  className={inputCls}>
                  <option value="en_attente">En attente</option>
                  <option value="recu">Reçu</option>
                  <option value="valide">Validé</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Informations complémentaires…" className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls + " mb-0"}>Articles *</label>
                <button type="button" onClick={addLine}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                </button>
              </div>
              <div className="space-y-2">
                {lines.map((ln, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                    <input type="text" value={ln.designation}
                      onChange={e => setLine(i, "designation", e.target.value)}
                      placeholder="Désignation article"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
                    <input type="number" min="1" value={ln.quantite}
                      onChange={e => setLine(i, "quantite", e.target.value)}
                      placeholder="Qté"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-center" />
                    <input type="number" min="0" value={ln.prix_unitaire}
                      onChange={e => setLine(i, "prix_unitaire", e.target.value)}
                      placeholder="Prix u."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
                    <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                      className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {montantTotal > 0 && (
                <div className="mt-3 text-right">
                  <span className="text-xs text-slate-500 font-semibold">Total : </span>
                  <span className="font-display font-700 text-slate-900">{formatPrice(montantTotal)} FCFA</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
