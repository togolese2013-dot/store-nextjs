"use client";

import { useState } from "react";
import { Gift, Mail } from "lucide-react";

const PROMO_CODE = "BIENVENUE10";

export default function Newsletter() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "already" | "error">("idle");
  const [copied, setCopied] = useState(false);

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
    <section className="py-10 bg-white border-t border-slate-100">
      <div className="max-w-xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-brand-700" />
          </div>
          <h2 className="font-display text-xl font-800 text-slate-900">
            Offres en avant-première
          </h2>
        </div>

        <p className="text-slate-500 text-sm mb-4 pl-12">
          Nouveautés et promos exclusives, avant tout le monde.
        </p>

        {/* Promo badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-50 border border-accent-100 mb-5 mx-0">
          <Gift className="w-4 h-4 text-accent-500 shrink-0" />
          <span className="text-sm text-accent-700">
            Code <span className="font-bold">{PROMO_CODE}</span> — −10% sur votre 1ère commande
          </span>
        </div>

        {(status === "done" || status === "already") ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-green-50 text-green-700 font-semibold text-sm">
              ✅ {status === "already" ? "Vous êtes déjà inscrit !" : "Merci, bienvenue !"}
            </div>
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-accent-50 border border-accent-200 border-dashed">
              <div>
                <p className="text-xs text-accent-600 font-semibold">Votre code promo</p>
                <p className="font-display font-900 text-xl text-accent-700 tracking-wider">{PROMO_CODE}</p>
              </div>
              <button
                onClick={copyCode}
                className="shrink-0 px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors"
              >
                {copied ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">Valable sur votre première commande · Non cumulable</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Input + button always side-by-side */}
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:outline-none transition-colors font-sans bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 px-5 py-3 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {status === "loading" ? "…" : "S'inscrire"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs text-red-500 mt-2">Une erreur est survenue. Réessayez.</p>
            )}
            <p className="text-xs text-slate-400 mt-2.5 text-center">
              Pas de spam. Désabonnement à tout moment.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
