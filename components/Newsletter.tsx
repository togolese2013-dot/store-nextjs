"use client";

import { useState } from "react";
import { Sparkles, Gift } from "lucide-react";

const PROMO_CODE = "BIENVENUE10";

export default function Newsletter() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "done" | "already" | "error">("idle");
  const [copied, setCopied]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res  = await fetch("/api/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); return; }
      setStatus(data.already ? "already" : "done");
    } catch {
      setStatus("error");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(PROMO_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-14 bg-white border-t border-slate-100">
      <div className="max-w-xl mx-auto px-4 text-center">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-accent-500" />
        </div>

        <h2 className="font-display text-2xl font-800 text-slate-900 mb-2">
          Recevez nos offres en premier
        </h2>

        {/* Incentive badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 border border-accent-200 mb-4">
          <Gift className="w-4 h-4 text-accent-500 shrink-0" />
          <span className="text-sm font-bold text-accent-700">
            −10% sur votre première commande avec le code <span className="font-900">{PROMO_CODE}</span>
          </span>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Inscrivez-vous pour être alerté des nouvelles promotions et arrivages exclusifs.
        </p>

        {(status === "done" || status === "already") ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-green-50 text-green-700 font-semibold text-sm">
              ✅ {status === "already" ? "Vous êtes déjà inscrit !" : "Merci ! Bienvenue dans notre communauté."}
            </div>
            {/* Promo code block */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-accent-50 border-2 border-dashed border-accent-300">
              <div className="text-left">
                <p className="text-xs text-accent-600 font-semibold mb-0.5">Votre code promo</p>
                <p className="font-display font-900 text-xl text-accent-700 tracking-wider">{PROMO_CODE}</p>
              </div>
              <button
                onClick={copyCode}
                className="shrink-0 px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors"
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <p className="text-xs text-slate-400">Valable sur votre première commande · Non cumulable</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 text-sm focus:border-brand-500 outline-none transition-colors font-sans"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors whitespace-nowrap disabled:opacity-60"
              >
                {status === "loading" ? "Envoi…" : "S'inscrire"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs text-red-500 text-center">Une erreur est survenue. Réessayez.</p>
            )}
            <p className="text-xs text-slate-400">
              Pas de spam. Désabonnement possible à tout moment.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
