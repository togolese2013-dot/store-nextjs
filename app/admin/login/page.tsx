"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const redirect = params.get("redirect") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Impossible de se connecter. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-accent-400" fill="currentColor" />
            </div>
          </div>
          <h1 className="font-display font-800 text-2xl text-white">Togolese Shop</h1>
          <p className="text-brand-300 text-sm mt-1">Panneau d'administration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="font-display font-800 text-slate-900 text-xl mb-6">Connexion</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Adresse email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@togolese.net" required autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-500 outline-none text-sm transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-200 focus:border-brand-500 outline-none text-sm transition-all font-sans"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Première connexion ? Entrez votre email et un mot de passe.<br />
            Un compte super_admin sera créé automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
