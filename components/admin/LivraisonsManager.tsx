"use client";

import { useState, useCallback } from "react";
import {
  Truck, Plus, X, Check, Loader2,
  MapPin, Phone, User, Clock, Pencil, Trash2,
  ChevronLeft, ChevronRight, Copy, UserPlus,
  Package, AlertCircle,
} from "lucide-react";
import type { LivraisonAdmin, Livreur } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";

/* ─── Types ─── */
const STATUTS: { value: LivraisonAdmin["statut"]; label: string; color: string }[] = [
  { value: "en_attente", label: "En attente",  color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "acceptee",   label: "Acceptée",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "en_cours",   label: "En cours",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "livre",      label: "Livré",       color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "echoue",     label: "Échoué",      color: "bg-red-100 text-red-700 border-red-200" },
];

interface LivStats { total: number; en_attente: number; en_cours: number; livre: number }

interface Props {
  initialLivraisons: LivraisonAdmin[];
  initialTotal:      number;
  initialLivreurs:   Livreur[];
  initialStats:      LivStats;
}

const LIMIT = 50;

function statutBadge(statut: string) {
  const s = STATUTS.find(x => x.value === statut);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s?.color ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {s?.label ?? statut}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function LivraisonsManager({ initialLivraisons, initialTotal, initialLivreurs, initialStats }: Props) {
  const [livraisons,  setLivraisons]  = useState<LivraisonAdmin[]>(initialLivraisons);
  const [total,       setTotal]       = useState(initialTotal);
  const [livreurs,    setLivreurs]    = useState<Livreur[]>(initialLivreurs);
  const [stats,       setStats]       = useState<LivStats>(initialStats);
  const [loading,     setLoading]     = useState(false);
  const [flash,       setFlash]       = useState("");
  const [search,      setSearch]      = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [offset,      setOffset]      = useState(0);

  /* ── Modal livraison manuelle ── */
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [addForm, setAddForm] = useState({ client_nom: "", client_tel: "", adresse: "", contact_livraison: "", lien_localisation: "", note: "" });
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError,  setAddError]  = useState("");

  /* ── Livreur modal ── */
  const [showLivreurModal, setShowLivreurModal] = useState(false);
  const [livreurForm, setLivreurForm] = useState({ nom: "", telephone: "" });
  const [savingLivreur, setSavingLivreur] = useState(false);

  /* ── Assign modal ── */
  const [assignModal, setAssignModal] = useState<{ livraison: LivraisonAdmin } | null>(null);
  const [assignLivreurId, setAssignLivreurId] = useState("");

  /* ── Copied link flash ── */
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3000); }

  const fetchLivraisons = useCallback(async (q = "", statut = "", off = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)      params.set("q",      q);
    if (statut) params.set("statut", statut);
    if (off)    params.set("offset", String(off));
    params.set("limit", String(LIMIT));
    const res  = await fetch(`/api/admin/livraisons?${params}`);
    const data = await res.json();
    if (res.ok) { setLivraisons(data.items); setTotal(data.total); }
    setLoading(false);
  }, []);

  function applySearch(q: string) { setSearch(q); setOffset(0); fetchLivraisons(q, filterStatut, 0); }
  function applyFilter(s: string) { setFilterStatut(s); setOffset(0); fetchLivraisons(search, s, 0); }
  function paginate(off: number)  { setOffset(off); fetchLivraisons(search, filterStatut, off); }

  /* ── Change statut ── */
  async function changeStatut(id: number, statut: LivraisonAdmin["statut"]) {
    await fetch(`/api/admin/livraisons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setLivraisons(prev => prev.map(l => l.id === id ? { ...l, statut } : l));
    showFlash("Statut mis à jour ✓");
  }

  /* ── Delete ── */
  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette livraison ?")) return;
    await fetch(`/api/admin/livraisons/${id}`, { method: "DELETE" });
    setLivraisons(prev => prev.filter(l => l.id !== id));
    setTotal(t => t - 1);
    showFlash("Supprimé ✓");
  }

  /* ── Assign livreur ── */
  async function handleAssign() {
    if (!assignModal || !assignLivreurId) return;
    const res = await fetch(`/api/admin/livraisons/${assignModal.livraison.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livreur_id: Number(assignLivreurId) }),
    });
    if (res.ok) {
      const liv = livreurs.find(l => l.id === Number(assignLivreurId));
      setLivraisons(prev => prev.map(l =>
        l.id === assignModal.livraison.id
          ? { ...l, livreur_id: Number(assignLivreurId), livreur: liv?.nom ?? null }
          : l
      ));
      setAssignModal(null);
      setAssignLivreurId("");
      showFlash("Livreur assigné ✓");
    }
  }

  /* ── Create manual livraison ── */
  async function handleCreateManual(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.client_nom.trim()) { setAddError("Nom du client requis."); return; }
    setSavingAdd(true); setAddError("");
    const res  = await fetch("/api/admin/livraisons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    setSavingAdd(false);
    if (!res.ok) { setAddError(data.error ?? "Erreur"); return; }
    setShowAddModal(false);
    setAddForm({ client_nom: "", client_tel: "", adresse: "", contact_livraison: "", lien_localisation: "", note: "" });
    fetchLivraisons(search, filterStatut, 0);
    setOffset(0);
    showFlash("Livraison créée ✓");
  }

  /* ── Create livreur ── */
  async function handleCreateLivreur() {
    if (!livreurForm.nom.trim()) return;
    setSavingLivreur(true);
    const res  = await fetch("/api/admin/livreurs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(livreurForm),
    });
    const data = await res.json();
    if (res.ok) {
      setLivreurs(prev => [...prev, data.livreur]);
      setLivreurForm({ nom: "", telephone: "" });
      setShowLivreurModal(false);
      showFlash("Livreur créé ✓");
    }
    setSavingLivreur(false);
  }

  /* ── Delete livreur ── */
  async function handleDeleteLivreur(id: number) {
    if (!confirm("Supprimer ce livreur ?")) return;
    await fetch(`/api/admin/livreurs/${id}`, { method: "DELETE" });
    setLivreurs(prev => prev.filter(l => l.id !== id));
    showFlash("Livreur supprimé ✓");
  }

  /* ── Copy link ── */
  function copyLink(livreur: Livreur) {
    const url = `${window.location.origin}/livreur/${livreur.code_acces}`;
    navigator.clipboard.writeText(url);
    setCopiedId(livreur.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Flash */}
      {flash && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold">
          {flash}
        </div>
      )}

      <PageHeader
        title="Livraisons"
        subtitle="Gérez les livraisons et les livreurs"
        accent="amber"
        searchValue={search}
        onSearchChange={v => applySearch(v)}
        onSearch={e => { e.preventDefault(); applySearch(search); }}
        searchPlaceholder="Rechercher…"
        onRefresh={() => fetchLivraisons(search, filterStatut, offset)}
        refreshLoading={loading}
        ctaLabel="Ajouter"
        onCtaClick={() => setShowAddModal(true)}
        extra={
          <>
            <select
              value={filterStatut}
              onChange={e => applyFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 text-slate-600"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button
              onClick={() => setShowLivreurModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Livreur
            </button>
          </>
        }
      />

      {/* KPI dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <Truck className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Toutes livraisons</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En attente</p>
            <AlertCircle className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.en_attente}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">À prendre en charge</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En cours</p>
            <Clock className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.en_cours}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Acceptée / en cours</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Livrées</p>
            <Check className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.livre}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Complétées</span>
        </div>
      </div>

      {/* ── Livreurs cards ── */}
      {livreurs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Livreurs enregistrés</p>
          <div className="flex flex-wrap gap-3">
            {livreurs.map(lv => (
              <div key={lv.id} className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{lv.nom}</p>
                  {lv.telephone && <p className="text-xs text-slate-400">{lv.telephone}</p>}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${lv.statut === "disponible" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {lv.statut === "disponible" ? "Disponible" : "Indisponible"}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => copyLink(lv)}
                    title="Copier le lien livreur"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {copiedId === lv.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteLivreur(lv.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table livraisons ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-semibold">Chargement…</p>
          </div>
        ) : livraisons.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Truck className="w-10 h-10 opacity-30" />
            <p className="font-semibold">Aucune livraison trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Référence</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Client</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Adresse</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden lg:table-cell">Livreur</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Date</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Statut</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {livraisons.map(liv => (
                    <tr key={liv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-800">{liv.reference}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{liv.client_nom}</p>
                        {liv.client_tel && (
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{liv.client_tel}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-sm text-slate-600 space-y-0.5">
                          {liv.adresse && (
                            <p className="flex items-start gap-1 line-clamp-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />{liv.adresse}
                            </p>
                          )}
                          {liv.contact_livraison && (
                            <p className="text-xs text-slate-400">{liv.contact_livraison}</p>
                          )}
                          {liv.lien_localisation && (
                            <a href={liv.lien_localisation} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-indigo-500 hover:underline">Voir sur la carte</a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {liv.livreur ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                              <User className="w-3 h-3 text-indigo-600" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{liv.livreur}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAssignModal({ livraison: liv }); setAssignLivreurId(""); }}
                            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Assigner
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          {formatDate(liv.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={liv.statut}
                          onChange={e => changeStatut(liv.id, e.target.value as LivraisonAdmin["statut"])}
                          className="text-xs font-semibold rounded-xl border px-2 py-1 outline-none bg-white cursor-pointer"
                        >
                          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setAssignModal({ livraison: liv }); setAssignLivreurId(String(liv.livreur_id ?? "")); }}
                            title="Assigner un livreur"
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(liv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {currentPage} sur {totalPages} · {total} livraisons</p>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => paginate(offset - LIMIT)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={offset + LIMIT >= total} onClick={() => paginate(offset + LIMIT)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════ MODAL : Livraison manuelle ════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Nouvelle livraison</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateManual} className="space-y-3">
              {addError && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{addError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nom du client *</label>
                <input type="text" value={addForm.client_nom} autoFocus required
                  onChange={e => setAddForm(f => ({ ...f, client_nom: e.target.value }))}
                  placeholder="Ex : Kofi AMEVOR"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
                <input type="text" value={addForm.client_tel}
                  onChange={e => setAddForm(f => ({ ...f, client_tel: e.target.value }))}
                  placeholder="+228 90 00 00 00"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Adresse de livraison</label>
                <input type="text" value={addForm.adresse}
                  onChange={e => setAddForm(f => ({ ...f, adresse: e.target.value }))}
                  placeholder="Quartier, rue…"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contact livraison</label>
                <input type="text" value={addForm.contact_livraison}
                  onChange={e => setAddForm(f => ({ ...f, contact_livraison: e.target.value }))}
                  placeholder="Téléphone du destinataire si différent"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Lien localisation</label>
                <input type="url" value={addForm.lien_localisation}
                  onChange={e => setAddForm(f => ({ ...f, lien_localisation: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Note</label>
                <textarea value={addForm.note} rows={2}
                  onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Instructions, remarques…"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none resize-none" />
              </div>
              <button type="submit" disabled={savingAdd}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all">
                {savingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer la livraison
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL : Créer livreur ════ */}
      {showLivreurModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLivreurModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Nouveau livreur</h3>
              <button onClick={() => setShowLivreurModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nom *</label>
                <input type="text" value={livreurForm.nom} autoFocus
                  onChange={e => setLivreurForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Kofi AMEVOR"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-indigo-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
                <input type="text" value={livreurForm.telephone}
                  onChange={e => setLivreurForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="+228 90 00 00 00"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-indigo-400 outline-none" />
              </div>
            </div>
            <p className="text-xs text-slate-400">Un code d&apos;accès unique sera généré automatiquement.</p>
            <button
              onClick={handleCreateLivreur}
              disabled={savingLivreur || !livreurForm.nom.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {savingLivreur ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Créer
            </button>
          </div>
        </div>
      )}

      {/* ════ MODAL : Assigner livreur ════ */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Assigner un livreur</h3>
              <button onClick={() => setAssignModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Livraison <span className="font-mono font-bold text-slate-700">{assignModal.livraison.reference}</span></p>
            {livreurs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun livreur enregistré.</p>
            ) : (
              <div className="space-y-2">
                {livreurs.map(lv => (
                  <button
                    key={lv.id}
                    onClick={() => setAssignLivreurId(String(lv.id))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                      assignLivreurId === String(lv.id)
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{lv.nom}</p>
                      <span className={`text-[10px] font-bold ${lv.statut === "disponible" ? "text-emerald-600" : "text-slate-400"}`}>
                        {lv.statut === "disponible" ? "Disponible" : "Indisponible"}
                      </span>
                    </div>
                    {assignLivreurId === String(lv.id) && <Check className="w-4 h-4 text-indigo-600 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleAssign}
              disabled={!assignLivreurId}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              Confirmer l&apos;assignation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
