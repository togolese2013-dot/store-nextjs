"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Banknote, Smartphone,
  ArrowLeftRight, Pencil, Trash2, X,
  Loader2,
} from "lucide-react";
import type { FinanceEntry, FinanceStats } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import TabBar     from "@/components/admin/TabBar";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

// ─── Mode paiement config ─────────────────────────────────────────────────────

const MODES = [
  { value: "especes",           label: "Espèces",          icon: Banknote,      color: "text-emerald-600" },
  { value: "moov_money",        label: "Moov Money",       icon: Smartphone,    color: "text-blue-600"    },
  { value: "tmoney",            label: "TMoney",           icon: Smartphone,    color: "text-purple-600"  },
  { value: "virement_bancaire", label: "Virement bancaire",icon: ArrowLeftRight, color: "text-slate-600"  },
] as const;

type ModePaiement = typeof MODES[number]["value"];

function modeLabel(v: string | null | undefined) {
  return MODES.find(m => m.value === v)?.label ?? "Espèces";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title, amount, badge, badgeColor, icon: Icon, iconColor,
}: {
  title:      string;
  amount:     number;
  badge:      string;
  badgeColor: string;
  icon:       React.ElementType;
  iconColor:  string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
        <Icon className={`w-8 h-8 ${iconColor} opacity-20`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">
        {fmtNum(amount)}{" "}
        <span className="text-base font-semibold text-emerald-500">FCFA</span>
      </p>
      <div className="mt-3">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

// ─── Modal form ───────────────────────────────────────────────────────────────

type ModalType = "depense" | "rentree";

interface ModalProps {
  modalType: ModalType;
  entry?:    FinanceEntry | null;
  onClose:   () => void;
  onSaved:   () => void;
}

function EntryModal({ modalType, entry, onClose, onSaved }: ModalProps) {
  const isEdit = !!entry;

  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    (entry?.mode_paiement as ModePaiement) ?? "especes"
  );
  const [categorie,   setCategorie]   = useState(entry?.categorie   ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [montant,     setMontant]     = useState(entry ? String(entry.montant) : "");
  const [date,        setDate]        = useState(entry?.date_entree?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const isDepense  = modalType === "depense";
  const accentBg   = isDepense ? "bg-red-600 hover:bg-red-700"   : "bg-emerald-600 hover:bg-emerald-700";
  const accentRing = isDepense ? "focus:ring-red-300"             : "focus:ring-emerald-300";
  const title      = isEdit
    ? (isDepense ? "Modifier la dépense" : "Modifier la rentrée")
    : (isDepense ? "Nouvelle dépense"    : "Nouvelle rentrée");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || !date) { setError("Montant et date requis."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        type:          modalType,
        mode_paiement: modePaiement,
        categorie:     categorie  || null,
        description:   description || null,
        montant:       Number(montant),
        date_entree:   date,
      };
      const res = isEdit
        ? await fetch(`/api/admin/finance/${entry!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/finance",               { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erreur"); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Mode paiement (not shown for depenses) */}
          {!isDepense && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Mode de paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setModePaiement(m.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                      modePaiement === m.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <m.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRing}`} />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Catégorie</label>
            <input value={categorie} onChange={e => setCategorie(e.target.value)}
              placeholder={isDepense ? "Ex: Achat matériel, Loyer…" : "Ex: Vente en ligne, Acompte…"}
              className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRing}`} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRing} resize-none`} />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Montant (FCFA) *
            </label>
            <input type="number" min="0" step="1" value={montant}
              onChange={e => setMontant(e.target.value)} required placeholder="0"
              className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${accentRing}`} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${accentBg}`}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Enregistrement…" : isEdit ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  async function go() { setLoading(true); await onConfirm(); setLoading(false); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="font-bold text-lg text-slate-900">Supprimer cette entrée ?</h2>
        <p className="text-slate-500 text-sm">Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button onClick={go} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white transition-colors disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Supprimer
          </button>
        </div>
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
  const [tab,     setTab]     = useState<Tab>("rentree");
  const [items,   setItems]   = useState<FinanceEntry[]>(initialItems);
  const [stats,   setStats]   = useState<FinanceStats>(initialStats);
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState<{ type: ModalType; entry?: FinanceEntry } | null>(null);
  const [delItem, setDelItem] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const [, setTotal] = useState(initialTotal);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/finance?limit=200");
      const data = await res.json();
      setItems(data.items ?? []);
      setStats(data.stats ?? { total_recettes: 0, total_depenses: 0, solde_net: 0, especes: 0, moov_money: 0, tmoney: 0, virement_bancaire: 0 });
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleDelete(item: FinanceEntry) {
    await fetch(`/api/admin/finance/${item.id}`, { method: "DELETE" });
    setDelItem(null);
    reload();
  }

  // Filtered items for current tab
  const filtered = items.filter(item => {
    const matchTab    = tab === "depense" ? item.type === "depense" : item.type !== "depense";
    const matchSearch = !search
      || item.reference.toLowerCase().includes(search.toLowerCase())
      || (item.categorie ?? "").toLowerCase().includes(search.toLowerCase())
      || (item.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const soldePositif = stats.solde_net >= 0;

  return (
    <div className="space-y-6">

      <PageHeader
        title="Finances"
        subtitle="Suivez vos rentrées et dépenses"
        accent="amber"
        onRefresh={reload}
        extra={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal({ type: "depense" })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors whitespace-nowrap"
            >
              Nouvelle dépense
            </button>
            <button
              onClick={() => setModal({ type: "rentree" })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors whitespace-nowrap"
            >
              Nouvelle rentrée
            </button>
          </div>
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde total */}
        <StatCard
          title="Solde Total"
          amount={stats.solde_net}
          badge="Total Caisse"
          badgeColor={soldePositif ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}
          icon={Wallet}
          iconColor="text-emerald-500"
        />
        {/* Espèces */}
        <StatCard
          title="Espèces"
          amount={stats.especes}
          badge="Espèces"
          badgeColor="bg-green-50 text-green-700 border border-green-100"
          icon={Banknote}
          iconColor="text-green-500"
        />
        {/* Moov Money */}
        <StatCard
          title="Moov Money"
          amount={stats.moov_money}
          badge="Mobile Money"
          badgeColor="bg-blue-50 text-blue-700 border border-blue-100"
          icon={Smartphone}
          iconColor="text-blue-500"
        />
        {/* TMoney */}
        <StatCard
          title="TMoney"
          amount={stats.tmoney}
          badge="Mobile Money"
          badgeColor="bg-indigo-50 text-indigo-700 border border-indigo-100"
          icon={Smartphone}
          iconColor="text-indigo-500"
        />
        {/* Virement bancaire — on its own row left-aligned */}
        <StatCard
          title="Virement Bancaire"
          amount={stats.virement_bancaire}
          badge="Virement"
          badgeColor="bg-slate-100 text-slate-600 border border-slate-200"
          icon={ArrowLeftRight}
          iconColor="text-slate-500"
        />
      </div>

      {/* ── Toolbar : tabs + search + CTA ── */}
      <TabBar
        tabs={[
          { key: "depense", label: "Dépenses", icon: TrendingDown },
          { key: "rentree", label: "Rentrées", icon: TrendingUp   },
        ]}
        active={tab}
        onChange={k => setTab(k as typeof tab)}
        accent="amber"
      />

      {/* Search bar */}
      <div className="flex items-center justify-end">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="pl-4 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 w-52"
        />
      </div>

      {/* ── Table dépenses / rentrées ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              {tab === "depense" ? "Aucune dépense enregistrée." : "Aucune rentrée enregistrée."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Référence</th>
                    {tab === "rentree" && (
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Mode</th>
                    )}
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Catégorie</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Montant</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {fmtDate(item.date_entree)}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {item.reference}
                      </td>
                      {tab === "rentree" && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {modeLabel(item.mode_paiement)}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4">
                        {item.categorie
                          ? <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              {item.categorie}
                            </span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate text-xs">
                        {item.description ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-bold whitespace-nowrap tabular-nums">
                        <span className={item.type === "depense" ? "text-red-500" : "text-emerald-600"}>
                          {item.type === "depense" ? "−" : "+"} {fmtNum(item.montant)} FCFA
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ type: item.type === "depense" ? "depense" : "rentree", entry: item })}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDelItem(item)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Supprimer"
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

      {/* ── Modals ── */}
      {modal && (
        <EntryModal
          modalType={modal.type}
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
      {delItem && (
        <DeleteModal
          onConfirm={() => handleDelete(delItem)}
          onClose={() => setDelItem(null)}
        />
      )}
    </div>
  );
}
