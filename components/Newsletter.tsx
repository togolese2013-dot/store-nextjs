"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-accent-500" />
        </div>
        <h2 className="font-display text-2xl font-800 text-slate-900 mb-2">
          Recevez nos offres en premier
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Inscrivez-vous pour être alerté des nouvelles promotions et arrivages.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-green-50 text-green-700 font-semibold">
            ✅ Merci ! Vous recevrez nos offres bientôt.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
              className="px-6 py-3 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors whitespace-nowrap"
            >
              S'inscrire
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
