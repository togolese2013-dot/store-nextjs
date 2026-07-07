"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, Truck, Plus, Search,
  Eye, Trash2, Printer, Loader2, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Pencil, PackageCheck,
  Warehouse, DollarSign,
  CreditCard, Banknote, Smartphone, Building2,
  ShoppingCart, Package,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import type { Facture, Livraison } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";
import BoutiqueDocPrint from "@/components/admin/BoutiqueDocPrint";
import { useAdminSSE } from "@/components/admin/useAdminSSE";
import NewSaleModal from "@/components/admin/NewSaleModal";
import { formatDateTime as sharedFormatDateTime } from "@/lib/format-date";

/* ─── Types ─── */

interface Stats {
  factures: number; livraisons: number; ca_total: number; factures_payees: number;
  ventes_jour_montant: number; ventes_jour_count: number;
  commandes_livrees_jour: number; commandes_livrees_jour_count: number;
  depenses_jour: number; rentrees_jour: number;
  solde_jour: number;
  total_recettes: number; total_depenses: number; solde_net: number;
  stock_produits: number; stock_epuises: number;
}

interface Props {
  initialFactures:   Facture[];
  initialLivraisons: Livraison[];
  initialStats:      Stats;
  totalFactures:     number;
  totalLivraisons:   number;
  canCreate?:        boolean;
  canEdit?:          boolean;
  canDelete?:        boolean;
}

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
  return sharedFormatDateTime(d);
}

function getStatutDisplay(f: Facture): { label: string; color: string } {
  if (f.statut === "annule")   return { label: "Annulé",    color: "bg-red-100 text-red-700" };
  if (f.statut === "brouillon") return { label: "Brouillon", color: "bg-slate-100 text-slate-600" };
  return { label: "Validé", color: "bg-green-50 text-green-700 border border-green-200" };
}

