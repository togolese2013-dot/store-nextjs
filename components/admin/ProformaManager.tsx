"use client";

import { useState, useCallback, useRef } from "react";
import {
  Plus, Search, Trash2, Printer, ChevronLeft, ChevronRight,
  X, Package, PenLine, CheckCircle, XCircle, Clock, Send,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import BoutiqueDocPrint from "@/components/admin/BoutiqueDocPrint";
import type { Devis } from "@/lib/admin-db";
import type { PrintItem } from "@/components/admin/BoutiqueDocPrint";

/* ── Types ── */
interface StockProduct {
  produit_id: number;
  nom: string;
  reference: string;
  quantite: number;
  prix_vente: number;
}

interface ModalItem {
  key: string;
  mode: "stock" | "libre";
  produit_id: number;
  nom: string;
  reference: string;
  qty: number;
  prix: number;
  total: number;
  stock_dispo: number;
}

interface ModalState {
  client_nom: string;
  client_tel: string;
  remise: number;
  valide_jusqu: string;
  note: string;
  items: ModalItem[];
}

const STATUT_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon", color: "bg-slate-100 text-slate-600",   icon: <Clock className="w-3 h-3" /> },
  envoye:    { label: "Envoyé",    color: "bg-blue-100 text-blue-700",     icon: <Send className="w-3 h-3" /> },
  accepte:   { label: "Accepté",   color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="w-3 h-3" /> },
  refuse:    { label: "Refusé",    color: "bg-red-100 text-red-700",       icon: <XCircle className="w-3 h-3" /> },
  expire:    { label: "Expiré",    color: "bg-orange-100 text-orange-700", icon: <Clock className="w-3 h-3" /> },
};

const LIMIT = 25;
const TODAY = new Date().toISOString().slice(0, 10);
const IN30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

function emptyModal(): ModalState {
  return { client_nom: "", client_tel: "", remise: 0, valide_jusqu: IN30, note: "", items: [] };
}

