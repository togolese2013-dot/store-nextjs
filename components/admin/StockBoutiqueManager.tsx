"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  Filter, Package, TrendingDown, AlertTriangle, XCircle,
  ArrowDownLeft, ArrowUpRight, X, Check, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { BoutiqueStockItem, BoutiqueStats, BoutiqueMouvement } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";
import TabBar     from "@/components/admin/TabBar";

/* ─── Props ─── */
interface Props {
  initialStats:     BoutiqueStats;
  initialItems:     BoutiqueStockItem[];
  initialTotal:     number;
  initialMovements: BoutiqueMouvement[];
}

/* ─── Constants ─── */
const MOTIFS = [
  "Défaut produit",
  "Demande client",
  "Produit endommagé",
  "Périmé / expiré",
  "Vol / perte",
  "Retour après commande",
  "Autre",
];

const LIMIT = 50;

type MainTab    = "stock" | "entrees";
type FilterTab  = "all" | "faible" | "epuise";
type ModalMode  = "retrait" | "entree" | null;

interface EntreeItem {
  id:           number;
  produit_id:   number;
  nom_produit:  string;
  reference:    string;
  quantite:     number;
  motif:        string | null;
  ref_commande: string | null;
  created_at:   string;
}

/* ─── Component ─── */
export default function StockBoutiqueManager({
  initialStats,
  initialItems,
  initialTotal,
  initialMovements,
}: Props) {
  /* ── State principal ── */
  const [stats,     setStats]     = useState<BoutiqueStats>(initialStats);
  const [items,     setItems]     = useState<BoutiqueStockItem[]>(initialItems);
  const [total,     setTotal]     = useState(initialTotal);
  const [movements, setMovements] = useState<BoutiqueMouvement[]>(initialMovements);

  /* ── Onglet principal ── */
  const [mainTab,    setMainTab]    = useState<MainTab>("stock");

  /* ── Filtres stock ── */
  const [search,        setSearch]        = useState("");
  const [filterTab,     setFilterTab]     = useState<FilterTab>("all");
  const [pendingFilter, setPendingFilter] = useState<FilterTab>("all");
  const [offset,        setOffset]        = useState(0);
  const [loading,       setLoading]       = useState(false);

  /* ── Entrées boutique ── */
  const [entrees,        setEntrees]        = useState<EntreeItem[]>([]);
  const [entreesTotal,   setEntreesTotal]   = useState(0);
  const [entreesOffset,  setEntreesOffset]  = useState(0);
  const [entreesSearch,  setEntreesSearch]  = useState("");
  const [entreesLoading, setEntreesLoading] = useState(false);

  /* ── Modal mouvement ── */
  const [modalMode,       setModalMode]       = useState<ModalMode>(null);
  const [modalProduct,    setModalProduct]    = useState<BoutiqueStockItem | null>(null);
  const [modalQty,        setModalQty]        = useState("1");
  const [modalMotif,      setModalMotif]      = useState(MOTIFS[0]);
  const [modalRef,        setModalRef]        = useState("");
  const [modalSaving,     setModalSaving]     = useState(false);
  const [modalError,      setModalError]      = useState("");

  /* ── Flash ── */
  const [flash, setFlash] = useState("");
  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3500); }

  /* ── Fetch data ── */
  const fetchData = useCallback(async (opts: {
    q?: string; filter?: FilterTab; off?: number;
  } = {}) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (opts.q)      params.set("q",      opts.q);
    if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
    if (opts.off)    params.set("offset", String(opts.off));
    params.set("limit", String(LIMIT));

    const res  = await fetch(`/api/admin/stock-boutique?${params}`);
    const data = await res.json();
    if (res.ok) {
      setStats(data.stats);
      setItems(data.items);
      setTotal(data.total);
      setMovements(data.movements);
    }
    setLoading(false);
  }, []);

  function applyFilter(tab: FilterTab) {
    setFilterTab(tab);
    setOffset(0);
    fetchData({ q: search, filter: tab, off: 0 });
  }

  function applySearch(q: string) {
    setSearch(q);
    setOffset(0);
    fetchData({ q, filter: filterTab, off: 0 });
  }

  function paginate(newOffset: number) {
    setOffset(newOffset);
    fetchData({ q: search, filter: filterTab, off: newOffset });
  }

  /* ── Fetch entrées boutique ── */
  const fetchEntrees = useCallback(async (q = "", off = 0) => {
    setEntreesLoading(true);
    const params = new URLSearchParams();
    if (q)   params.set("q",      q);
    if (off) params.set("offset", String(off));
    params.set("limit", "50");
    const res  = await fetch(`/api/admin/stock-boutique/entrees?${params}`);
    const data = await res.json();
    if (res.ok) { setEntrees(data.items); setEntreesTotal(data.total); }
    setEntreesLoading(false);
  }, []);

  function switchMainTab(tab: MainTab) {
    setMainTab(tab);
    if (tab === "entrees" && entrees.length === 0) fetchEntrees();
  }

  /* ── Modal open ── */
  function openModal(mode: ModalMode, product?: BoutiqueStockItem) {
    setModalMode(mode);
    setModalProduct(product ?? null);
    setModalQty("1");
    setModalMotif(MOTIFS[0]);
    setModalRef("");
    setModalError("");
  }

  function closeModal() {
    setModalMode(null);
    setModalProduct(null);
    setModalError("");
  }

  /* ── Submit mouvement ── */
  async function submitMouvement() {
    if (!modalProduct) { setModalError("Sélectionnez un produit."); return; }
    const qty = Number(modalQty);
    if (!qty || qty <= 0) { setModalError("La quantité doit être > 0."); return; }

    setModalSaving(true);
    setModalError("");

    const res = await fetch("/api/admin/stock-boutique/mouvement", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produit_id:   modalProduct.produit_id,
        type:         modalMode === "retrait" ? "retrait" : "entree",
        quantite:     qty,
        motif:        modalMotif,
        ref_commande: modalRef || undefined,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      closeModal();
      showFlash(modalMode === "retrait"
        ? `Retrait de ${qty} unité(s) enregistré ✓`
        : `Entrée de ${qty} unité(s) enregistrée ✓`
      );
      fetchData({ q: search, filter: filterTab, off: offset });
    } else {
      setModalError(data.error ?? "Erreur lors de l'enregistrement.");
    }
    setModalSaving(false);
  }

  /* ── Helpers UI ── */
  function stockColor(item: BoutiqueStockItem) {
    if (item.quantite === 0)                        return "text-red-600 font-bold";
    if (item.quantite <= item.seuil_alerte)         return "text-amber-500 font-semibold";
    return "text-emerald-600 font-semibold";
  }

  function stockBadge(item: BoutiqueStockItem) {
    if (item.quantite === 0)
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Épuisé</span>;
    if (item.quantite <= item.seuil_alerte)
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Faible</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">OK</span>;
  }

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  /* ──────────────── RENDER ──────────────── */
  return (
    <div className="space-y-6">

      {/* ── Flash ── */}
      {flash && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          {flash}
        </div>
      )}

      <PageHeader
        title="Stock Boutique"
        subtitle="Suivi des quantités disponibles à la vente"
        accent="amber"
        searchValue={search}
        onSearchChange={v => applySearch(v)}
        onSearch={e => { e.preventDefault(); applySearch(search); }}
        searchPlaceholder="Rechercher un produit…"
        onRefresh={() => fetchData({ q: search, filter: filterTab, off: offset })}
        refreshLoading={loading}
        ctaLabel="Retrait"
        ctaIcon={ArrowDownLeft}
        onCtaClick={() => openModal("retrait")}
      />

      {/* ══════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total produits */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total produits</p>
          <p className="text-3xl font-display font-800 text-slate-900">{stats.total_produits}</p>
        </div>

        {/* Valeur boutique */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Valeur boutique</p>
          <p className="text-3xl font-display font-800 text-slate-900">
            {formatPrice(stats.valeur_boutique)}
          </p>
        </div>

        {/* Stock faible */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Stock faible</p>
            {stats.stock_faible > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Alerte</span>
            )}
          </div>
          <p className={`text-3xl font-display font-800 ${stats.stock_faible > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {stats.stock_faible}
          </p>
        </div>

        {/* Épuisés */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Épuisés</p>
            {stats.epuises > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Critique</span>
            )}
          </div>
          <p className={`text-3xl font-display font-800 ${stats.epuises > 0 ? "text-red-600" : "text-slate-900"}`}>
            {stats.epuises}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ONGLETS + FILTRE — une seule ligne
      ══════════════════════════════════════ */}
      <div className="flex items-center justify-between border-b border-slate-100">

        {/* Onglets principaux */}
        <div className="flex">
          {([
            { key: "stock",   label: "Stock boutique" },
            { key: "entrees", label: "Entrée boutique" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => switchMainTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                mainTab === tab.key
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtre stock — select + OK */}
        {mainTab === "stock" && (
          <div className="flex items-center gap-2 pb-1">
            <div className="relative">
              <select
                value={pendingFilter}
                onChange={e => setPendingFilter(e.target.value as FilterTab)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm rounded-xl border border-amber-400 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer"
              >
                <option value="all">Tous ({total})</option>
                <option value="faible">Stock faible ({stats.stock_faible})</option>
                <option value="epuise">Épuisés ({stats.epuises})</option>
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button
              onClick={() => applyFilter(pendingFilter)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              OK
            </button>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════
          TABLE ENTRÉES BOUTIQUE
      ══════════════════════════════════════ */}
      {mainTab === "entrees" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <input
              type="text"
              value={entreesSearch}
              onChange={e => { setEntreesSearch(e.target.value); fetchEntrees(e.target.value, 0); setEntreesOffset(0); }}
              placeholder="Rechercher un produit…"
              className="px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-amber-400 outline-none w-64"
            />
            <button onClick={() => fetchEntrees(entreesSearch, entreesOffset)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <Loader2 className={`w-4 h-4 ${entreesLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {entreesLoading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold">Chargement…</p>
            </div>
          ) : entrees.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <ArrowUpRight className="w-10 h-10 opacity-20" />
              <p className="font-semibold text-sm">Aucune entrée boutique</p>
              <p className="text-xs">Les sorties du stock magasin vers la boutique apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Produit</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Référence</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Qté entrée</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Motif</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entrees.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{e.nom_produit}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{e.reference}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-lg font-display font-800 text-emerald-600">+{e.quantite}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs hidden md:table-cell">{e.motif ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">
                        {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entreesTotal > 50 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">{entreesTotal} entrées</p>
                  <div className="flex gap-2">
                    <button disabled={entreesOffset === 0} onClick={() => { const o = entreesOffset - 50; setEntreesOffset(o); fetchEntrees(entreesSearch, o); }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={entreesOffset + 50 >= entreesTotal} onClick={() => { const o = entreesOffset + 50; setEntreesOffset(o); fetchEntrees(entreesSearch, o); }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TABLE PRODUITS (stock)
      ══════════════════════════════════════ */}
      {mainTab === "stock" && <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-semibold">Chargement…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Package className="w-10 h-10 opacity-30" />
            <p className="font-semibold">Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Produit</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Catégorie</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">Prix unit.</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600">Stock (u.)</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden lg:table-cell">Statut</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">Valeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(item => {
                    const imgSrc = item.image_url
                      ? item.image_url.startsWith("http") ? item.image_url : `/uploads/${item.image_url}`
                      : null;
                    return (
                      <tr key={item.produit_id} className="hover:bg-slate-50 transition-colors group">
                        {/* Produit */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                              {imgSrc ? (
                                <Image src={imgSrc} alt={item.nom} fill className="object-contain p-1" sizes="40px" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                  <Package className="w-5 h-5" strokeWidth={1} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 line-clamp-1">{item.nom}</p>
                              <p className="text-xs text-slate-400 font-mono">{item.reference}</p>
                            </div>
                          </div>
                        </td>

                        {/* Catégorie */}
                        <td className="px-5 py-4 text-slate-500 text-sm hidden md:table-cell">
                          {item.categorie_nom || <span className="text-slate-300">—</span>}
                        </td>

                        {/* Prix */}
                        <td className="px-5 py-4 text-right font-display font-700 text-slate-700 hidden sm:table-cell">
                          {formatPrice(item.prix_unitaire)}
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4 text-right">
                          <span className={`text-lg font-display font-800 ${stockColor(item)}`}>
                            {item.quantite}
                          </span>
                        </td>

                        {/* Statut badge */}
                        <td className="px-5 py-4 text-center hidden lg:table-cell">
                          {stockBadge(item)}
                        </td>

                        {/* Valeur */}
                        <td className="px-5 py-4 text-right text-slate-600 font-semibold hidden md:table-cell">
                          {formatPrice(item.valeur)}
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
                  Page {currentPage} sur {totalPages} · {total} produits
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
                    disabled={offset + LIMIT >= total}
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
      </div>}

      {/* ══════════════════════════════════════
          JOURNAL DES MOUVEMENTS RÉCENTS
      ══════════════════════════════════════ */}
      {mainTab === "stock" && movements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Mouvements récents</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {movements.map(mv => (
              <div key={mv.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  mv.type === "entree"
                    ? "bg-emerald-100 text-emerald-600"
                    : mv.type === "retrait"
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {mv.type === "entree"
                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                    : mv.type === "retrait"
                    ? <ArrowDownLeft className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{mv.nom_produit}</p>
                  <p className="text-xs text-slate-400">
                    {mv.type === "entree" ? "Entrée" : mv.type === "retrait" ? "Retrait client" : mv.type.charAt(0).toUpperCase() + mv.type.slice(1)}
                    {mv.motif ? ` · ${mv.motif}` : ""}
                    {mv.ref_commande ? ` · Réf. ${mv.ref_commande}` : ""}
                    {mv.admin_nom ? ` · ${mv.admin_nom}` : ""}
                  </p>
                </div>
                <div className={`text-sm font-bold shrink-0 ${mv.type === "entree" ? "text-emerald-600" : "text-red-600"}`}>
                  {mv.type === "entree" ? "+" : "−"}{mv.quantite} u.
                </div>
                <div className="text-xs text-slate-400 shrink-0 hidden sm:block">
                  {new Date(mv.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL RETRAIT / ENTRÉE
      ══════════════════════════════════════ */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  modalMode === "retrait" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                }`}>
                  {modalMode === "retrait"
                    ? <ArrowDownLeft className="w-5 h-5" />
                    : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {modalMode === "retrait" ? "Retrait stock" : "Entrée stock"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "retrait"
                      ? "Retour client ou produit retiré"
                      : "Réapprovisionnement boutique"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sélection produit */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Produit *</label>
              {modalProduct ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{modalProduct.nom}</p>
                    <p className="text-xs text-slate-400 font-mono">{modalProduct.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">Stock actuel</p>
                    <p className={`font-bold text-sm ${stockColor(modalProduct)}`}>{modalProduct.quantite} u.</p>
                  </div>
                  <button
                    onClick={() => setModalProduct(null)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all"
                  value=""
                  onChange={e => {
                    const found = items.find(i => i.produit_id === Number(e.target.value));
                    if (found) setModalProduct(found);
                  }}
                >
                  <option value="" disabled>— Sélectionner un produit —</option>
                  {items.map(i => (
                    <option key={i.produit_id} value={i.produit_id}>
                      {i.nom} — {i.quantite} u. en stock
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Quantité (unités) *
              </label>
              <input
                type="number"
                min="1"
                value={modalQty}
                onChange={e => setModalQty(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all font-display font-700 text-lg"
                placeholder="0"
              />
            </div>

            {/* Motif (retrait uniquement) */}
            {modalMode === "retrait" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif du retrait *</label>
                <select
                  value={modalMotif}
                  onChange={e => setModalMotif(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all"
                >
                  {MOTIFS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Référence commande */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Référence commande
                <span className="font-normal text-slate-400 ml-1">(optionnel)</span>
              </label>
              <input
                type="text"
                value={modalRef}
                onChange={e => setModalRef(e.target.value)}
                placeholder="CMD-20250101-XXXX"
                className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all font-mono"
              />
            </div>

            {/* Erreur */}
            {modalError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            {/* Résumé */}
            {modalProduct && Number(modalQty) > 0 && (
              <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${
                modalMode === "retrait" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}>
                {modalMode === "retrait" ? (
                  <>
                    Stock après retrait :{" "}
                    <span className="font-bold">
                      {Math.max(0, modalProduct.quantite - Number(modalQty))} u.
                    </span>
                    {" "}(−{modalQty} u.)
                  </>
                ) : (
                  <>
                    Stock après entrée :{" "}
                    <span className="font-bold">
                      {modalProduct.quantite + Number(modalQty)} u.
                    </span>
                    {" "}(+{modalQty} u.)
                  </>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={submitMouvement}
                disabled={modalSaving || !modalProduct || !Number(modalQty)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${
                  modalMode === "retrait"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {modalSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />}
                {modalMode === "retrait" ? "Confirmer le retrait" : "Confirmer l'entrée"}
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
      )}
    </div>
  );
}