const LIMIT = 50;

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

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function VentesManager({
  initialFactures, initialLivraisons,
  initialStats, totalFactures, totalLivraisons,
  canCreate = true, canEdit = true, canDelete = true,
}: Props) {

  /* ── State principal ── */
  const [stats,      setStats]      = useState<Stats>(initialStats);
  const [factures,   setFactures]   = useState<Facture[]>(initialFactures);
  const [livraisons, setLivraisons] = useState<Livraison[]>(initialLivraisons);
  const [totals,     setTotals]     = useState({ factures: totalFactures, livraisons: totalLivraisons });
  const [offset,     setOffset]     = useState(0);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [flash,      setFlash]      = useState("");

  /* ── NewSaleModal ── */
  const [saleOpen, setSaleOpen] = useState(false);

  /* ── Modal Modifier ── */
  type EditState = { facture: Facture; statut: string; statut_paiement: string; mode_paiement: string; saving: boolean; error: string };
  const [editState,    setEditState]    = useState<EditState | null>(null);
  const [printFacture, setPrintFacture] = useState<Facture | null>(null);

  const router = useRouter();

  function showFlash(msg: string) { setFlash(msg); setTimeout(() => setFlash(""), 3500); }

  /* ── Fetch tableau ── */
  const fetchTab = useCallback(async (q = "", off = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q)   params.set("q",      q);
    if (off) params.set("offset", String(off));
    params.set("limit", String(LIMIT));
    const res  = await fetch(`/api/admin/ventes/factures?${params}`);
    const data = await res.json();
    if (res.ok) { setFactures(data.items); setStats(data.stats); setTotals(p => ({ ...p, factures: data.total })); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTab(); }, [fetchTab]);

  const { subscribe } = useAdminSSE();
  useEffect(() => {
    return subscribe((e) => {
      if (e.type === "vente") fetchTab(search, offset);
    });
  }, [subscribe, fetchTab, search, offset]);

  function applySearch(q: string) { setSearch(q); setOffset(0); fetchTab(q, 0); }
  function paginate(off: number)  { setOffset(off); fetchTab(search, off); }

  /* ── Delete ── */
  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet élément ?")) return;
    const res = await fetch(`/api/admin/ventes/factures/${id}`, { method: "DELETE" });
    if (res.ok) { showFlash("Supprimé ✓"); fetchTab(search, offset); }
  }

  function handlePrint(f: Facture) { setPrintFacture(f); }

  /* ── Valider livraison (site_order) ── */
  async function handleMarkDelivered(orderId: number) {
    if (!confirm("Marquer cette commande comme livrée ?")) return;
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "delivered" }),
      credentials: "include",
    });
    fetchTab();
  }

  /* ── Voir détail ── */
  function handleView(f: Facture) { router.push(`/admin/ventes/${f.id}`); }

  /* ── Modifier ── */
  function handleEdit(f: Facture) {
    setEditState({
      facture:         f,
      statut:          f.statut,
      statut_paiement: f.statut_paiement ?? "paye_total",
      mode_paiement:   f.mode_paiement   ?? "especes",
      saving:          false,
      error:           "",
    });
  }

  async function submitEdit() {
    if (!editState) return;
    setEditState(s => s ? { ...s, saving: true, error: "" } : s);
    const res = await fetch(`/api/admin/ventes/factures/${editState.facture.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        statut:          editState.statut,
        statut_paiement: editState.statut_paiement,
        mode_paiement:   editState.mode_paiement,
      }),
    });
    if (res.ok) {
      setFactures(prev => prev.map(f => f.id === editState.facture.id
        ? { ...f, statut: editState.statut as Facture["statut"], statut_paiement: editState.statut_paiement, mode_paiement: editState.mode_paiement }
        : f
      ));
      setEditState(null);
      showFlash("Vente mise à jour ✓");
    } else {
      const data = await res.json();
      setEditState(s => s ? { ...s, saving: false, error: data.error ?? "Erreur" } : s);
    }
  }

  /* ── Pagination ── */
  const currentTotal = totals.factures;
  const totalPages   = Math.ceil(currentTotal / LIMIT);
  const currentPage  = Math.floor(offset / LIMIT) + 1;
  const rows = factures;

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
        onRefresh={() => fetchTab(search, offset)}
        refreshLoading={loading}
        ctaLabel="Nouvelle vente"
        onCtaClick={canCreate ? () => setSaleOpen(true) : undefined}
      />

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Produits en stock */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produits en stock</p>
            <Warehouse className="w-8 h-8 text-slate-400 opacity-30" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{new Intl.NumberFormat("fr-FR").format(stats.stock_produits)}</p>
          {stats.stock_epuises > 0 && (
            <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
              {stats.stock_epuises} produit{stats.stock_epuises > 1 ? "s" : ""} épuisé{stats.stock_epuises > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Solde du jour */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solde aujourd&apos;hui</p>
            <Banknote className="w-8 h-8 text-emerald-400 opacity-40" />
          </div>
          {(() => {
            const solde = (stats.ventes_jour_montant + (stats.commandes_livrees_jour ?? 0)) + stats.rentrees_jour - stats.depenses_jour;
            return (
              <p className={`text-2xl font-bold tabular-nums ${solde >= 0 ? "text-slate-900" : "text-red-600"}`}>
                {new Intl.NumberFormat("fr-FR").format(solde)}{" "}
                <span className="text-sm font-semibold text-emerald-500">FCFA</span>
              </p>
            );
          })()}
        </div>

        {/* Ventes aujourd'hui */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes aujourd&apos;hui</p>
            <ShoppingCart className="w-8 h-8 text-slate-400 opacity-30" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat("fr-FR").format(stats.ventes_jour_montant + (stats.commandes_livrees_jour ?? 0))}{" "}
            <span className="text-sm font-semibold text-emerald-500">FCFA</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {stats.ventes_jour_count} vente{stats.ventes_jour_count !== 1 ? "s" : ""}
            </span>
            {(stats.commandes_livrees_jour_count ?? 0) > 0 && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                {stats.commandes_livrees_jour_count} commande{stats.commandes_livrees_jour_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Rentrées */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rentrées</p>
            <DollarSign className="w-8 h-8 text-cyan-400 opacity-40" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat("fr-FR").format(stats.rentrees_jour)}{" "}
            <span className="text-sm font-semibold text-cyan-500">FCFA</span>
          </p>
        </div>
      </div>

      {/* Dépenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses</p>
            <TrendingDown className="w-8 h-8 text-red-400 opacity-40" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-red-600">
            {new Intl.NumberFormat("fr-FR").format(stats.depenses_jour)}{" "}
            <span className="text-sm font-semibold text-red-400">FCFA</span>
          </p>
        </div>
      </div>


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
            {/* ── Mobile cards (md:hidden) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {(rows as Facture[]).map(f => {
                const s = getStatutDisplay(f);
                const totalFacture = f.source === "site_order"
                  ? Math.max(0, (f.sous_total ?? f.total) - (f.coupon_remise ?? 0))
                  : f.total;
                const reste = (f.statut_paiement === "paye_total" || f.statut_paiement === "paye")
                  ? 0
                  : f.statut_paiement === "acompte" && f.montant_acompte != null
                    ? totalFacture - f.montant_acompte
                    : totalFacture;
                return (
                  <div
                    key={f.id}
                    className="px-4 py-3.5 bg-white active:bg-slate-50 cursor-pointer"
                    onClick={() => handleView(f)}
                  >
                    {/* Row 1 : reference + commande/livraison badge + status */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                        {f.reference}
                      </span>
                      {f.source === "site_order" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-full border border-violet-100">
                          <Truck className="w-3 h-3" /> Commande
                        </span>
                      ) : f.avec_livraison === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                          <Truck className="w-3 h-3" /> Livraison
                        </span>
                      ) : null}
                      <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Row 2 : client name */}
                    <div className="font-semibold text-slate-900 text-sm mb-0.5">{f.client_nom}</div>

                    {/* Row 3 : phone · date+time · vendeur */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 mb-2">
                      {f.client_tel && <span>{f.client_tel}</span>}
                      {f.client_tel && <span>·</span>}
                      <span>{formatDate(f.created_at)}</span>
                      {f.vendeur && <><span>·</span><span className="text-slate-400">par <span className="font-semibold text-slate-500">{f.vendeur}</span></span></>}
                    </div>

                    {/* Row 4 : montant + actions */}
                    <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      <span className={`text-sm font-bold ${reste > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {reste > 0 ? `Reste : ${formatPrice(reste)}` : `Total : ${formatPrice(totalFacture)}`}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleView(f)} title="Voir" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-4 h-4" /></button>
                        {canEdit && <button onClick={() => handleEdit(f)} title="Modifier" className="p-2 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"><Pencil className="w-4 h-4" /></button>}
                        {f.source === "site_order" && f.order_id && f.order_status !== "delivered" && f.order_status !== "cancelled" && (
                          <button onClick={() => handleMarkDelivered(f.order_id!)} title="Valider livraison" className="p-2 rounded-xl hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"><PackageCheck className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handlePrint(f)} title="Imprimer" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Printer className="w-4 h-4" /></button>
                        {canDelete && f.source !== "site_order" && (
                          <button onClick={() => handleDelete(f.id)} title="Supprimer" className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Référence</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Montant</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Paiement</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Vendeur</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(rows as Facture[]).map(f => {
                    const s = getStatutDisplay(f);
                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => handleView(f)}
                      >
                        <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(f.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">{f.reference.replace(/-\d{4}$/, "")}</span>
                            {f.source === "site_order" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-full border border-violet-100">
                                <Truck className="w-3 h-3" /> Commande
                              </span>
                            ) : f.avec_livraison === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                                <Truck className="w-3 h-3" /> Livraison
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{f.client_nom}</div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-900 hidden lg:table-cell">
                          {formatPrice(f.source === "site_order" ? Math.max(0, (f.sous_total ?? f.total) - (f.coupon_remise ?? 0)) : f.total)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {(f.statut_paiement === "paye_total" || f.statut_paiement === "paye") ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Complet</span>
                          ) : f.statut_paiement === "acompte" && f.montant_acompte != null && f.total > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              {Math.round((f.montant_acompte / f.total) * 100)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs hidden lg:table-cell">{f.vendeur ?? "—"}</td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleView(f)} title="Voir" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"><Eye className="w-4 h-4" /></button>
                            {canEdit && <button onClick={() => handleEdit(f)} title="Modifier" className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors"><Pencil className="w-4 h-4" /></button>}
                            <button onClick={() => handlePrint(f)} title="Imprimer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"><Printer className="w-4 h-4" /></button>
                            {f.source === "site_order" && f.order_id && f.order_status !== "delivered" && f.order_status !== "cancelled" && (
                              <button onClick={() => handleMarkDelivered(f.order_id!)} title="Valider la livraison" className="p-1.5 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600 transition-colors"><PackageCheck className="w-4 h-4" /></button>
                            )}
                            {canDelete && f.source !== "site_order" && (
                              <button onClick={() => handleDelete(f.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
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

      {/* ── NewSaleModal drawer ── */}
      <NewSaleModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        onSubmitted={() => { showFlash("Vente enregistrée ✓"); fetchTab(search, offset); }}
      />



      {/* ════════════════════════════════════
          MODAL MODIFIER VENTE
      ════════════════════════════════════ */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditState(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Modifier la vente</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{editState.facture.reference.replace(/-\d{4}$/, "")}</p>
              </div>
              <button onClick={() => setEditState(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Statut facture */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Statut</label>
                <div className="grid grid-cols-2 gap-2">
                  {FACTURE_STATUTS.map(s => (
                    <button key={s.value}
                      onClick={() => setEditState(p => p ? { ...p, statut: s.value } : p)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${editState.statut === s.value ? `${s.color} border-current ring-2 ring-offset-1 ring-current` : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Statut paiement */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Statut paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUTS_PAIEMENT.map(s => (
                    <button key={s.value}
                      onClick={() => setEditState(p => p ? { ...p, statut_paiement: s.value } : p)}
                      className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-all ${editState.statut_paiement === s.value ? `${s.color} ring-2 ring-offset-1 ring-amber-400` : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Mode paiement */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODES_PAIEMENT.map(m => (
                    <button key={m.value}
                      onClick={() => setEditState(p => p ? { ...p, mode_paiement: m.value } : p)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${editState.mode_paiement === m.value ? "border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-offset-1 ring-amber-300" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {editState.error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {editState.error}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={submitEdit} disabled={editState.saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all">
                  {editState.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
                <button onClick={() => setEditState(null)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Print overlay ── */}
      {printFacture && (() => {
        const parsedItems = (() => {
          try { return JSON.parse(printFacture.items); } catch { return []; }
        })();
        return (
          <BoutiqueDocPrint
            type="facture"
            format="A4"
            reference={printFacture.reference}
            date={printFacture.created_at}
            client_nom={printFacture.client_nom}
            client_tel={printFacture.client_tel}
            items={parsedItems}
            sous_total={printFacture.sous_total}
            remise={printFacture.remise}
            total={printFacture.total}
            mode_paiement={printFacture.mode_paiement}
            statut_paiement={printFacture.statut_paiement}
            adresse_livraison={printFacture.adresse_livraison}
            note={printFacture.note}
            onClose={() => setPrintFacture(null)}
          />
        );
      })()}
    </div>
  );
}
