"use client";

import { useState } from "react";
import { Loader2, Save, Smartphone, Banknote, CreditCard, Building2 } from "lucide-react";

interface PaymentMethod {
  id:          string;
  label:       string;
  description: string;
  icon:        string;
  enabled:     boolean;
  instructions: string;
}

const DEFAULT_METHODS: PaymentMethod[] = [
  {
    id:          "cash_on_delivery",
    label:       "Paiement à la livraison",
    description: "Le client paie en espèces à la réception de la commande.",
    icon:        "banknote",
    enabled:     true,
    instructions: "Préparez le montant exact lors de la livraison.",
  },
  {
    id:          "orange_money",
    label:       "Orange Money",
    description: "Transfert mobile via Orange Money Togo.",
    icon:        "smartphone",
    enabled:     true,
    instructions: "Envoyez le montant au +228 XX XX XX XX avec votre numéro de commande.",
  },
  {
    id:          "tmoney",
    label:       "T-Money (Togocel)",
    description: "Transfert mobile via T-Money.",
    icon:        "smartphone",
    enabled:     true,
    instructions: "Envoyez le montant au +228 XX XX XX XX avec votre numéro de commande.",
  },
  {
    id:          "flooz",
    label:       "Flooz (Moov)",
    description: "Transfert mobile via Flooz Moov Africa.",
    icon:        "smartphone",
    enabled:     false,
    instructions: "Envoyez le montant au +228 XX XX XX XX avec votre numéro de commande.",
  },
  {
    id:          "bank_transfer",
    label:       "Virement bancaire",
    description: "Virement sur le compte bancaire de la boutique.",
    icon:        "building",
    enabled:     false,
    instructions: "Banque : UTB · IBAN : TG00 0000 0000 0000 0000 · Réf : votre numéro de commande.",
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  banknote:   <Banknote className="w-5 h-5" />,
  smartphone: <Smartphone className="w-5 h-5" />,
  building:   <Building2 className="w-5 h-5" />,
  card:       <CreditCard className="w-5 h-5" />,
};

const inputCls = "w-full px-4 py-2.5 text-sm bg-white rounded-2xl border-2 border-slate-200 focus:border-brand-500 outline-none transition-all";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";

export default function PaymentMethodsManager({ settings }: { settings: Record<string, string> }) {
  const [methods, setMethods] = useState<PaymentMethod[]>(() => {
    try { return JSON.parse(settings.payment_methods ?? "[]").length
      ? JSON.parse(settings.payment_methods)
      : DEFAULT_METHODS;
    } catch { return DEFAULT_METHODS; }
  });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setMethods(ms => ms.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  }

  function update(id: string, field: keyof PaymentMethod, value: string) {
    setMethods(ms => ms.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ payment_methods: JSON.stringify(methods) }),
    });
    setLoading(false);
    setMsg(res.ok ? "Réglages sauvegardés ✓" : "Erreur lors de la sauvegarde");
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-2xl text-sm ${msg.includes("✓") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg}
        </div>
      )}

      <div className="space-y-3">
        {methods.map(m => (
          <div key={m.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-4 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.enabled ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"}`}>
                {ICON_MAP[m.icon] ?? <CreditCard className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${m.enabled ? "text-slate-900" : "text-slate-400"}`}>{m.label}</p>
                <p className="text-xs text-slate-400 truncate">{m.description}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggle(m.id)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${m.enabled ? "bg-brand-900" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${m.enabled ? "translate-x-5" : ""}`} />
              </button>
              <button
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                {expanded === m.id ? "Réduire" : "Modifier"}
              </button>
            </div>

            {/* Expanded editor */}
            {expanded === m.id && (
              <div className="border-t border-slate-100 p-5 space-y-3 bg-slate-50">
                <div>
                  <label className={labelCls}>Nom affiché</label>
                  <input type="text" value={m.label}
                    onChange={e => update(m.id, "label", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Description courte</label>
                  <input type="text" value={m.description}
                    onChange={e => update(m.id, "description", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Instructions pour le client (affiché après commande)</label>
                  <textarea rows={3} value={m.instructions}
                    onChange={e => update(m.id, "instructions", e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={save} disabled={loading}
        className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {loading ? "Enregistrement…" : "Sauvegarder"}
      </button>
    </div>
  );
}
