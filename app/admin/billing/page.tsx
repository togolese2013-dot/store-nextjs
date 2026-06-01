"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, Clock, AlertTriangle, XCircle, Zap, Star, Smartphone, ChevronRight } from "lucide-react";

interface BillingInfo {
  shop_id:             number;
  nom:                 string;
  plan:                "basic" | "pro" | "business";
  subscription_status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at:       string | null;
  current_period_end:  string | null;
  actif:               boolean;
  merchant_moov:       string;
  merchant_yas:        string;
  payments:            Payment[];
}

interface Payment {
  id:              number;
  transaction_id:  string;
  plan:            "pro" | "business";
  amount:          number;
  duration_months: number;
  status:          "pending" | "paid" | "failed" | "cancelled";
  operator:        "moov" | "yas" | null;
  mm_reference:    string | null;
  created_at:      string;
  paid_at:         string | null;
}

const PLAN_PRICES = { pro: 9900, business: 24900 };
const PLAN_LABELS = { basic: "Basic", pro: "Pro", business: "Business" };

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function formatPrice(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function StatusBadge({ status, trialEndsAt }: { status: BillingInfo["subscription_status"]; trialEndsAt?: string | null }) {
  const trialExpired = status === "trial" && trialEndsAt && new Date(trialEndsAt) < new Date();
  const effectiveStatus = trialExpired ? "expired" : status;
  const map = {
    trial:     { label: "Essai gratuit",       cls: "bg-blue-100 text-blue-700",   icon: Clock },
    active:    { label: "Actif",               cls: "bg-green-100 text-green-700", icon: CheckCircle },
    expired:   { label: "Essai terminé",       cls: "bg-amber-100 text-amber-700", icon: AlertTriangle },
    suspended: { label: "Suspendu",            cls: "bg-red-100 text-red-700",     icon: XCircle },
  };
  const { label, cls, icon: Icon } = map[effectiveStatus];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cls}`}>
      <Icon size={14} />{label}
    </span>
  );
}

// ── Payment modal ────────────────────────────────────────────────────────────
function PaymentModal({
  plan, months, info,
  onClose, onSuccess,
}: {
  plan:      "pro" | "business";
  months:    number;
  info:      BillingInfo;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [operator, setOperator] = useState<"moov" | "yas">("moov");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount      = PLAN_PRICES[plan] * months;
  const merchantNum = operator === "moov" ? info.merchant_moov : info.merchant_yas;
  const operatorLabel = operator === "moov" ? "Moov Money (Flooz)" : "Mixx by Yas";

  async function handleSubmit() {
    if (!reference.trim()) { setError("Entre la référence de ta transaction."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/billing/initiate", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ plan, duration_months: months, operator, mm_reference: reference.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); setSubmitting(false); return; }
      onSuccess();
    } catch {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Smartphone size={18} className="text-violet-600" />
            Payer {formatPrice(amount)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Operator selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
            <div className="grid grid-cols-2 gap-3">
              {(["moov", "yas"] as const).map(op => (
                <button
                  key={op}
                  onClick={() => setOperator(op)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    operator === op
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {op === "moov" ? "Moov Money" : "Mixx by Yas"}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Instructions :</p>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>
                Compose sur ton téléphone :{" "}
                {operator === "moov"
                  ? <code className="bg-white px-1.5 py-0.5 rounded border text-xs font-mono">*155#</code>
                  : <code className="bg-white px-1.5 py-0.5 rounded border text-xs font-mono">*144#</code>
                }
              </li>
              <li>
                Envoie <strong>{formatPrice(amount)}</strong> au numéro{" "}
                <strong className="text-gray-900">+228 {merchantNum.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4")}</strong>
              </li>
              <li>Note la <strong>référence SMS</strong> reçue après la transaction</li>
              <li>Entre cette référence ci-dessous</li>
            </ol>
            <div className="mt-2 text-xs text-gray-500">
              {operatorLabel} · {PLAN_LABELS[plan]} · {months} mois
            </div>
          </div>

          {/* Reference input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence de transaction
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: TG2024XXXX ou #123456"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              style={{ fontSize: "16px" }}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !reference.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? "Envoi…" : <>Soumettre ma référence <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan, current, onPay,
}: {
  plan:    "pro" | "business";
  current: boolean;
  onPay:   (plan: "pro" | "business", months: number) => void;
}) {
  const [months, setMonths] = useState(1);
  const price = PLAN_PRICES[plan];
  const isPro = plan === "business";

  const features: Record<"pro" | "business", string[]> = {
    pro:      ["Produits illimités", "Commandes illimitées", "5 utilisateurs admin", "WhatsApp CRM inclus", "Finance & rapports", "Coupons & fidélité", "Support prioritaire WhatsApp"],
    business: ["Tout du plan Pro", "Utilisateurs illimités", "Multi-entrepôts", "API & webhooks", "Marque blanche", "Gestionnaire dédié", "SLA 99,9%"],
  };

  return (
    <div className={`relative rounded-2xl border-2 p-6 flex flex-col gap-4 ${
      isPro ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white"
    } ${current ? "ring-2 ring-offset-2 ring-violet-400" : ""}`}>
      {isPro && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMANDÉ</span>}
      {current && <span className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">ACTUEL</span>}

      <div>
        <div className="flex items-center gap-2 mb-1">
          {isPro ? <Star size={18} className="text-violet-600" /> : <Zap size={18} className="text-blue-500" />}
          <span className="font-bold text-lg">{PLAN_LABELS[plan]}</span>
        </div>
        <div className="text-3xl font-extrabold text-gray-900">
          {formatPrice(price)}<span className="text-sm font-normal text-gray-500">/mois</span>
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {features[plan].map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />{f}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <select
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ fontSize: "16px" }}
        >
          <option value={1}>1 mois — {formatPrice(price)}</option>
          <option value={3}>3 mois — {formatPrice(price * 3)}</option>
          <option value={6}>6 mois — {formatPrice(price * 6)}</option>
          <option value={12}>12 mois — {formatPrice(price * 12)}</option>
        </select>
        <button
          onClick={() => onPay(plan, months)}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            isPro ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Payer {formatPrice(price * months)}
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [info, setInfo]         = useState<BillingInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<{ plan: "pro" | "business"; months: number } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function loadBilling() {
    setLoading(true);
    fetch("/api/admin/billing", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadBilling(); }, []);

  function handleSuccess() {
    setModal(null);
    setSubmitted(true);
    loadBilling();
  }

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
    </div>
  );

  const isLegacy = info?.shop_id === 1;

  return (
    <>
      {modal && info && (
        <PaymentModal
          plan={modal.plan}
          months={modal.months}
          info={info}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={24} className="text-violet-600" />Abonnement
          </h1>
          <p className="text-gray-500 mt-1">Gérez votre plan via Mobile Money.</p>
        </div>

        {/* Success banner */}
        {submitted && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3 text-green-800">
            <CheckCircle size={20} />
            <div>
              <p className="font-medium">Paiement soumis — en attente de validation.</p>
              <p className="text-sm mt-0.5">Vous serez notifié par email dès l&apos;activation de votre plan.</p>
            </div>
          </div>
        )}

        {/* Current status */}
        {info && (
          <div className="rounded-2xl border bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Plan actuel</p>
              <p className="text-xl font-bold text-gray-900">{PLAN_LABELS[info.plan]}</p>
              <StatusBadge status={info.subscription_status} trialEndsAt={info.trial_ends_at} />
            </div>
            <div className="text-right space-y-1">
              {info.subscription_status === "trial" && info.trial_ends_at && (
                new Date(info.trial_ends_at) < new Date()
                  ? <p className="text-sm text-amber-600 font-medium">Période d&apos;essai terminée le {formatDate(info.trial_ends_at)}.</p>
                  : <><p className="text-xs text-gray-400">Fin d&apos;essai</p><p className="font-semibold text-gray-800">{formatDate(info.trial_ends_at)}</p></>
              )}
              {info.subscription_status === "active" && info.current_period_end && (
                <><p className="text-xs text-gray-400">Expire le</p><p className="font-semibold text-gray-800">{formatDate(info.current_period_end)}</p></>
              )}
              {info.subscription_status === "expired" && (
                <p className="text-sm text-amber-600 font-medium">Renouvelez pour maintenir l&apos;accès.</p>
              )}
            </div>
          </div>
        )}

        {isLegacy ? (
          <div className="rounded-2xl bg-gray-50 border p-6 text-center text-gray-500">
            Cette boutique est exempte de facturation.
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choisir un plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlanCard plan="pro"       current={info?.plan === "pro"}       onPay={(p, m) => setModal({ plan: p, months: m })} />
                <PlanCard plan="business"  current={info?.plan === "business"}  onPay={(p, m) => setModal({ plan: p, months: m })} />
              </div>
            </div>

            {/* Payment history */}
            {info?.payments && info.payments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des paiements</h2>
                <div className="rounded-2xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Plan</th>
                        <th className="px-4 py-3 text-left">Durée</th>
                        <th className="px-4 py-3 text-left">Opérateur</th>
                        <th className="px-4 py-3 text-right">Montant</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {info.payments.map(p => (
                        <tr key={p.id} className="bg-white hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-3 font-medium capitalize">{PLAN_LABELS[p.plan]}</td>
                          <td className="px-4 py-3 text-gray-500">{p.duration_months} mois</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{p.operator ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.amount)}</td>
                          <td className="px-4 py-3 text-center">
                            {p.status === "paid"      && <span className="text-green-600 font-medium">Validé</span>}
                            {p.status === "pending"   && <span className="text-amber-600">En attente</span>}
                            {p.status === "failed"    && <span className="text-red-500">Échoué</span>}
                            {p.status === "cancelled" && <span className="text-gray-400">Annulé</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
