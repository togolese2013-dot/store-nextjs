"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  TrendingUp, Truck, Plus, Search,
  Eye, Trash2, Printer, Loader2, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Pencil,
  CreditCard, Banknote, Smartphone, Building2, Package,
  ShoppingCart, Minus,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import TabBar     from "@/components/admin/TabBar";
import type { Facture, Livraison, BoutiqueStockItem } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";

/* ─── Types ─── */
type Tab = "ventes" | "livraisons";

interface Stats { factures: number; livraisons: number; ca_total: number; factures_payees: number }

interface Props {
  initialFactures:   Facture[];
  initialLivraisons: Livraison[];
  initialStats:      Stats;
  totalFactures:     number;
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
  clientNom:        string;
  clientTel:        string;
  avecLivraison:    boolean;
  adresseLivraison: string;
  contactLivraison: string;
  lienLocalisation: string;
  modePaiement:     string;
  statutPaiement:   string;
  montantAcompte:   string;
  remiseGlobale:    string;
  note:             string;
  saving:           boolean;
  error:            string;
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s?.color ?? "bg-slate-100 text-slate-600"}`}>
      {s?.label ?? statut}
    </span>
  );
}

function formatDate(d: string) {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

function getStatutDisplay(f: Facture): { label: string; color: string } {
  if (f.statut === "annule")   return { label: "Annulé",   color: "bg-red-100 text-red-700" };
  if (f.statut === "brouillon") return { label: "Brouillon", color: "bg-slate-100 text-slate-600" };
  if (f.statut_paiement === "paye_total") return { label: "Payé",   color: "bg-emerald-100 text-emerald-700" };
  return { label: "Validé", color: "bg-green-50 text-green-700 border border-green-200" };
}

const LIMIT = 50;

const emptyModal = (): NewVenteModal => ({
  clientNom:        "",
  clientTel:        "",
  avecLivraison:    false,
  adresseLivraison: "",
  contactLivraison: "",
  lienLocalisation: "",
  modePaiement:     "especes",
  statutPaiement:   "paye_total",
  montantAcompte:   "",
  remiseGlobale:    "",
  note:             "",
  saving:           false,
  error:            "",
});

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function VentesManager({
  initialFactures, initialLivraisons,
  initialStats, totalFactures, totalLivraisons,
}: Props) {

  /* ── State principal ── */
  const [tab,        setTab]        = useState<Tab>("ventes");
  const [stats,      setStats]      = useState<Stats>(initialStats);
  const [factures,   setFactures]   = useState<Facture[]>(initialFactures);
  const [livraisons, setLivraisons] = useState<Livraison[]>(initialLivraisons);
  const [totals,     setTotals]     = useState({ factures: totalFactures, livraisons: totalLivraisons });
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
  const remise      = modal ? (Number(modal.remiseGlobale) || 0) : 0;
  const totalVente  = Math.max(0, sousTotal - remise);
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
    const url = type === "ventes"
      ? `/api/admin/ventes/factures/${id}`
      : `/api/admin/ventes/livraisons/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      if (type === "ventes")     setFactures(p => p.filter(x => x.id !== id));
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
      client_nom:        modal.clientNom,
      client_tel:        modal.clientTel || undefined,
      avec_livraison:    modal.avecLivraison,
      adresse_livraison: modal.avecLivraison ? modal.adresseLivraison || undefined : undefined,
      contact_livraison: modal.avecLivraison ? modal.contactLivraison || undefined : undefined,
      lien_localisation: modal.avecLivraison ? modal.lienLocalisation || undefined : undefined,
      mode_paiement:     modal.modePaiement,
      statut_paiement:   modal.statutPaiement,
      montant_acompte:   modal.statutPaiement === "acompte" ? Number(modal.montantAcompte) : undefined,
      sous_total:        sousTotal,
      remise:            remise > 0 ? remise : undefined,
      total:             totalVente,
      note:              modal.note || undefined,
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
  const currentTotal = tab === "ventes" ? totals.factures : totals.livraisons;
  const totalPages   = Math.ceil(currentTotal / LIMIT);
  const currentPage  = Math.floor(offset / LIMIT) + 1;
  const rows = tab === "ventes" ? factures : livraisons;

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

      <PageHeader
        title="Ventes"
        subtitle="Gérez vos ventes et livraisons"
        accent="amber"
        searchValue={search}
        onSearchChange={v => applySearch(v)}
        onSearch={e => { e.preventDefault(); applySearch(search); }}
        searchPlaceholder="Rechercher…"
        onRefresh={() => fetchTab(tab, search, offset)}
        refreshLoading={loading}
        ctaLabel={tab === "ventes" ? "Nouvelle vente" : undefined}
        onCtaClick={tab === "ventes" ? openModal : undefined}
      />

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">CA Total</p>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat("fr-FR").format(stats.ca_total)}{" "}
            <span className="text-sm font-semibold text-emerald-500">FCFA</span>
          </p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Hors annulations</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes</p>
            <ShoppingCart className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.factures}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Total factures</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payées</p>
            <Check className="w-8 h-8 text-emerald-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.factures_payees}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Statut payé</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Livraisons</p>
            <Truck className="w-8 h-8 text-amber-500 opacity-20" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.livraisons}</p>
          <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">Total livraisons</span>
        </div>
      </div>

      <TabBar
        tabs={[
          { key: "ventes",     label: "Ventes",     icon: TrendingUp, count: stats.factures },
          { key: "livraisons", label: "Livraisons", icon: Truck,      count: stats.livraisons },
        ]}
        active={tab}
        onChange={k => switchTab(k as Tab)}
        accent="amber"
      />

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
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
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Référence</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                    {tab !== "livraisons" && (
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Montant</th>
                    )}
                    {tab === "livraisons" && (
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Adresse</th>
                    )}
                    <th className="text-center px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Statut</th>
                    {tab === "ventes" && (
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Vendeur</th>
                    )}
                    <th className="px-5 py-3.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => {
                    const isVente     = tab === "ventes";
                    const isLivraison = tab === "livraisons";
                    const f = row as Facture;
                    const l = row as Livraison;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                        {/* Date + heure */}
                        <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">
                          {formatDate(row.created_at)}
                        </td>

                        {/* Référence */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">{row.reference}</span>
                            {isVente && f.avec_livraison === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                                <Truck className="w-3 h-3" /> Livraison
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{row.client_nom}</div>
                        </td>

                        {/* Montant */}
                        {isVente && (
                          <td className="px-5 py-4 text-right font-semibold text-slate-900 hidden md:table-cell">
                            {formatPrice(f.total)}
                          </td>
                        )}
                        {isLivraison && (
                          <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                            <span className="line-clamp-1">{l.adresse ?? "—"}</span>
                          </td>
                        )}

                        {/* Statut */}
                        <td className="px-5 py-4 text-center">
                          {isVente && (() => {
                            const s = getStatutDisplay(f);
                            return (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                                {s.label}
                              </span>
                            );
                          })()}
                          {isLivraison && statutBadge(l.statut, LIVRAISON_STATUTS)}
                        </td>

                        {/* Vendeur */}
                        {isVente && (
                          <td className="px-5 py-4 text-slate-600 text-xs hidden lg:table-cell">
                            {f.vendeur ?? "—"}
                          </td>
                        )}
                        {isLivraison && <td className="hidden lg:table-cell" />}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button title="Voir"      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Eye    className="w-4 h-4" /></button>
                            <button title="Modifier"  className="p-1.5 rounded-lg hover:bg-amber-50  text-slate-500 hover:text-amber-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                            {!isLivraison && (
                              <button onClick={() => handlePrint(row.reference)} title="Imprimer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><Printer className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDelete(tab, row.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col" style={{ maxHeight: "92vh" }}>

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <ShoppingCart className="w-4.5 h-4.5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-none">Nouvelle vente</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Référence générée automatiquement</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Corps 2 colonnes ── */}
            <div className="flex-1 grid grid-cols-[3fr_2fr] min-h-0 overflow-hidden">

              {/* ── Colonne gauche : Articles ── */}
              <div className="overflow-y-auto px-6 py-5 space-y-4 border-r border-slate-100">

                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Articles</p>

                {/* Recherche produit */}
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={loadingStock ? "Chargement du stock…" : "Ajouter un produit…"}
                    value={prodSearch}
                    disabled={loadingStock}
                    onChange={e => { setProdSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all disabled:opacity-50"
                  />
                  {loadingStock && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}

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
                            <p className="text-sm font-bold text-amber-700">{formatPrice(p.prix_unitaire)}</p>
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

                {/* Panier vide */}
                {items.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-slate-300 gap-2">
                    <ShoppingCart className="w-10 h-10" strokeWidth={1} />
                    <p className="text-sm font-semibold">Aucun article ajouté</p>
                  </div>
                )}

                {/* Liste articles */}
                {items.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1fr)_108px_128px_128px] gap-2 px-4 py-2 pr-8 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Produit</span>
                      <span className="text-center">Qté</span>
                      <span className="text-center">Prix unit.</span>
                      <span className="text-center">Total</span>
                    </div>
                    {items.map(item => (
                      <div key={item.produit_id} className="relative grid grid-cols-[minmax(0,1fr)_108px_128px_128px] gap-2 items-center px-4 py-3 pr-8 border-t border-slate-100 hover:bg-slate-50/60">
                        {/* Remove button — top-right of the row */}
                        <button type="button" onClick={() => removeItem(item.produit_id)}
                          className="absolute top-1.5 right-2 p-0.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{item.nom}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.reference}</p>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                          <button type="button" onClick={() => changeQty(item.produit_id, -1)} disabled={item.qty <= 1}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input type="number" min={1} max={item.stock_dispo} value={item.qty}
                            onChange={e => setQtyDirect(item.produit_id, e.target.value)}
                            className="w-10 text-center text-sm font-bold border border-slate-200 rounded-lg py-0.5 outline-none focus:border-amber-400" />
                          <button type="button" onClick={() => changeQty(item.produit_id, +1)} disabled={item.qty >= item.stock_dispo}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Prix unitaire — bordered box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-sm text-slate-600 text-center tabular-nums">
                          {formatPrice(item.prix_unitaire)}
                        </div>
                        {/* Total — bordered box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-bold text-amber-700 text-center tabular-nums">
                          {formatPrice(item.prix_unitaire * item.qty)}
                        </div>
                      </div>
                    ))}

                    {/* Totaux panier */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{items.reduce((s, i) => s + i.qty, 0)} article{items.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""} — Sous-total</span>
                        <span className="font-semibold">{formatPrice(sousTotal)}</span>
                      </div>
                      {/* Remise globale */}
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <label className="font-semibold">Remise (FCFA)</label>
                        <input
                          type="number" min={0} max={sousTotal}
                          value={modal.remiseGlobale}
                          onChange={e => setModal(m => m ? { ...m, remiseGlobale: e.target.value } : m)}
                          placeholder="0"
                          className="w-28 text-right text-sm font-semibold border border-slate-200 rounded-lg px-2 py-0.5 bg-white outline-none focus:border-amber-400"
                        />
                      </div>
                      {remise > 0 && (
                        <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                          <span>Économie</span><span>− {formatPrice(remise)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-display font-800 text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                        <span>Total</span>
                        <span className="text-base">{formatPrice(totalVente)}</span>
                      </div>
                      {modal.statutPaiement === "acompte" && acompte > 0 && (
                        <>
                          <div className="flex justify-between text-xs text-amber-600 font-semibold">
                            <span>Acompte</span><span>{formatPrice(acompte)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-red-600 border-t border-slate-200 pt-1">
                            <span>Reste à payer</span><span>{formatPrice(resteAPayer)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Colonne droite : Client + Paiement ── */}
              <div className="overflow-y-auto px-6 py-5 space-y-5 flex flex-col">

                {/* Client */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Client</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nom *</label>
                      <input type="text" value={modal.clientNom}
                        onChange={e => setModal(m => m ? { ...m, clientNom: e.target.value } : m)}
                        placeholder="Ex : WADADA" autoFocus
                        className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Téléphone</label>
                      <input type="text" value={modal.clientTel}
                        onChange={e => setModal(m => m ? { ...m, clientTel: e.target.value } : m)}
                        placeholder="+228 90 00 00 00"
                        className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Livraison */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Livraison</p>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modal.avecLivraison}
                      onChange={e => setModal(m => m ? { ...m, avecLivraison: e.target.checked } : m)}
                      className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
                    />
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-500" /> Livraison à domicile
                    </span>
                  </label>

                  {modal.avecLivraison && (
                    <div className="mt-3 space-y-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Adresse de livraison</label>
                        <input type="text" value={modal.adresseLivraison}
                          onChange={e => setModal(m => m ? { ...m, adresseLivraison: e.target.value } : m)}
                          placeholder="Ex : Lomé, Tokoin, rue 123…"
                          className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-indigo-200 focus:border-indigo-400 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Contact à livrer</label>
                        <input type="text" value={modal.contactLivraison}
                          onChange={e => setModal(m => m ? { ...m, contactLivraison: e.target.value } : m)}
                          placeholder="+228 90 00 00 00"
                          className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-indigo-200 focus:border-indigo-400 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Lien de localisation</label>
                        <input type="text" value={modal.lienLocalisation}
                          onChange={e => setModal(m => m ? { ...m, lienLocalisation: e.target.value } : m)}
                          placeholder="https://maps.app.goo.gl/..."
                          className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-indigo-200 focus:border-indigo-400 outline-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mode de paiement</label>
                  <select
                    value={modal.modePaiement}
                    onChange={e => setModal(m => m ? { ...m, modePaiement: e.target.value } : m)}
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all font-semibold text-slate-700"
                  >
                    {MODES_PAIEMENT.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>

                {/* Statut paiement */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Statut du paiement</label>
                  <select
                    value={modal.statutPaiement}
                    onChange={e => setModal(m => m ? { ...m, statutPaiement: e.target.value } : m)}
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all font-semibold text-slate-700"
                  >
                    {STATUTS_PAIEMENT.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>

                  {modal.statutPaiement === "acompte" && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                      <label className="block text-xs font-bold text-amber-700">Montant acompte (FCFA) *</label>
                      <input type="number" min={0} max={totalVente} value={modal.montantAcompte}
                        onChange={e => setModal(m => m ? { ...m, montantAcompte: e.target.value } : m)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm bg-white rounded-xl border-2 border-amber-300 focus:border-amber-500 outline-none font-bold" />
                      {totalVente > 0 && acompte > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-amber-700">
                          <span>Reste :</span>
                          <span className="font-bold">{formatPrice(resteAPayer)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Note <span className="font-normal text-slate-400">(optionnel)</span></label>
                  <textarea rows={2} value={modal.note}
                    onChange={e => setModal(m => m ? { ...m, note: e.target.value } : m)}
                    placeholder="Remarques…"
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 transition-all resize-none" />
                </div>

                {/* Erreur */}
                {modal.error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {modal.error}
                  </div>
                )}

                {/* Boutons */}
                <div className="mt-auto pt-2 flex gap-2">
                  <button onClick={submitVente}
                    disabled={modal.saving || !modal.clientNom.trim() || items.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all">
                    {modal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Enregistrer
                  </button>
                  <button onClick={closeModal}
                    className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
