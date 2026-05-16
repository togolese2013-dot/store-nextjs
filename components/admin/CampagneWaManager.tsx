"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Users, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";

type Audience = "tous" | "debiteurs" | "ville";

interface Result { sent: number; failed: number; total: number }

export default function CampagneWaManager() {
  const [message,  setMessage]  = useState("");
  const [audience, setAudience] = useState<Audience>("tous");
  const [ville,    setVille]    = useState("");
  const [count,    setCount]    = useState<number | null>(null);
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<Result | null>(null);
  const [error,    setError]    = useState("");

  const loadCount = useCallback(async () => {
    setCount(null);
    const qs = new URLSearchParams({ audience });
    if (audience === "ville" && ville.trim()) qs.set("ville", ville.trim());
    try {
      const res = await fetch(`/api/admin/whatsapp-campagne/preview?${qs}`, { credentials: "include" });
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch { setCount(0); }
  }, [audience, ville]);

  useEffect(() => { loadCount(); }, [loadCount]);

  async function send() {
    if (!message.trim()) { setError("Message requis."); return; }
    if (!count) { setError("Aucun destinataire."); return; }
    if (!confirm(`Envoyer ce message à ${count} client(s) via WhatsApp ?`)) return;

    setSending(true); setError(""); setResult(null);
    try {
      const res  = await fetch("/api/admin/whatsapp-campagne/send", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ message, audience, ville }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setResult(data);
      setMessage("");
    } catch { setError("Impossible d'envoyer."); }
    finally { setSending(false); }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white";

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="Campagne WhatsApp"
        subtitle="Envoyez un message à une sélection de clients."
        accent="amber"
      />

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">

        {/* Audience */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audience</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: "tous",      label: "Tous les clients" },
              { key: "debiteurs", label: "Débiteurs" },
              { key: "ville",     label: "Par ville" },
            ] as { key: Audience; label: string }[]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setAudience(opt.key)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  audience === opt.key
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-slate-200 text-slate-600 hover:border-amber-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {audience === "ville" && (
            <input
              className={`${inputCls} mt-3`}
              placeholder="Ex : Lomé, Kara…"
              value={ville}
              onChange={e => setVille(e.target.value)}
            />
          )}
        </div>

        {/* Recipients count */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4 text-amber-500" />
          {count === null
            ? "Calcul en cours…"
            : <span><strong className="text-slate-900">{count}</strong> destinataire(s)</span>
          }
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Message
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={6}
            placeholder="Rédigez votre message WhatsApp…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">{message.length} caractères</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Campagne envoyée !</p>
              <p>{result.sent} envoyé(s) · {result.failed} échec(s) · {result.total} total</p>
            </div>
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || !count}
          className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? `Envoi en cours… (${count} messages, ~${Math.ceil((count ?? 0) * 0.6)}s)` : "Envoyer la campagne"}
        </button>

        <p className="text-xs text-slate-400 text-center">
          Un délai de 600ms est appliqué entre chaque envoi pour respecter les limites Meta.
        </p>
      </div>
    </div>
  );
}
