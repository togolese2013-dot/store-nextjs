"use client";

import { useState } from "react";
import { Star, Gift, Phone, Loader2, ChevronRight, Copy, Check } from "lucide-react";
import Link from "next/link";

const POINTS_TO_FCFA = 10;
const MIN_REDEEM     = 100;

interface Balance {
  telephone:   string;
  points:      number;
  valeur_fcfa: number;
  can_redeem:  boolean;
  history:     { points: number; motif: string; created_at: string }[];
}

export default function FidelitePage() {
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState<Balance | null>(null);
  const [error,   setError]   = useState("");

  const [redeeming, setRedeeming] = useState(false);
  const [coupon,    setCoupon]    = useState<{ code: string; valeur_fcfa: number } | null>(null);
  const [copied,    setCopied]    = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setData(null);
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fidelite?telephone=${encodeURIComponent(phone.trim())}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  async function handleRedeem() {
    if (!data) return;
    setRedeeming(true);
    try {
      const res  = await fetch("/api/fidelite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "redeem", telephone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setCoupon({ code: json.coupon, valeur_fcfa: json.valeur_fcfa });
      // Refresh balance
      const r2 = await fetch(`/api/fidelite?telephone=${encodeURIComponent(phone.trim())}`);
      if (r2.ok) setData(await r2.json());
    } catch { setError("Erreur réseau."); }
    finally { setRedeeming(false); }
  }

  function copyCode() {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-brand-600" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-800 text-slate-900 mb-2">Programme Fidélité</h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Chaque achat vous rapporte des points. Échangez-les contre des réductions exclusives.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-800 text-slate-900 mb-4">Comment ça marche ?</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🛍️", title: "Commandez", desc: "100 FCFA = 1 point" },
              { icon: "⭐", title: "Cumulez",   desc: "Suivez votre solde ici" },
              { icon: "🎁", title: "Échangez",  desc: "100 pts = 1 000 FCFA" },
            ].map(s => (
              <div key={s.title} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{s.icon}</span>
                <p className="font-bold text-sm text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Check balance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-800 text-slate-900 mb-4">Consulter mon solde</h2>
          <form onSubmit={handleCheck} className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Votre numéro de téléphone"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-brand-500 outline-none transition-colors font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Voir mes points
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {/* Balance result */}
        {data && (
          <>
            <div className="bg-brand-900 rounded-2xl p-6 text-white">
              <p className="text-brand-200 text-sm mb-1">Votre solde</p>
              <div className="flex items-end gap-3 mb-4">
                <span className="font-display text-5xl font-800">{data.points}</span>
                <span className="text-brand-300 text-lg mb-1">points</span>
              </div>
              <p className="text-brand-200 text-sm">
                Valeur : <span className="text-white font-bold">{data.valeur_fcfa.toLocaleString()} FCFA</span>
                {data.points < MIN_REDEEM && (
                  <span className="ml-2 text-brand-300">
                    (encore {MIN_REDEEM - data.points} pts pour racheter)
                  </span>
                )}
              </p>

              {/* Progress bar */}
              <div className="mt-4 bg-brand-800 rounded-full h-2">
                <div
                  className="bg-accent-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (data.points / MIN_REDEEM) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-brand-300 mt-1">{Math.min(data.points, MIN_REDEEM)} / {MIN_REDEEM} pts pour un coupon</p>
            </div>

            {/* Redeem */}
            {data.can_redeem && !coupon && (
              <div className="bg-accent-50 border border-accent-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-accent-600" />
                  <h3 className="font-bold text-slate-900">Échanger mes points</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Vous pouvez échanger <strong>{Math.floor(data.points / MIN_REDEEM) * MIN_REDEEM} points</strong> contre un coupon de <strong>{(Math.floor(data.points / MIN_REDEEM) * MIN_REDEEM) * POINTS_TO_FCFA} FCFA</strong>.
                </p>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-600 transition-colors disabled:opacity-60"
                >
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Obtenir mon coupon
                </button>
              </div>
            )}

            {/* Coupon generated */}
            {coupon && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-slate-900 mb-1">Votre coupon est prêt !</p>
                <p className="text-sm text-slate-600 mb-4">Valeur : <strong>{coupon.valeur_fcfa.toLocaleString()} FCFA</strong> — utilisable à la prochaine commande.</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-display font-900 text-2xl tracking-wider text-brand-900">{coupon.code}</span>
                  <button onClick={copyCode} className="p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-400 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
            )}

            {/* History */}
            {data.history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Historique</h3>
                <div className="space-y-2">
                  {data.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-600">{h.motif || "Achat"}</p>
                      <span className={`font-bold text-sm ${h.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {h.points >= 0 ? "+" : ""}{h.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center">
          <Link href="/products" className="text-sm text-brand-700 hover:underline">
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
