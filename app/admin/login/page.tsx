"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Package, ShoppingBag, Settings, Users, BarChart2 } from "lucide-react";

const MODULES = [
  { label: "MAGASIN",  desc: "Produits & stocks",   color: "bg-brand-800",   icon: Package },
  { label: "BOUTIQUE", desc: "Ventes & finance",     color: "bg-amber-500",   icon: ShoppingBag },
  { label: "STORE",    desc: "Commandes & réglages", color: "bg-emerald-700", icon: Settings },
  { label: "CRM",      desc: "Clients & fidélité",   color: "bg-indigo-700",  icon: Users },
  { label: "ADMIN",    desc: "Rapports & tendances", color: "bg-violet-700",  icon: BarChart2 },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
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
      const res  = await fetch("/api/admin/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Identifiants incorrects"); return; }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Impossible de se connecter. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left — Brand panel ── */}
      <div className="hidden lg:flex w-[45%] xl:w-[42%] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex-col justify-between p-12 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-500/10 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {/* Top */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            Panneau d'administration
          </span>
          <h2 className="font-display font-800 text-3xl xl:text-4xl text-white leading-tight mb-4">
            Gérez votre boutique<br />
            <span className="text-accent-300">en toute simplicité</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Produits, commandes, clients, finances — tout au même endroit, conçu pour le Togo.
          </p>
        </div>

        {/* Module badges */}
        <div className="relative z-10 space-y-2.5">
          {MODULES.map(({ label, desc, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/8 border border-white/10">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">{label}</p>
                <p className="text-white/50 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom spacer */}
        <div className="relative z-10 h-2" />
      </div>

      {/* ── Right — Form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">

          {/* Header design */}
          <div className="mb-10">
            <div className="w-1 h-10 rounded-full bg-accent-500 mb-6" />
            <h1 className="font-display font-800 text-4xl text-slate-900 leading-tight mb-2">
              Bienvenue
            </h1>
            <p className="text-slate-400 text-sm">
              Connectez-vous pour accéder à l'administration
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <span className="w-5 h-5 rounded-full border-2 border-red-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Adresse email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@togolese.net" required autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed">
            Première connexion ? Un compte super_admin<br />
            sera créé automatiquement avec ces identifiants.
          </p>
        </div>
      </div>
    </div>
  );
}
