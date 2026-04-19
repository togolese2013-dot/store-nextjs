"use client";

import { useState } from "react";
import { Users, Phone, User, Loader2, Copy, Check, Share2, Link2 } from "lucide-react";
import Link from "next/link";

interface ReferralResult {
  code:        string;
  nom:         string;
  uses_count:  number;
  already?:    boolean;
}

export default function ParrainagePage() {
  const [nom,     setNom]     = useState("");
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<ReferralResult | null>(null);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://store-nextjs-production.up.railway.app";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nom: nom.trim(), telephone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setResult(json);
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  }

  const referralLink = result ? `${siteUrl}/?ref=${result.code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `🎁 Je t'offre -10% sur Togolese Shop !\n\nUtilise mon lien : ${referralLink}\n\nCode parrain : ${result?.code}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noreferrer");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="font-display text-3xl font-800 text-slate-900 mb-2">Programme Parrainage</h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Invitez vos amis et ils profitent de −10% sur leur première commande.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-display font-800 text-slate-900 mb-4">Comment ça marche ?</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔗", title: "Partagez",   desc: "Votre lien unique à vos amis" },
              { icon: "🛍️", title: "Ils commandent", desc: "−10% sur leur 1re commande" },
              { icon: "🎁", title: "Vous gagnez", desc: "Points fidélité crédités" },
            ].map(s => (
              <div key={s.title} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{s.icon}</span>
                <p className="font-bold text-sm text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        {!result ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-display font-800 text-slate-900 mb-4">Obtenir mon lien de parrainage</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Votre prénom"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:border-brand-500 outline-none transition-colors font-sans"
                />
              </div>
              <div className="relative">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Générer mon lien
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Result */}
            <div className="bg-brand-900 rounded-2xl p-6 text-white">
              <p className="text-brand-200 text-sm mb-1">
                {result.already ? `Bon retour, ${result.nom} !` : `Bienvenue, ${result.nom} !`}
              </p>
              <p className="font-display font-800 text-2xl mb-1">Votre code parrain</p>
              <p className="font-display font-900 text-4xl tracking-widest text-accent-300 mb-4">{result.code}</p>
              <p className="text-brand-300 text-sm">
                {result.uses_count} personne{result.uses_count > 1 ? "s" : ""} parrainée{result.uses_count > 1 ? "s" : ""}
              </p>
            </div>

            {/* Share link */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h3 className="font-bold text-slate-900">Votre lien de parrainage</h3>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="flex-1 text-xs text-slate-600 font-mono truncate">{referralLink}</p>
                <button
                  onClick={copyLink}
                  className="shrink-0 p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
              </div>

              {/* Share via WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <Share2 className="w-4 h-4" />
                Partager sur WhatsApp
              </button>
            </div>

            <button
              onClick={() => { setResult(null); setNom(""); setPhone(""); }}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Utiliser un autre numéro
            </button>
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