function parseItems(raw: string | unknown[]): PrintItem[] {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (arr as Record<string, unknown>[]).map(i => ({
      nom:       String(i.nom ?? ""),
      reference: String(i.reference ?? ""),
      qty:       Number(i.qty ?? 1),
      prix:      Number(i.prix ?? 0),
      total:     Number(i.total ?? 0),
    }));
  } catch { return []; }
}

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function ProformaManager({ initialDevis, initialTotal }: {
  initialDevis: Devis[];
  initialTotal: number;
}) {
  const [devis,    setDevis]    = useState<Devis[]>(initialDevis);
  const [total,    setTotal]    = useState(initialTotal);
  const [offset,   setOffset]   = useState(0);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [flash,    setFlash]    = useState("");
  const [modal,    setModal]    = useState<ModalState | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [printDoc, setPrintDoc] = useState<Devis | null>(null);

  /* stock autocomplete */
  const [stockList,    setStockList]    = useState<StockProduct[]>([]);
  const [stockLoaded,  setStockLoaded]  = useState(false);
  const [prodSearch,   setProdSearch]   = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Flash ── */
  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  }

  /* ── Fetch list ── */
  const fetchDevis = useCallback(async (q = "", off = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/ventes/devis?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDevis(data.items ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, []);

  function applySearch(q: string) { setSearch(q); setOffset(0); fetchDevis(q, 0); }
  function paginate(off: number)  { setOffset(off); fetchDevis(search, off); }

  /* ── Load stock ── */
  async function openModal() {
    setModal(emptyModal());
    if (!stockLoaded) {
      const res = await fetch("/api/admin/stock-boutique?limit=500&filter=disponible");
      if (res.ok) {
        const data = await res.json();
        setStockList(data.items ?? []);
        setStockLoaded(true);
      }
    }
  }

  /* ── Add stock product ── */
  function addStockProduct(p: StockProduct) {
    setModal(m => {
      if (!m) return m;
      const exists = m.items.find(i => i.produit_id === p.produit_id);
      if (exists) {
        return {
          ...m,
          items: m.items.map(i => i.produit_id === p.produit_id
            ? { ...i, qty: Math.min(i.qty + 1, i.stock_dispo), total: (i.qty + 1) * i.prix }
            : i),
        };
      }
      return {
        ...m,
        items: [...m.items, {
          key:        crypto.randomUUID(),
          mode:       "stock",
          produit_id: p.produit_id,
          nom:        p.nom,
          reference:  p.reference,
          qty:        1,
          prix:       p.prix_vente,
          total:      p.prix_vente,
          stock_dispo: p.quantite,
        }],
      };
    });
    setProdSearch("");
    setShowDropdown(false);
  }

  /* ── Add free product ── */
  function addFreeProduct() {
    setModal(m => m ? {
      ...m,
      items: [...m.items, {
        key:        crypto.randomUUID(),
        mode:       "libre",
        produit_id: 0,
        nom:        "",
        reference:  "",
        qty:        1,
        prix:       0,
        total:      0,
        stock_dispo: 9999,
      }],
    } : m);
  }

  function updateItem(key: string, field: string, value: string | number) {
    setModal(m => {
      if (!m) return m;
      return {
        ...m,
        items: m.items.map(i => {
          if (i.key !== key) return i;
          const updated = { ...i, [field]: value };
          updated.total = updated.qty * updated.prix;
          return updated;
        }),
      };
    });
  }

  function removeItem(key: string) {
    setModal(m => m ? { ...m, items: m.items.filter(i => i.key !== key) } : m);
  }

  function calcTotals(items: ModalItem[], remise: number) {
    const sous = items.reduce((s, i) => s + i.total, 0);
    return { sous_total: sous, total: Math.max(0, sous - remise) };
  }

  /* ── Save ── */
  async function saveDevis() {
    if (!modal) return;
    if (!modal.client_nom.trim()) return;
    if (modal.items.length === 0) return;
    setSaving(true);
    const { sous_total, total: tot } = calcTotals(modal.items, modal.remise);
    const body = {
      client_nom:   modal.client_nom.trim(),
      client_tel:   modal.client_tel.trim() || undefined,
      items:         modal.items.map(i => ({ produit_id: i.produit_id, nom: i.nom, reference: i.reference, qty: i.qty, prix: i.prix, total: i.total })),
      sous_total,
      remise:        modal.remise,
      total:         tot,
      valide_jusqu:  modal.valide_jusqu || undefined,
      note:          modal.note.trim() || undefined,
      statut:        "brouillon",
    };
    const res = await fetch("/api/admin/ventes/devis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setModal(null);
      showFlash("Proforma créé ✓");
      fetchDevis(search, 0);
      setOffset(0);
    }
    setSaving(false);
  }

  /* ── Delete ── */
  async function deleteDevis(id: number) {
    if (!confirm("Supprimer ce proforma ?")) return;
    await fetch(`/api/admin/ventes/devis/${id}`, { method: "DELETE" });
    showFlash("Supprimé ✓");
    fetchDevis(search, offset);
  }

  /* ── Update statut ── */
  async function changeStatut(id: number, statut: Devis["statut"]) {
    await fetch(`/api/admin/ventes/devis/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut } : d));
  }

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const filtered    = stockLoaded
    ? stockList.filter(p => p.quantite > 0 && (
        p.nom.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.reference.toLowerCase().includes(prodSearch.toLowerCase())
      )).slice(0, 12)
    : [];

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="space-y-5">
      <PageHeader title="Proforma" subtitle="Créez et gérez vos devis proforma" accent="amber" />

      {/* Flash */}
      {flash && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl font-medium">
          {flash}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou référence…"
              value={search}
              onChange={e => applySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau proforma
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
        ) : devis.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <PenLine className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Aucun proforma</p>
            <p className="text-slate-400 text-xs">Créez votre premier proforma ci-dessus</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-y border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">Référence</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">Client</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 hidden md:table-cell">Total</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500 hidden lg:table-cell">Validité</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devis.map(d => {
                    const cfg = STATUT_CFG[d.statut] ?? STATUT_CFG.brouillon;
                    return (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                            {d.reference}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-800">{d.client_nom}</div>
                          {d.client_tel && <div className="text-xs text-slate-400 mt-0.5">{d.client_tel}</div>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 hidden md:table-cell">
                          {fmt(d.total)} <span className="text-xs font-normal text-slate-400">FCFA</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell">
                          {d.valide_jusqu ? fmtDate(d.valide_jusqu) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={d.statut}
                            onChange={e => changeStatut(d.id, e.target.value as Devis["statut"])}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${cfg.color}`}
                          >
                            {Object.entries(STATUT_CFG).map(([v, c]) => (
                              <option key={v} value={v}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPrintDoc(d)}
                              title="Imprimer proforma A4"
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDevis(d.id)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {currentPage} / {totalPages} · {total} proforma{total > 1 ? "s" : ""}</p>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => paginate(offset - LIMIT)} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={offset + LIMIT >= total} onClick={() => paginate(offset + LIMIT)} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════
          MODAL CRÉATION
      ═══════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white w-full sm:rounded-2xl shadow-2xl flex flex-col sm:max-w-3xl" style={{ maxHeight: "92vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Nouveau proforma</h3>
                <p className="text-xs text-slate-400 mt-0.5">Format A4 · Imprimable</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

                {/* ── Col gauche : Articles ── */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Articles</p>

                  {/* Recherche stock */}
                  <div className="relative" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit en stock…"
                      value={prodSearch}
                      onChange={e => { setProdSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    {showDropdown && prodSearch && filtered.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto">
                        {filtered.map(p => (
                          <button
                            key={p.produit_id}
                            type="button"
                            onClick={() => addStockProduct(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate">{p.nom}</p>
                              <p className="text-xs text-slate-400">{p.reference} · {fmt(p.prix_vente)} FCFA</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">Qté {p.quantite}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton produit libre */}
                  <button
                    type="button"
                    onClick={addFreeProduct}
                    className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl text-sm text-slate-500 hover:text-amber-700 transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                    Ajouter un produit libre (nom personnalisé)
                  </button>

                  {/* Liste des articles */}
                  {modal.items.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-6">Aucun article ajouté</p>
                  ) : (
                    <div className="space-y-2">
                      {modal.items.map(item => (
                        <div key={item.key} className="bg-slate-50 rounded-xl p-3 space-y-2">
                          {item.mode === "libre" ? (
                            <input
                              type="text"
                              placeholder="Nom du produit…"
                              value={item.nom}
                              onChange={e => updateItem(item.key, "nom", e.target.value)}
                              className="w-full text-sm font-semibold bg-white rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-slate-800 truncate">{item.nom}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-2 py-1">
                              <button onClick={() => updateItem(item.key, "qty", Math.max(1, item.qty - 1))} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700">−</button>
                              <span className="text-sm font-bold text-slate-800 w-6 text-center">{item.qty}</span>
                              <button onClick={() => updateItem(item.key, "qty", Math.min(item.stock_dispo, item.qty + 1))} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700">+</button>
                            </div>
                            <input
                              type="number"
                              min={0}
                              value={item.prix}
                              onChange={e => updateItem(item.key, "prix", Number(e.target.value))}
                              className="flex-1 text-sm bg-white rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:border-amber-400 transition-colors"
                              placeholder="Prix unitaire"
                            />
                            <span className="text-xs text-slate-400 shrink-0">FCFA</span>
                            <span className="text-sm font-bold text-slate-900 shrink-0 w-20 text-right">{fmt(item.total)}</span>
                            <button onClick={() => removeItem(item.key)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Col droite : Infos ── */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informations</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nom du client *</label>
                      <input
                        type="text"
                        value={modal.client_nom}
                        onChange={e => setModal(m => m ? { ...m, client_nom: e.target.value } : m)}
                        placeholder="Nom complet"
                        className="w-full text-sm bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={modal.client_tel}
                        onChange={e => setModal(m => m ? { ...m, client_tel: e.target.value } : m)}
                        placeholder="+228 XX XX XX XX"
                        className="w-full text-sm bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Remise (FCFA)</label>
                      <input
                        type="number"
                        min={0}
                        value={modal.remise}
                        onChange={e => setModal(m => m ? { ...m, remise: Number(e.target.value) } : m)}
                        className="w-full text-sm bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Valable jusqu'au</label>
                      <input
                        type="date"
                        value={modal.valide_jusqu}
                        min={TODAY}
                        onChange={e => setModal(m => m ? { ...m, valide_jusqu: e.target.value } : m)}
                        className="w-full text-sm bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Note</label>
                      <textarea
                        rows={3}
                        value={modal.note}
                        onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                        placeholder="Conditions particulières, remarques…"
                        className="w-full text-sm bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  {modal.items.length > 0 && (() => {
                    const { sous_total, total: tot } = calcTotals(modal.items, modal.remise);
                    return (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Sous-total</span>
                          <span>{fmt(sous_total)} FCFA</span>
                        </div>
                        {modal.remise > 0 && (
                          <div className="flex justify-between text-sm text-red-500">
                            <span>Remise</span>
                            <span>− {fmt(modal.remise)} FCFA</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                          <span>Total TTC</span>
                          <span>{fmt(tot)} FCFA</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Annuler
              </button>
              <button
                onClick={saveDevis}
                disabled={saving || !modal.client_nom.trim() || modal.items.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                {saving ? "Enregistrement…" : "Créer le proforma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Print overlay ══ */}
      {printDoc && (() => {
        const items = parseItems(printDoc.items);
        return (
          <BoutiqueDocPrint
            type="proforma"
            format="A4"
            reference={printDoc.reference}
            date={printDoc.created_at}
            client_nom={printDoc.client_nom}
            client_tel={printDoc.client_tel}
            items={items}
            sous_total={printDoc.sous_total}
            remise={printDoc.remise}
            total={printDoc.total}
            valide_jusqu={printDoc.valide_jusqu}
            note={printDoc.note}
            onClose={() => setPrintDoc(null)}
          />
        );
      })()}
    </div>
  );
}
