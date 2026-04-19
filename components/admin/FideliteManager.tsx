"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, X, Gift, ChevronDown, ChevronUp } from "lucide-react";

interface LoyaltyClient {
  telephone:       string;
  nom:             string | null;
  total_points:    number;
  last_date:       string;
  nb_transactions: number;
}

interface Props {
  clients: LoyaltyClient[];
}

type ModalMode = "add" | "deduct";

interface ModalState {
  open:      boolean;
  mode:      ModalMode;
  telephone: string;
  nom:       string;
}

export default function FideliteManager({ clients }: Props) {
  const [search, setSearch]   = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const [modal, setModal]   = useState<ModalState>({ open: false, mode: "add", telephone: "", nom: "" });
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = clients.filter(c =>
      c.telephone.includes(q) || (c.nom ?? "").toLowerCase().includes(q)
    );
    return [...list].sort((a, b) =>
      sortAsc ? a.total_points - b.total_points : b.total_points - a.total_points
    );
  }, [clients, search, sortAsc]);

  function openModal(client: LoyaltyClient, mode: ModalMode) {
    setModal({ open: true, mode, telephone: client.telephone, nom: client.nom ?? client.telephone });
    setPoints("");
    setReason("");
    setSuccess(false);
    setError("");
  }

  function closeModal() {
    setModal(m => ({ ...m, open: false }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (!pts || pts <= 0) { setError("Entrez un nombre de points valide"); return; }
    if (!reason.trim()) { setError("Veuillez indiquer un motif"); return; }

    setLoading(true);
    setError("");

    const finalPoints = modal.mode === "deduct" ? -pts : pts;

    try {
      const res = await fetch("/api/admin/fidelite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ telephone: modal.telephone, points: finalPoints, reason: reason.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erreur"); }
      else { setSuccess(true); setTimeout(closeModal, 1200); }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  return (
    <>
      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <Gift className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-900 text-sm flex-1">Clients du programme</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 w-48"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th
                  className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition-colors"
                  onClick={() => setSortAsc(v => !v)}
                >
                  <span className="flex items-center justify-end gap-1">
                    Points
                    {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Transactions</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Dernière activité</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.telephone} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{c.nom ?? "—"}</p>
                    <p className="text-xs text-slate-400">{c.telephone}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${c.total_points >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {c.total_points >= 0 ? "+" : ""}{c.total_points.toLocaleString("fr-FR")} pts
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-500 hidden sm:table-cell">{c.nb_transactions}</td>
                  <td className="px-5 py-4 text-right text-slate-400 text-xs hidden md:table-cell">
                    {new Date(c.last_date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(c, "add")}
                        title="Ajouter des points"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openModal(c, "deduct")}
                        title="Déduire des points"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">Aucun résultat</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modal.mode === "add" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                {modal.mode === "add" ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {modal.mode === "add" ? "Ajouter des points" : "Déduire des points"}
                </h3>
                <p className="text-xs text-slate-400">{modal.nom}</p>
              </div>
            </div>

            {success ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-semibold text-emerald-700">Points mis à jour !</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nombre de points
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                    placeholder="ex: 50"
                    value={points}
                    onChange={e => setPoints(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Motif
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                    placeholder="ex: Correction manuelle, promotion…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${modal.mode === "add" ? "bg-emerald-700 hover:bg-emerald-600" : "bg-red-600 hover:bg-red-500"} disabled:opacity-60`}
                >
                  {loading ? "Enregistrement…" : modal.mode === "add" ? "Ajouter" : "Déduire"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
