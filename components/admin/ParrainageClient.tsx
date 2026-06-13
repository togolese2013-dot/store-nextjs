"use client";

import { useState } from "react";
import { Link2, Plus, Trash2, X, Copy, Check, Users, Settings, Save } from "lucide-react";

type Referral = {
  id: number;
  nom: string;
  telephone: string;
  code: string;
  uses_count: number;
  gains_total: number;
  created_at: string;
};

interface Props {
  initialReferrals: Referral[];
  initialFilleulPct: number;
  initialParrainPct: number;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function ParrainageClient({ initialReferrals, initialFilleulPct, initialParrainPct }: Props) {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [showModal, setShowModal]   = useState(false);
  const [nom, setNom]               = useState("");
  const [telephone, setTelephone]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [copiedId, setCopiedId]     = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Settings
  const [filleulPct, setFilleulPct] = useState(initialFilleulPct);
  const [parrainPct, setParrainPct] = useState(initialParrainPct);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved]   = useState(false);

  const totalUses   = referrals.reduce((s, r) => s + r.uses_count, 0);
  const activeCount = referrals.filter(r => r.uses_count > 0).length;
  const totalGains  = referrals.reduce((s, r) => s + Number(r.gains_total ?? 0), 0);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await fetch("/api/admin/referrals/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filleul_pct: filleulPct, parrain_pct: parrainPct }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim(), telephone: telephone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur serveur."); return; }
      const newRef: Referral = {
        id: data.id ?? Date.now(),
        nom: data.nom,
        telephone: telephone.trim(),
        code: data.code,
        uses_count: 0,
        gains_total: 0,
        created_at: new Date().toISOString(),
      };
      setReferrals(prev => [newRef, ...prev]);
      setShowModal(false);
      setNom("");
      setTelephone("");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce code de parrainage ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setReferrals(prev => prev.filter(r => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function copyCode(r: Referral) {
    navigator.clipboard.writeText(r.code);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Codes créés</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Codes actifs</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Total filleuls</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalUses}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Gains cumulés</p>
          <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatPrice(totalGains)}</p>
        </div>
      </div>

      {/* Config taux */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="font-bold text-slate-900 text-sm">Taux de parrainage</h2>
        </div>
        <form onSubmit={handleSaveSettings} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Remise filleul (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={100} step={1}
                value={filleulPct}
                onChange={e => setFilleulPct(Number(e.target.value))}
                style={{ fontSize: "16px" }}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
              <span className="text-xs text-slate-500">sur le montant de la commande</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Gain parrain (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={100} step={1}
                value={parrainPct}
                onChange={e => setParrainPct(Number(e.target.value))}
                style={{ fontSize: "16px" }}
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
              <span className="text-xs text-slate-500">du sous-total crédité au parrain</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {settingsSaved
              ? <><Check className="w-4 h-4 text-emerald-400" /> Enregistré</>
              : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Ex : filleul −{filleulPct}% sur sa commande · parrain gagne {parrainPct}% du sous-total à chaque utilisation.
        </p>
      </div>

      {/* Bouton créer */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowModal(true); setError(""); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {/* Table */}
      {referrals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Link2 className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun code de parrainage</p>
          <p className="text-sm mt-1">Cliquez sur "Nouveau code" pour en créer un.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-slate-900 text-sm">Tous les codes</h2>
            <span className="ml-auto text-xs text-slate-400">{referrals.length} codes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Parrain</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Filleuls</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Gains</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Créé le</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{r.nom || "—"}</p>
                      <p className="text-xs text-slate-400">{r.telephone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wider">
                          {r.code}
                        </code>
                        <button
                          onClick={() => copyCode(r)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copier"
                        >
                          {copiedId === r.id
                            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.uses_count > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          {r.uses_count} filleul{r.uses_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {Number(r.gains_total) > 0 ? (
                        <span className="text-emerald-600 font-bold text-sm">
                          {formatPrice(Number(r.gains_total))}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-xs hidden sm:table-cell">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Nouveau code de parrainage</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom du parrain</label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  required
                  placeholder="ex: Marie Koffi"
                  style={{ fontSize: "16px" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  required
                  placeholder="ex: +22890000000"
                  style={{ fontSize: "16px" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3.5 py-2.5">
                Le filleul obtient −{filleulPct}% sur sa commande. Le parrain gagne {parrainPct}% du sous-total à chaque utilisation.
              </p>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? "Création…" : "Créer le code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
