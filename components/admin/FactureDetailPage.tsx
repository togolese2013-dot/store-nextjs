"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, User, Printer, Truck, MapPin,
  Check, X, Loader2, AlertTriangle,
} from "lucide-react";
import type { Facture, FactureItem } from "@/lib/admin-db";
import { formatPrice } from "@/lib/utils";

const MODES_PAIEMENT = [
  { value: "especes",           label: "Espèces" },
  { value: "mix_by_yas",        label: "Mix by Yas" },
  { value: "moov_money",        label: "Moov Money" },
  { value: "tmoney",            label: "TMoney" },
  { value: "virement_bancaire", label: "Virement bancaire" },
];

const STATUT_COLORS: Record<string, string> = {
  brouillon: "bg-slate-100 text-slate-600",
  valide:    "bg-blue-100 text-blue-700",
  paye:      "bg-emerald-100 text-emerald-700",
  annule:    "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  valide:    "Validé",
  paye:      "Payé",
  annule:    "Annulé",
};

function formatDate(d: string) {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function addDays(d: string, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function modeLabel(value: string | null) {
  return MODES_PAIEMENT.find(m => m.value === value)?.label ?? value ?? "—";
}

function payRef(factureId: number, dateStr: string, suffix = "") {
  return `PAY-${factureId}-${new Date(dateStr).getTime()}${suffix}`;
}

interface PaymentModal {
  montant:   string;
  mode:      string;
  reference: string;
  notes:     string;
  saving:    boolean;
  error:     string;
}

export default function FactureDetailPage({ facture: initial }: { facture: Facture }) {
  const router   = useRouter();
  const [facture, setFacture] = useState<Facture>(initial);
  const [payModal, setPayModal] = useState<PaymentModal | null>(null);

  /* ── Parse items ── */
  const parsedItems = useMemo<FactureItem[]>(() => {
    try {
      const raw = facture.items;
      if (typeof raw === "string") return JSON.parse(raw);
      if (Array.isArray(raw)) return raw;
    } catch { /* ignore */ }
    return [];
  }, [facture.items]);

  /* ── Payment calculations ── */
  const montantPaye = facture.statut_paiement === "paye_total"
    ? facture.total
    : (facture.montant_acompte ?? 0);
  const resteAPayer = Math.max(0, facture.total - montantPaye);
  const pct = facture.total > 0 ? Math.round((montantPaye / facture.total) * 100) : 0;

  /* ── Synthetic payment history ── */
  const paymentHistory = useMemo(() => {
    type Entry = { date: string; type: string; montant: number; reference: string; vendeur: string | null };
    const entries: Entry[] = [];
    const mode = modeLabel(facture.mode_paiement);
    const vendeur = facture.vendeur;

    if (facture.statut_paiement === "paye_total") {
      if (facture.montant_acompte && facture.montant_acompte > 0 && facture.montant_acompte < facture.total) {
        entries.push({ date: facture.created_at,  type: mode, montant: facture.montant_acompte, reference: payRef(facture.id, facture.created_at, "-1"), vendeur });
        entries.push({ date: facture.updated_at,  type: mode, montant: facture.total - facture.montant_acompte, reference: payRef(facture.id, facture.updated_at, "-2"), vendeur });
      } else {
        entries.push({ date: facture.updated_at || facture.created_at, type: mode, montant: facture.total, reference: payRef(facture.id, facture.created_at), vendeur });
      }
    } else if (facture.montant_acompte && facture.montant_acompte > 0) {
      entries.push({ date: facture.created_at, type: mode, montant: facture.montant_acompte, reference: payRef(facture.id, facture.created_at), vendeur });
    }

    return entries;
  }, [facture]);

  /* ── Payment modal handlers ── */
  function openPayModal() {
    setPayModal({
      montant:   String(resteAPayer),
      mode:      facture.mode_paiement ?? "especes",
      reference: "",
      notes:     "",
      saving:    false,
      error:     "",
    });
  }

  async function submitPayment() {
    if (!payModal) return;
    const amount = Number(payModal.montant);
    if (!amount || amount <= 0) {
      setPayModal(m => m ? { ...m, error: "Montant invalide." } : m);
      return;
    }
    setPayModal(m => m ? { ...m, saving: true, error: "" } : m);

    const newTotal  = montantPaye + amount;
    const isPaidFull = newTotal >= facture.total;

    const body: Record<string, unknown> = {
      statut_paiement: isPaidFull ? "paye_total" : "acompte",
      mode_paiement:   payModal.mode,
      montant_acompte: isPaidFull ? null : newTotal,
    };
    if (isPaidFull) body.statut = "paye";

    const res = await fetch(`/api/admin/ventes/factures/${facture.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (res.ok) {
      setFacture(f => ({
        ...f,
        statut:          isPaidFull ? "paye" : f.statut,
        statut_paiement: isPaidFull ? "paye_total" : "acompte",
        mode_paiement:   payModal.mode,
        montant_acompte: isPaidFull ? null : newTotal,
      }));
      setPayModal(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setPayModal(m => m ? { ...m, saving: false, error: data.error ?? "Erreur serveur" } : m);
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/ventes")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-mono font-bold text-indigo-700">
            {facture.reference.replace(/-\d{4}$/, "")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUT_COLORS[facture.statut] ?? "bg-slate-100 text-slate-600"}`}>
            {STATUT_LABELS[facture.statut] ?? facture.statut}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* ── 2-col layout ── */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-5 items-start">

        {/* ════ Left column ════ */}
        <div className="space-y-5">

          {/* Articles */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Articles</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_COLORS[facture.statut] ?? "bg-slate-100 text-slate-600"}`}>
                {STATUT_LABELS[facture.statut] ?? facture.statut}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left  px-6 py-3 font-semibold text-slate-500 text-xs">Produit</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs">Prix Unitaire</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs">Quantité</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs">Remise</th>
                    <th className="text-right px-6 py-3 font-semibold text-slate-500 text-xs">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {parsedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                        Aucun article
                      </td>
                    </tr>
                  ) : parsedItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{item.nom}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.reference}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-700 tabular-nums">
                        {formatPrice(item.prix)}
                      </td>
                      <td className="px-4 py-4 text-center text-slate-700">{item.qty}</td>
                      <td className="px-4 py-4 text-right text-slate-400">0 FCFA</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900 tabular-nums">
                        {formatPrice(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              <div className="px-6 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Total HT</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatPrice(facture.sous_total > 0 ? facture.sous_total : facture.total)}
                </span>
              </div>
              {facture.remise > 0 && (
                <div className="px-6 py-3 flex justify-between text-sm">
                  <span className="text-slate-500">Remise</span>
                  <span className="font-semibold text-emerald-600 tabular-nums">−{formatPrice(facture.remise)}</span>
                </div>
              )}
              {montantPaye > 0 && (
                <div className="px-6 py-3 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Montant Payé</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{formatPrice(montantPaye)}</span>
                </div>
              )}
              {resteAPayer > 0 && (
                <div className="px-6 py-3 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">Reste à Payer</span>
                  <span className="font-bold text-red-600 tabular-nums">{formatPrice(resteAPayer)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Livraison (si applicable) */}
          {facture.avec_livraison === 1 && (
            <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-indigo-100">
                <Truck className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-slate-900 text-base">Livraison</h2>
              </div>
              <div className="px-6 py-5 space-y-3 text-sm">
                {facture.adresse_livraison && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Adresse</span>
                    <span className="text-slate-900 font-medium text-right">{facture.adresse_livraison}</span>
                  </div>
                )}
                {facture.contact_livraison && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Contact</span>
                    <span className="text-slate-900">{facture.contact_livraison}</span>
                  </div>
                )}
                {facture.lien_localisation && (
                  <a href={facture.lien_localisation} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
                    <MapPin className="w-4 h-4" />
                    Voir la localisation
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Historique des paiements */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Historique des Paiements</h2>
            </div>
            {paymentHistory.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                Aucun paiement enregistré
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left  px-6 py-3 font-semibold text-slate-500 text-xs">Date</th>
                      <th className="text-left  px-4 py-3 font-semibold text-slate-500 text-xs">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs">Montant</th>
                      <th className="text-left  px-4 py-3 font-semibold text-slate-500 text-xs">Référence</th>
                      <th className="text-left  px-6 py-3 font-semibold text-slate-500 text-xs">Enregistré par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paymentHistory.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(p.date)}</td>
                        <td className="px-4 py-3.5 text-slate-700">{p.type}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 tabular-nums">{formatPrice(p.montant)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-indigo-600 whitespace-nowrap">{p.reference}</td>
                        <td className="px-6 py-3.5 text-slate-600">{p.vendeur ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Note */}
          {facture.note && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">Note</p>
              <p className="text-sm text-amber-900">{facture.note}</p>
            </div>
          )}
        </div>

        {/* ════ Right column ════ */}
        <div className="space-y-5">

          {/* Client */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Client</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xl font-bold text-slate-900">{facture.client_nom?.toUpperCase()}</p>
                {facture.client_tel && (
                  <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {facture.client_tel}
                  </p>
                )}
                {facture.client_email && (
                  <p className="text-slate-400 text-sm mt-0.5">{facture.client_email}</p>
                )}
              </div>

              <div className="space-y-2.5 text-sm divide-y divide-slate-50">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Type de document</span>
                  <span className="font-semibold text-slate-900">Facture (A4)</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Date création</span>
                  <span className="font-semibold text-slate-900">{formatDate(facture.created_at)}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Date échéance</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateShort(addDays(facture.created_at, 30))}
                  </span>
                </div>
                {facture.mode_paiement && (
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-500">Mode de paiement</span>
                    <span className="font-semibold text-slate-900">{modeLabel(facture.mode_paiement)}</span>
                  </div>
                )}
                {facture.vendeur && (
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-500">Vendeur</span>
                    <span className="font-semibold text-slate-900">{facture.vendeur}</span>
                  </div>
                )}
              </div>

              <a
                href={`/admin/boutique-clients?q=${encodeURIComponent(facture.client_nom ?? "")}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Voir fiche client
              </a>
            </div>
          </div>

          {/* État du paiement */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">État du Paiement</h2>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">
                    Payé : <span className="font-semibold tabular-nums">{formatPrice(montantPaye)}</span>
                  </span>
                  <span className="text-sm font-bold text-slate-700">{pct}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-slate-200"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-2 text-sm divide-y divide-slate-50">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatPrice(facture.total)}</span>
                </div>
                {resteAPayer > 0 ? (
                  <div className="flex justify-between pt-2.5">
                    <span className="text-slate-500">Reste à payer</span>
                    <span className="font-bold text-red-600 tabular-nums">{formatPrice(resteAPayer)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-2.5 text-emerald-600 text-sm font-semibold">
                    <Check className="w-4 h-4" />
                    Entièrement payé
                  </div>
                )}
              </div>

              {/* CTA */}
              {resteAPayer > 0 && facture.statut !== "annule" && (
                <button
                  onClick={openPayModal}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Enregistrer un Paiement
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ════ Payment Modal ════ */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Enregistrer un Paiement</h3>
              <button onClick={() => setPayModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Montant */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Montant à payer</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 transition-colors">
                  <input
                    type="number"
                    min={1}
                    max={resteAPayer}
                    value={payModal.montant}
                    onChange={e => setPayModal(m => m ? { ...m, montant: e.target.value } : m)}
                    className="flex-1 px-4 py-3 text-sm outline-none"
                    autoFocus
                  />
                  <span className="px-4 py-3 bg-slate-50 text-slate-500 text-sm font-semibold border-l border-slate-200">
                    FCFA
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Reste à payer : {new Intl.NumberFormat("fr-FR").format(resteAPayer)} FCFA
                </p>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mode de paiement</label>
                <select
                  value={payModal.mode}
                  onChange={e => setPayModal(m => m ? { ...m, mode: e.target.value } : m)}
                  className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 transition-colors"
                >
                  {MODES_PAIEMENT.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Référence */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Référence <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={payModal.reference}
                  onChange={e => setPayModal(m => m ? { ...m, reference: e.target.value } : m)}
                  placeholder="Numéro de transaction..."
                  className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Notes <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  rows={3}
                  value={payModal.notes}
                  onChange={e => setPayModal(m => m ? { ...m, notes: e.target.value } : m)}
                  className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                />
              </div>

              {payModal.error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {payModal.error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setPayModal(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitPayment}
                  disabled={payModal.saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {payModal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
