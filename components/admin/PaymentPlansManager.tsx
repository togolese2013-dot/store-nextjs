"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Check, Clock, XCircle, ChevronDown, ChevronUp,
  Loader2, RefreshCw, CreditCard, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface Tranche {
  id:            number;
  numero:        number;
  montant:       number;
  date_echeance: string;
  date_paiement: string | null;
  statut:        "en_attente" | "payee" | "en_retard";
  note:          string | null;
}

interface Plan {
  id:              number;
  order_id:        number;
  reference:       string;
  nom:             string;
  nb_tranches:     number;
  montant_total:   number;
  montant_tranche: number;
  statut:          "en_cours" | "solde" | "annule";
  created_at:      string;
  tranches?:       Tranche[];
}

function trancheStatutMeta(statut: string) {
  switch (statut) {
    case "payee":      return { label: "Payée",      cls: "bg-emerald-100 text-emerald-700", icon: Check };
    case "en_retard":  return { label: "En retard",  cls: "bg-red-100 text-red-600",         icon: AlertTriangle };
    default:           return { label: "En attente", cls: "bg-slate-100 text-slate-600",     icon: Clock };
  }
}

function planStatutBadge(statut: string) {
  switch (statut) {
    case "solde":  return "bg-emerald-100 text-emerald-700";
    case "annule": return "bg-red-100 text-red-600";
    default:       return "bg-amber-100 text-amber-700";
  }
}

function planStatutLabel(statut: string) {
  switch (statut) {
    case "solde":  return "Soldé";
    case "annule": return "Annulé";
    default:       return "En cours";
  }
}

export default function PaymentPlansManager() {
  const [plans,    setPlans]    = useState<Plan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [tranches, setTranches] = useState<Record<number, Tranche[]>>({});
  const [busy,     setBusy]     = useState<number | null>(null);
  const [note,     setNote]     = useState("");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/payment-plans", { credentials: "include" });
    const json = await res.json();
    setPlans(json.plans ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  async function loadTranches(planOrderId: number, planId: number) {
    if (tranches[planId]) return;
    const res  = await fetch(`/api/admin/payment-plans/order/${planOrderId}`, { credentials: "include" });
    const json = await res.json();
    if (json.plan?.tranches) {
      setTranches(prev => ({ ...prev, [planId]: json.plan.tranches }));
    }
  }

  function toggleExpand(plan: Plan) {
    if (expanded === plan.id) {
      setExpanded(null);
    } else {
      setExpanded(plan.id);
      loadTranches(plan.order_id, plan.id);
    }
  }

  async function toggleTranche(tranche: Tranche, planId: number) {
    setBusy(tranche.id);
    const paid = tranche.statut !== "payee";
    await fetch(`/api/admin/payment-tranches/${tranche.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paid, note: paid ? note || undefined : undefined }),
    });
    setNote("");
    // Refresh this plan's tranches
    setTranches(prev => { const c = { ...prev }; delete c[planId]; return c; });
    const plan = plans.find(p => p.id === planId);
    if (plan) await loadTranches(plan.order_id, planId);
    await fetchPlans();
    setBusy(null);
  }

  const stats = {
    total:    plans.length,
    en_cours: plans.filter(p => p.statut === "en_cours").length,
    solde:    plans.filter(p => p.statut === "solde").length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Plans actifs",  value: stats.en_cours, cls: "text-amber-700"   },
          { label: "Soldés",        value: stats.solde,    cls: "text-emerald-700" },
          { label: "Total",         value: stats.total,    cls: "text-slate-700"   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-600" />
          Paiements échelonnés
        </h2>
        <button onClick={fetchPlans} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-slate-300">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucun plan de paiement</p>
          <p className="text-sm text-slate-400 mt-1">Les commandes en paiement échelonné apparaîtront ici.</p>
        </div>
      )}

      <div className="space-y-3">
        {plans.map(plan => {
          const isOpen = expanded === plan.id;
          const planTranches = tranches[plan.id] ?? [];
          const paidCount = planTranches.filter(t => t.statut === "payee").length;

          return (
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => toggleExpand(plan)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/orders/${plan.order_id}`}
                      onClick={e => e.stopPropagation()}
                      className="font-bold text-sm text-brand-700 hover:underline"
                    >
                      #{plan.reference}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planStatutBadge(plan.statut)}`}>
                      {planStatutLabel(plan.statut)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {plan.nom} · {plan.nb_tranches} tranches · {formatPrice(plan.montant_total)}
                  </p>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <p className="text-xs font-semibold text-slate-700">
                    {isOpen && planTranches.length > 0 ? `${paidCount}/${plan.nb_tranches}` : ""}
                  </p>
                  {isOpen && planTranches.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {planTranches.map(t => (
                        <div key={t.id} className={`w-4 h-1.5 rounded-full ${t.statut === "payee" ? "bg-emerald-400" : "bg-slate-200"}`} />
                      ))}
                    </div>
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Tranches */}
              {isOpen && (
                <div className="border-t border-slate-100">
                  {planTranches.length === 0 ? (
                    <div className="flex justify-center py-5">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-slate-50">
                        {planTranches.map(t => {
                          const meta    = trancheStatutMeta(t.statut);
                          const Icon    = meta.icon;
                          const isPaid  = t.statut === "payee";
                          const isBusy  = busy === t.id;

                          return (
                            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${meta.cls}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">Tranche {t.numero}</p>
                                <p className="text-[11px] text-slate-400">
                                  Échéance : {new Date(t.date_echeance).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                                  {t.date_paiement && (
                                    <span className="text-emerald-600 ml-1">
                                      · Payée le {new Date(t.date_paiement).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                  {t.note && <span className="text-slate-500 ml-1">· {t.note}</span>}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-slate-900 shrink-0 mr-2">
                                {formatPrice(t.montant)}
                              </p>
                              <button
                                onClick={() => toggleTranche(t, plan.id)}
                                disabled={isBusy || plan.statut === "annule"}
                                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
                                  isPaid
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                {isBusy
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : isPaid ? "Annuler" : "Marquer payée"
                                }
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Note input for next unpaid tranche */}
                      {plan.statut === "en_cours" && (
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Note optionnelle (ex: Flooz reçu)"
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-400 outline-none bg-white"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
