"use client";

import { useState, useCallback } from "react";
import {
  FileText, BookOpen, Truck, Plus, Search, Filter,
  Eye, Trash2, Printer, Loader2, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, RefreshCw, SlidersHorizontal,
} from "lucide-react";
import type { Facture, Devis, Livraison } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";

/* ─── Types ─── */
type Tab = "factures" | "devis" | "livraisons";

interface Stats { factures: number; devis: number; livraisons: number }

interface Props {
  initialFactures:   Facture[];
  initialDevis:      Devis[];
  initialLivraisons: Livraison[];
  initialStats:      Stats;
  totalFactures:     number;
  totalDevis:        number;
  totalLivraisons:   number;
}

/* ─── Helpers ─── */
const FACTURE_STATUTS: { value: Facture["statut"]; label: string; color: string }[] = [
  { value: "brouillon", label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  { value: "valide",    label: "Validé",    color: "bg-blue-100 text-blue-700" },
  { value: "paye",      label: "Payé",      color: "bg-green-100 text-green-700" },
  { value: "annule",    label: "Annulé",    color: "bg-red-100 text-red-700" },
];

const DEVIS_STATUTS: { value: Devis["statut"]; label: string; color: string }[] = [
  { value: "brouillon", label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  { value: "envoye",    label: "Envoyé",    color: "bg-blue-100 text-blue-700" },
  { value: "accepte",   label: "Accepté",   color: "bg-green-100 text-green-700" },
  { value: "refuse",    label: "Refusé",    color: "bg-red-100 text-red-700" },
  { value: "expire",    label: "Expiré",    color: "bg-orange-100 text-orange-700" },
];

const LIVRAISON_STATUTS: { value: Livraison["statut"]; label: string; color: string }[] = [
  { value: "en_attente", label: "En attente", color: "bg-slate-100 text-slate-600" },
  { value: "en_cours",   label: "En cours",   color: "bg-blue-100 text-blue-700" },
  { value: "livre",      label: "Livré",      color: "bg-green-100 text-green-700" },
  { value: "echoue",     label: "Échoué",     color: "bg-red-100 text-red-700" },
];

function statutBadge(statut: string, list: { value: string; label: string; color: string }[]) {
  const s = list.find(x => x.value === statut);
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.color ?? "bg-slate-100 text-slate-600"}`}>
      {s?.label ?? statut}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const LIMIT = 50;

/* ─── Modal Nouvelle Facture / Nouveau Devis ─── */
interface NewDocModal {
  type: "facture" | "devis";
  clientNom:   string;
  clientTel:   string;
  note:        string;
  saving:      boolean;
  error:       string;
}

const emptyModal = (): NewDocModal => ({
  type: "facture", clientNom: "", clientTel: "", note: "", saving: false, error: "",
});

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function VentesManager({
  initialFactures, initialDevis, initialLivraisons,
  initialStats, totalFactures, totalDevis, totalLivraisons,
}: Props) {

  /* ── State ── */
  const [tab,        setTab]        = useState<Tab>("factures");
  const [stats,      setStats]      = useState<Stats>(initialStats);
  const [factures,   setFactures]   = useState<Facture[]>(initialFactures);
  const [devis,      setDevis]      = useState<Devis[]>(initialDevis);
  const [livraisons, setLivraisons] = useState<Livraison[]>(initialLivraisons);
  const [totals,     setTotals]     = useState({ factures: totalFactures, devis: totalDevis, livraisons: totalLivraisons });
  const [offset,     setOffset]     = useState(0);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [flash,      setFlash]      = useState("");
  const [modal,      setModal]      = useState<NewDocModal | null>(null);

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3500); }

  /* ── Fetch ── */
  const fetchTab = useCallback(async (t: Tab, q = "", off = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)   params.set("q",      q);
    if (off) params.set("offset", String(off));
    params.set("limit", String(LIMIT));

    if (t === "factures") {
      const res  = await fetch(`/api/admin/ventes/factures?${params}`);
      const data = await res.json();
      if (res.ok) { setFactures(data.items); setStats(data.stats); setTotals(p => ({ ...p, factures: data.total })); }
    } else if (t === "devis") {
      const res  = await fetch(`/api/admin/ventes/devis?${params}`);
      const data = await res.json();
      if (res.ok) { setDevis(data.items); setTotals(p => ({ ...p, devis: data.total })); }
    } else {
      const res  = await fetch(`/api/admin/ventes/livraisons?${params}`);
      const data = await res.json();
      if (res.ok) { setLivraisons(data.items); setTotals(p => ({ ...p, livraisons: data.total })); }
    }
    setLoading(false);
  }, []);

  function switchTab(t: Tab) { setTab(t); setOffset(0); setSearch(""); fetchTab(t, "", 0); }
  function applySearch(q: string) { setSearch(q); setOffset(0); fetchTab(tab, q, 0); }
  function paginate(off: number) { setOffset(off); fetchTab(tab, search, off); }

  /* ── Delete ── */
  async function handleDelete(type: Tab, id: number) {
    if (!confirm("Supprimer cet élément ?")) return;
    const url = type === "factures" ? `/api/admin/ventes/factures/${id}`
              : type === "devis"    ? `/api/admin/ventes/devis/${id}`
              : `/api/admin/ventes/livraisons/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      if (type === "factures")   setFactures(p => p.filter(x => x.id !== id));
      if (type === "devis")      setDevis(p => p.filter(x => x.id !== id));
      if (type === "livraisons") setLivraisons(p => p.filter(x => x.id !== id));
      showFlash("Supprimé ✓");
    }
  }

  /* ── Statut update ── */
  async function handleStatut(type: "factures" | "devis", id: number, statut: string) {
    const url = type === "factures" ? `/api/admin/ventes/factures/${id}` : `/api/admin/ventes/devis/${id}`;
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    if (res.ok) {
      if (type === "factures") setFactures(p => p.map(x => x.id === id ? { ...x, statut: statut as Facture["statut"] } : x));
      if (type === "devis")    setDevis(p => p.map(x => x.id === id ? { ...x, statut: statut as Devis["statut"] } : x));
      showFlash("Statut mis à jour ✓");
    }
  }

  /* ── Create ── */
  async function submitModal() {
    if (!modal) return;
    if (!modal.clientNom.trim()) { setModal(m => m ? { ...m, error: "Le nom du client est requis." } : m); return; }
    setModal(m => m ? { ...m, saving: true, error: "" } : m);
    const url = modal.type === "facture" ? "/api/admin/ventes/factures" : "/api/admin/ventes/devis";
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_nom: modal.clientNom, client_tel: modal.clientTel || undefined, items: [{ nom: "—", reference: "", qty: 1, prix: 0, total: 0 }], sous_total: 0, total: 0, note: modal.note || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setModal(null);
      showFlash(`${modal.type === "facture" ? "Facture" : "Devis"} créé ✓`);
      fetchTab(modal.type === "facture" ? "factures" : "devis", search, offset);
    } else {
      setModal(m => m ? { ...m, saving: false, error: data.error ?? "Erreur" } : m);
    }
  }

  /* ── Print ── */
  function handlePrint(ref: string) { window.print(); void ref; }

  /* ── Pagination ── */
  const currentTotal = tab === "factures" ? totals.factures : tab === "devis" ? totals.devis : totals.livraisons;
  const totalPages   = Math.ceil(currentTotal / LIMIT);
  const currentPage  = Math.floor(offset / LIMIT) + 1;

  /* ── Current data ── */
  const rows = tab === "factures" ? factures : tab === "devis" ? devis : livraisons;

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Flash */}
      {flash && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold">
          {flash}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-800 text-2xl text-slate-900">Gestion des ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez factures, devis et livraisons</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => applySearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white rounded-2xl border border-slate-200 focus:border-brand-500 outline-none w-48"
            />
          </div>
          {/* Filter icon */}
          <button className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => fetchTab(tab, search, offset)}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* Nouvelle facture */}
          <button
            onClick={() => setModal({ ...emptyModal(), type: "facture" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle facture
          </button>
          {/* Nouveau devis */}
          <button
            onClick={() => setModal({ ...emptyModal(), type: "devis" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-brand-900 text-brand-900 font-bold text-sm hover:bg-brand-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Nouveau devis
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 w-fit">
        {([
          { key: "factures",   label: "Factures",   icon: FileText, count: stats.factures },
          { key: "devis",      label: "Devis",       icon: BookOpen,  count: stats.devis },
          { key: "livraisons", label: "Livraisons",  icon: Truck,     count: stats.livraisons },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? "bg-brand-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tab === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-semibold">Chargement…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <FileText className="w-10 h-10 opacity-30" />
            <p className="font-semibold">Aucun élément trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left px-5 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Référence</th>
                    <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Client</th>
                    <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400 hidden sm:table-cell">Date</th>
                    {tab !== "livraisons" && (
                      <th className="text-right px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400 hidden md:table-cell">Montant</th>
                    )}
                    {tab === "livraisons" && (
                      <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400 hidden md:table-cell">Adresse</th>
                    )}
                    <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Statut</th>
                    <th className="text-right px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => {
                    const isFacture   = tab === "factures";
                    const isDevis     = tab === "devis";
                    const isLivraison = tab === "livraisons";
                    const f = row as Facture;
                    const d = row as Devis;
                    const l = row as Livraison;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Référence */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-semibold text-slate-800">{row.reference}</span>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{row.client_nom}</p>
                          {(isFacture || isDevis) && (f.client_tel || d.client_tel) && (
                            <p className="text-xs text-slate-400">{isFacture ? f.client_tel : d.client_tel}</p>
                          )}
                          {isLivraison && l.client_tel && (
                            <p className="text-xs text-slate-400">{l.client_tel}</p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-500 text-sm hidden sm:table-cell">
                          {formatDate(row.created_at)}
                        </td>

                        {/* Montant / Adresse */}
                        {(isFacture || isDevis) && (
                          <td className="px-4 py-3.5 text-right font-display font-700 text-brand-700 hidden md:table-cell">
                            {formatPrice(isFacture ? f.total : d.total)}
                          </td>
                        )}
                        {isLivraison && (
                          <td className="px-4 py-3.5 text-slate-500 text-sm hidden md:table-cell">
                            <span className="line-clamp-1">{l.adresse ?? "—"}</span>
                          </td>
                        )}

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          {isFacture   && statutBadge(f.statut, FACTURE_STATUTS)}
                          {isDevis     && statutBadge(d.statut, DEVIS_STATUTS)}
                          {isLivraison && statutBadge(l.statut, LIVRAISON_STATUTS)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {/* Marquer payé (facture validée) */}
                            {isFacture && f.statut === "valide" && (
                              <button
                                onClick={() => handleStatut("factures", f.id, "paye")}
                                title="Marquer payé"
                                className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {/* Voir */}
                            <button
                              title="Voir"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Supprimer */}
                            <button
                              onClick={() => handleDelete(tab, row.id)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {/* Imprimer (factures/devis) */}
                            {!isLivraison && (
                              <button
                                onClick={() => handlePrint(row.reference)}
                                title="Imprimer"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page {currentPage} sur {totalPages} · {currentTotal} résultats
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={offset === 0}
                    onClick={() => paginate(offset - LIMIT)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={offset + LIMIT >= currentTotal}
                    onClick={() => paginate(offset + LIMIT)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════
          MODAL Nouvelle facture / devis
      ════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {modal.type === "facture" ? "Nouvelle facture" : "Nouveau devis"}
                  </h3>
                  <p className="text-xs text-slate-400">La référence sera générée automatiquement</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Champs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom du client *</label>
                <input
                  type="text"
                  value={modal.clientNom}
                  onChange={e => setModal(m => m ? { ...m, clientNom: e.target.value } : m)}
                  placeholder="Ex : WADADA"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Téléphone</label>
                <input
                  type="text"
                  value={modal.clientTel}
                  onChange={e => setModal(m => m ? { ...m, clientTel: e.target.value } : m)}
                  placeholder="Ex : +228 90 00 00 00"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Note</label>
                <textarea
                  rows={2}
                  value={modal.note}
                  onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                  placeholder="Remarques optionnelles…"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {modal.error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {modal.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={submitModal}
                disabled={modal.saving || !modal.clientNom.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-50 transition-all"
              >
                {modal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Créer
              </button>
              <button
                onClick={() => setModal(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
