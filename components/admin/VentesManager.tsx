"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  TrendingUp, BookOpen, Truck, Plus, Search,
  Eye, Trash2, Printer, Loader2, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, RefreshCw, Pencil,
  CreditCard, Banknote, Smartphone, Building2, Package,
  ShoppingCart, Minus,
} from "lucide-react";
import type { Facture, Devis, Livraison, BoutiqueStockItem } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";

/* ─── Types ─── */
type Tab = "ventes" | "devis" | "livraisons";

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

interface VenteItem {
  produit_id:    number;
  nom:           string;
  reference:     string;
  prix_unitaire: number;
  stock_dispo:   number;
  qty:           number;
}

interface NewVenteModal {
  clientNom:      string;
  clientTel:      string;
  avecLivraison:  boolean;
  modePaiement:   string;
  statutPaiement: string;
  montantAcompte: string;
  note:           string;
  saving:         boolean;
  error:          string;
}

/* ─── Constants ─── */
const MODES_PAIEMENT = [
  { value: "especes",           label: "Espèces",          icon: Banknote },
  { value: "mix_by_yas",        label: "Mix by Yas",       icon: CreditCard },
  { value: "moov_money",        label: "Moov Money",       icon: Smartphone },
  { value: "virement_bancaire", label: "Virement bancaire",icon: Building2 },
];

const STATUTS_PAIEMENT = [
  { value: "paye_total", label: "Payé en totalité", color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "acompte",    label: "Acompte",          color: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "non_paye",   label: "Non payé",         color: "border-red-400 bg-red-50 text-red-700" },
];

