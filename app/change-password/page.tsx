"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, KeyRound, ShieldCheck } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 transition-colors bg-white";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (next !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (next === current) {
      setError("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors du changement."); return; }
      setSuccess(true);
      const meRes = await fetch("/api/admin/auth/me");
      const me = (await meRes.ok ? meRes.json() : {}) as { role?: string; poste?: string };
      const dest = (me.role === "staff" && me.poste === "Livreur") || me.role === "livreur" ? "/livreur" : "/admin";
      setTimeout(() => { window.location.href = dest; }, 1200);
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-8 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Changer votre mot de passe</h1>
            <p className="text-white/60 text-sm">
              Pour sécuriser votre compte, vous devez définir un mot de passe personnel avant de continuer.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-bold text-slate-900 text-lg mb-1">Mot de passe mis à jour !</p>
                <p className="text-slate-400 text-sm">Redirection en cours…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Mot de passe temporaire
                  </label>
                  <div className="relative">
                    <input
                      type={showCur ? "text" : "password"}
                      value={current}
                      onChange={e => setCurrent(e.target.value)}
                      className={inputCls + " pr-11"}
                      placeholder="Mot de passe actuel"
                      required
                      autoFocus
                      autoComplete="current-password"
                      name="current-password"
                    />
                    <button type="button" onClick={() => setShowCur(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                      {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Nouveau mot de passe <span className="text-slate-400 font-normal">(min. 8 caractères)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={next}
                      onChange={e => setNext(e.target.value)}
                      className={inputCls + " pr-11"}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      name="new-password"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {next.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          next.length >= i * 3
                            ? i <= 1 ? "bg-red-400"
                            : i <= 2 ? "bg-orange-400"
                            : i <= 3 ? "bg-yellow-400"
                            : "bg-green-500"
                            : "bg-slate-200"
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={inputCls + (confirm && confirm !== next ? " border-red-300" : "")}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    name="confirm-password"
                  />
                  {confirm && confirm !== next && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !current || !next || !confirm}
                  className="w-full py-3 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
                    : <><ShieldCheck className="w-4 h-4" /> Définir mon mot de passe</>
                  }
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Togolese Shop · Espace sécurisé
        </p>
      </div>
    </div>
  );
}