const FACTURE_STATUTS: { value: Facture["statut"]; label: string; color: string }[] = [
  { value: "brouillon", label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  { value: "valide",    label: "Validé",    color: "bg-blue-100 text-blue-700" },
  { value: "paye",      label: "Payé",      color: "bg-emerald-100 text-emerald-700" },
  { value: "annule",    label: "Annulé",    color: "bg-red-100 text-red-700" },
];

const DEVIS_STATUTS: { value: Devis["statut"]; label: string; color: string }[] = [
  { value: "brouillon", label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  { value: "envoye",    label: "Envoyé",    color: "bg-blue-100 text-blue-700" },
  { value: "accepte",   label: "Accepté",   color: "bg-emerald-100 text-emerald-700" },
  { value: "refuse",    label: "Refusé",    color: "bg-red-100 text-red-700" },
  { value: "expire",    label: "Expiré",    color: "bg-orange-100 text-orange-700" },
];

const LIVRAISON_STATUTS: { value: Livraison["statut"]; label: string; color: string }[] = [
  { value: "en_attente", label: "En attente", color: "bg-slate-100 text-slate-600" },
  { value: "en_cours",   label: "En cours",   color: "bg-blue-100 text-blue-700" },
  { value: "livre",      label: "Livré",      color: "bg-emerald-100 text-emerald-700" },
  { value: "echoue",     label: "Échoué",     color: "bg-red-100 text-red-700" },
];

/* ─── Helpers ─── */
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

const emptyModal = (): NewVenteModal => ({
  clientNom:      "",
  clientTel:      "",
  avecLivraison:  false,
  modePaiement:   "especes",
  statutPaiement: "paye_total",
  montantAcompte: "",
  note:           "",
  saving:         false,
  error:          "",
});

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function VentesManager({
  initialFactures, initialDevis, initialLivraisons,
  initialStats, totalFactures, totalDevis, totalLivraisons,
}: Props) {

  /* ── State principal ── */
  const [tab,        setTab]        = useState<Tab>("ventes");
  const [stats,      setStats]      = useState<Stats>(initialStats);
  const [factures,   setFactures]   = useState<Facture[]>(initialFactures);
  const [devis,      setDevis]      = useState<Devis[]>(initialDevis);
  const [livraisons, setLivraisons] = useState<Livraison[]>(initialLivraisons);
  const [totals,     setTotals]     = useState({ factures: totalFactures, devis: totalDevis, livraisons: totalLivraisons });
  const [offset,     setOffset]     = useState(0);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [flash,      setFlash]      = useState("");

  /* ── Modal état ── */
  const [modal,      setModal]      = useState<NewVenteModal | null>(null);

  /* ── Panier (articles de la vente) ── */
  const [items,          setItems]          = useState<VenteItem[]>([]);
  const [boutiqueStock,  setBoutiqueStock]  = useState<BoutiqueStockItem[]>([]);
  const [loadingStock,   setLoadingStock]   = useState(false);
  const [prodSearch,     setProdSearch]     = useState("");
  const [showDropdown,   setShowDropdown]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ── Totaux calculés ── */
  const sousTotal   = items.reduce((s, i) => s + i.prix_unitaire * i.qty, 0);
  const totalVente  = sousTotal;
  const acompte     = modal ? Number(modal.montantAcompte) || 0 : 0;
  const resteAPayer = Math.max(0, totalVente - acompte);

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3500); }

  /* ── Fermer dropdown si clic extérieur ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Charger le stock boutique quand le modal s'ouvre ── */
  async function openModal() {
    setItems([]);
    setProdSearch("");
    setShowDropdown(false);
    setModal(emptyModal());
    setLoadingStock(true);
    try {
      const res  = await fetch("/api/admin/stock-boutique?limit=200");
      const data = await res.json();
      if (res.ok) setBoutiqueStock(data.items ?? []);
    } finally {
      setLoadingStock(false);
    }
  }

  function closeModal() {
    setModal(null);
    setItems([]);
    setBoutiqueStock([]);
    setProdSearch("");
  }

  /* ── Produits filtrés pour le dropdown ── */
  const filteredProducts = boutiqueStock.filter(p => {
    if (!prodSearch.trim()) return true;
    const q = prodSearch.toLowerCase();
    return p.nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
  });

  /* ── Ajouter un produit au panier ── */
  function addProduct(p: BoutiqueStockItem) {
    setItems(prev => {
      const existing = prev.find(i => i.produit_id === p.produit_id);
      if (existing) {
        // Increase qty if within stock
        if (existing.qty < p.quantite) {
          return prev.map(i => i.produit_id === p.produit_id ? { ...i, qty: i.qty + 1 } : i);
        }
        return prev; // already at max
      }
      if (p.quantite === 0) return prev; // no stock
      return [...prev, {
        produit_id:    p.produit_id,
        nom:           p.nom,
        reference:     p.reference,
        prix_unitaire: p.prix_unitaire,
        stock_dispo:   p.quantite,
        qty:           1,
      }];
    });
    setProdSearch("");
    setShowDropdown(false);
  }

  function removeItem(produit_id: number) {
    setItems(prev => prev.filter(i => i.produit_id !== produit_id));
  }

  function changeQty(produit_id: number, delta: number) {
    setItems(prev => prev.map(i => {
      if (i.produit_id !== produit_id) return i;
      const newQty = Math.max(1, Math.min(i.stock_dispo, i.qty + delta));
      return { ...i, qty: newQty };
    }));
  }

  function setQtyDirect(produit_id: number, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setItems(prev => prev.map(i => {
      if (i.produit_id !== produit_id) return i;
      return { ...i, qty: Math.max(1, Math.min(i.stock_dispo, n)) };
    }));
  }

  /* ── Fetch tableau ── */
  const fetchTab = useCallback(async (t: Tab, q = "", off = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)   params.set("q",      q);
    if (off) params.set("offset", String(off));
    params.set("limit", String(LIMIT));

    if (t === "ventes") {
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
    const url = type === "ventes"    ? `/api/admin/ventes/factures/${id}`
              : type === "devis"     ? `/api/admin/ventes/devis/${id}`
              : `/api/admin/ventes/livraisons/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      if (type === "ventes")     setFactures(p => p.filter(x => x.id !== id));
      if (type === "devis")      setDevis(p => p.filter(x => x.id !== id));
      if (type === "livraisons") setLivraisons(p => p.filter(x => x.id !== id));
      showFlash("Supprimé ✓");
    }
  }

  /* ── Créer la vente ── */
  async function submitVente() {
    if (!modal) return;
    if (!modal.clientNom.trim()) {
      setModal(m => m ? { ...m, error: "Le nom du client est requis." } : m);
      return;
    }
    if (items.length === 0) {
      setModal(m => m ? { ...m, error: "Ajoutez au moins un article." } : m);
      return;
    }
    if (modal.statutPaiement === "acompte" && (!modal.montantAcompte || Number(modal.montantAcompte) <= 0)) {
      setModal(m => m ? { ...m, error: "Saisissez le montant de l'acompte." } : m);
      return;
    }

    setModal(m => m ? { ...m, saving: true, error: "" } : m);

    const payload = {
      client_nom:      modal.clientNom,
      client_tel:      modal.clientTel || undefined,
      avec_livraison:  modal.avecLivraison,
      mode_paiement:   modal.modePaiement,
      statut_paiement: modal.statutPaiement,
      montant_acompte: modal.statutPaiement === "acompte" ? Number(modal.montantAcompte) : undefined,
      sous_total:      sousTotal,
      total:           totalVente,
      note:            modal.note || undefined,
      items: items.map(i => ({
        produit_id: i.produit_id,
        nom:        i.nom,
        reference:  i.reference,
        qty:        i.qty,
        prix:       i.prix_unitaire,
        total:      i.prix_unitaire * i.qty,
      })),
    };

    const res  = await fetch("/api/admin/ventes/factures", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      closeModal();
      showFlash("Vente enregistrée ✓");
      fetchTab("ventes", search, offset);
    } else {
      setModal(m => m ? { ...m, saving: false, error: data.error ?? "Erreur" } : m);
    }
  }

  function handlePrint(ref: string) { window.print(); void ref; }

  /* ── Pagination ── */
  const currentTotal = tab === "ventes" ? totals.factures : tab === "devis" ? totals.devis : totals.livraisons;
  const totalPages   = Math.ceil(currentTotal / LIMIT);
  const currentPage  = Math.floor(offset / LIMIT) + 1;
  const rows = tab === "ventes" ? factures : tab === "devis" ? devis : livraisons;

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
          <p className="text-slate-400 text-sm mt-1">Gérez ventes, devis et livraisons</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => fetchTab(tab, search, offset)}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 transition-all"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {tab === "ventes" && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouvelle vente
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 w-fit">
        {([
          { key: "ventes",     label: "Ventes",    icon: TrendingUp, count: stats.factures },
          { key: "devis",      label: "Devis",      icon: BookOpen,   count: stats.devis },
          { key: "livraisons", label: "Livraisons", icon: Truck,      count: stats.livraisons },
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
            <Package className="w-10 h-10 opacity-30" />
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
                    {tab === "ventes" && (
                      <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400 hidden lg:table-cell">Paiement</th>
                    )}
                    <th className="text-left px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Statut</th>
                    <th className="text-right px-4 py-3.5 font-bold text-[11px] uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => {
                    const isVente     = tab === "ventes";
                    const isDevis     = tab === "devis";
                    const isLivraison = tab === "livraisons";
                    const f = row as Facture;
                    const d = row as Devis;
                    const l = row as Livraison;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-semibold text-slate-800">{row.reference}</span>
                            {isVente && f.avec_livraison === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                                <Truck className="w-3 h-3" /> Livraison
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800">{row.client_nom}</p>
                          {(isVente || isDevis) && (f.client_tel || d.client_tel) && (
                            <p className="text-xs text-slate-400">{isVente ? f.client_tel : d.client_tel}</p>
                          )}
                          {isLivraison && l.client_tel && (
                            <p className="text-xs text-slate-400">{l.client_tel}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 text-sm hidden sm:table-cell">
                          {formatDate(row.created_at)}
                        </td>

                        {(isVente || isDevis) && (
                          <td className="px-4 py-3.5 text-right font-display font-700 text-brand-700 hidden md:table-cell">
                            {formatPrice(isVente ? f.total : d.total)}
                          </td>
                        )}
                        {isLivraison && (
                          <td className="px-4 py-3.5 text-slate-500 text-sm hidden md:table-cell">
                            <span className="line-clamp-1">{l.adresse ?? "—"}</span>
                          </td>
                        )}

                        {isVente && (
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <div className="flex flex-col gap-1">
                              {f.mode_paiement && (
                                <span className="text-xs text-slate-500">
                                  {MODES_PAIEMENT.find(m => m.value === f.mode_paiement)?.label ?? f.mode_paiement}
                                </span>
                              )}
                              {f.statut_paiement && (() => {
                                const sp = STATUTS_PAIEMENT.find(s => s.value === f.statut_paiement);
                                return sp ? (
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${sp.color}`}>
                                    {sp.label}
                                  </span>
                                ) : null;
                              })()}
                              {f.statut_paiement === "acompte" && f.montant_acompte != null && (
                                <span className="text-[10px] text-slate-400">
                                  Acompte : {formatPrice(f.montant_acompte)}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        <td className="px-4 py-3.5">
                          {isVente     && statutBadge(f.statut, FACTURE_STATUTS)}
                          {isDevis     && statutBadge(d.statut, DEVIS_STATUTS)}
                          {isLivraison && statutBadge(l.statut, LIVRAISON_STATUTS)}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <button title="Voir"      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Eye    className="w-4 h-4" /></button>
                            <button title="Modifier"  className="p-1.5 rounded-lg hover:bg-blue-50   text-slate-400 hover:text-blue-600  transition-colors"><Pencil className="w-4 h-4" /></button>
                            {!isLivraison && (
                              <button onClick={() => handlePrint(row.reference)} title="Imprimer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Printer className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDelete(tab, row.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                <p className="text-sm text-slate-500">Page {currentPage} sur {totalPages} · {currentTotal} résultats</p>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => paginate(offset - LIMIT)} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={offset + LIMIT >= currentTotal} onClick={() => paginate(offset + LIMIT)} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════
          MODAL NOUVELLE VENTE
      ════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

            {/* ── En-tête modal ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Nouvelle vente</h3>
                  <p className="text-xs text-slate-400">Référence générée automatiquement</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Corps modal scrollable ── */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Client */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nom du client *</label>
                  <input
                    type="text"
                    value={modal.clientNom}
                    onChange={e => setModal(m => m ? { ...m, clientNom: e.target.value } : m)}
                    placeholder="Ex : WADADA"
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Téléphone</label>
                  <input
                    type="text"
                    value={modal.clientTel}
                    onChange={e => setModal(m => m ? { ...m, clientTel: e.target.value } : m)}
                    placeholder="+228 90 00 00 00"
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* ── Articles ── */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Articles (stock boutique)</label>

                {/* Recherche produit */}
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={loadingStock ? "Chargement du stock…" : "Rechercher un produit…"}
                      value={prodSearch}
                      disabled={loadingStock}
                      onChange={e => { setProdSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all disabled:opacity-50"
                    />
                    {loadingStock && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                    )}
                  </div>

                  {/* Dropdown produits */}
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 max-h-52 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <button
                          key={p.produit_id}
                          type="button"
                          disabled={p.quantite === 0}
                          onClick={() => addProduct(p)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors ${p.quantite === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">{p.nom}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.reference}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-brand-700">{formatPrice(p.prix_unitaire)}</p>
                            <p className={`text-[10px] font-semibold ${p.quantite === 0 ? "text-red-500" : p.quantite <= 3 ? "text-amber-500" : "text-emerald-600"}`}>
                              {p.quantite === 0 ? "Épuisé" : `${p.quantite} en stock`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && prodSearch && filteredProducts.length === 0 && !loadingStock && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 px-4 py-3 text-sm text-slate-400 text-center">
                      Aucun produit en stock correspondant
                    </div>
                  )}
                </div>

                {/* Liste des articles ajoutés */}
                {items.length > 0 && (
                  <div className="mt-3 border border-slate-200 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Produit</span>
                      <span className="text-center w-24">Quantité</span>
                      <span className="text-right w-24">P.U.</span>
                      <span className="text-right w-24">Total</span>
                    </div>
                    {items.map(item => (
                      <div key={item.produit_id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-2.5 border-t border-slate-100 hover:bg-slate-50/60">
                        {/* Nom */}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{item.nom}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.reference}</p>
                        </div>
                        {/* Qty stepper */}
                        <div className="flex items-center gap-1 w-24 justify-center">
                          <button
                            type="button"
                            onClick={() => changeQty(item.produit_id, -1)}
                            disabled={item.qty <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={item.stock_dispo}
                            value={item.qty}
                            onChange={e => setQtyDirect(item.produit_id, e.target.value)}
                            className="w-10 text-center text-sm font-bold border border-slate-200 rounded-lg py-0.5 outline-none focus:border-brand-400"
                          />
                          <button
                            type="button"
                            onClick={() => changeQty(item.produit_id, +1)}
                            disabled={item.qty >= item.stock_dispo}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {/* P.U. */}
                        <span className="text-sm font-semibold text-slate-700 text-right w-24">
                          {formatPrice(item.prix_unitaire)}
                        </span>
                        {/* Total + supprimer */}
                        <div className="flex items-center gap-2 w-24 justify-end">
                          <span className="text-sm font-bold text-brand-700">
                            {formatPrice(item.prix_unitaire * item.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.produit_id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Livraison ── */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Livraison</label>
                <div className="flex gap-3">
                  {[
                    { val: false, label: "Non", desc: "Retrait en boutique", icon: Package },
                    { val: true,  label: "Oui", desc: "Livraison à domicile", icon: Truck },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const active = modal.avecLivraison === opt.val;
                    return (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setModal(m => m ? { ...m, avecLivraison: opt.val } : m)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          active
                            ? opt.val ? "border-indigo-400 bg-indigo-50" : "border-brand-400 bg-brand-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? opt.val ? "bg-indigo-100 text-indigo-600" : "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${active ? opt.val ? "text-indigo-700" : "text-brand-700" : "text-slate-600"}`}>{opt.label}</p>
                          <p className="text-[11px] text-slate-400">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Mode de paiement ── */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES_PAIEMENT.map(mode => {
                    const Icon   = mode.icon;
                    const active = modal.modePaiement === mode.value;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setModal(m => m ? { ...m, modePaiement: mode.value } : m)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                          active ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className={`text-sm font-semibold ${active ? "text-emerald-700" : "text-slate-600"}`}>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Statut du paiement ── */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Statut du paiement</label>
                <div className="flex gap-2">
                  {STATUTS_PAIEMENT.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setModal(m => m ? { ...m, statutPaiement: s.value } : m)}
                      className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        modal.statutPaiement === s.value ? s.color : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Champ acompte */}
                {modal.statutPaiement === "acompte" && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1.5">Montant de l'acompte (FCFA) *</label>
                      <input
                        type="number"
                        min={0}
                        max={totalVente}
                        value={modal.montantAcompte}
                        onChange={e => setModal(m => m ? { ...m, montantAcompte: e.target.value } : m)}
                        placeholder="0"
                        className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-amber-300 focus:border-amber-500 outline-none transition-all font-display font-700 text-lg"
                      />
                    </div>
                    {totalVente > 0 && acompte > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-700 font-semibold">Reste à payer :</span>
                        <span className="font-display font-800 text-amber-800 text-lg">{formatPrice(resteAPayer)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Note <span className="font-normal text-slate-400">(optionnel)</span></label>
                <textarea
                  rows={2}
                  value={modal.note}
                  onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                  placeholder="Remarques…"
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Erreur */}
              {modal.error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {modal.error}
                </div>
              )}
            </div>

            {/* ── Footer : totaux + boutons ── */}
            <div className="border-t border-slate-100 px-6 py-4 shrink-0 space-y-3">
              {/* Totaux */}
              {items.length > 0 && (
                <div className="bg-slate-50 rounded-2xl px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Sous-total ({items.reduce((s, i) => s + i.qty, 0)} article{items.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""})</span>
                    <span className="font-semibold text-slate-700">{formatPrice(sousTotal)}</span>
                  </div>
                  <div className="flex justify-between font-display font-800 text-slate-900">
                    <span>Total</span>
                    <span className="text-xl">{formatPrice(totalVente)}</span>
                  </div>
                  {modal.statutPaiement === "acompte" && acompte > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Acompte versé</span>
                        <span className="font-bold">{formatPrice(acompte)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-red-600 border-t border-slate-200 pt-1.5">
                        <span>Reste à payer</span>
                        <span>{formatPrice(resteAPayer)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={submitVente}
                  disabled={modal.saving || !modal.clientNom.trim() || items.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 disabled:opacity-50 transition-all"
                >
                  {modal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer la vente
                </button>
                <button
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
