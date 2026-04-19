"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, MessageCircle, Package, Tag, Star, Save, CheckCircle } from "lucide-react";

interface Prefs {
  commandes:  boolean;
  promos:     boolean;
  fidelite:   boolean;
  newsletter: boolean;
}

const DEFAULT_PREFS: Prefs = {
  commandes:  true,
  promos:     true,
  fidelite:   true,
  newsletter: false,
};

const NOTIF_OPTIONS = [
  {
    key:   "commandes" as keyof Prefs,
    icon:  Package,
    label: "Suivi de commandes",
    desc:  "Confirmation, expédition et livraison de vos commandes.",
    color: "text-blue-600",
    bg:    "bg-blue-50",
  },
  {
    key:   "promos" as keyof Prefs,
    icon:  Tag,
    label: "Promotions & offres",
    desc:  "Bons plans, codes promo et soldes exclusives.",
    color: "text-accent-600",
    bg:    "bg-accent-50",
  },
  {
    key:   "fidelite" as keyof Prefs,
    icon:  Star,
    label: "Programme Fidélité",
    desc:  "Nouveau solde de points, récompenses disponibles.",
    color: "text-amber-600",
    bg:    "bg-amber-50",
  },
  {
    key:   "newsletter" as keyof Prefs,
    icon:  Bell,
    label: "Newsletter",
    desc:  "Actualités et nouveautés du shop.",
    color: "text-purple-600",
    bg:    "bg-purple-50",
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs]   = useState<Prefs>(DEFAULT_PREFS);
  const [phone, setPhone]   = useState("");
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem("ts_notif_prefs");
      if (rawPrefs) setPrefs(JSON.parse(rawPrefs));
      const rawProfil = localStorage.getItem("ts_profil");
      if (rawProfil) setPhone(JSON.parse(rawProfil).telephone ?? "");
    } catch { /* ignore */ }
  }, []);

  function toggle(key: keyof Prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("ts_notif_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "22890000000";
  const activeLabels = NOTIF_OPTIONS
    .filter(o => prefs[o.key])
    .map(o => o.label)
    .join(", ");

  const waMsg = `Bonjour, je souhaite recevoir les notifications WhatsApp pour: ${activeLabels}. Mon numéro: ${phone}`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-800 text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-400">Préférences de communication</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* WhatsApp info banner */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" />
          <p className="text-sm text-slate-700">
            Nos notifications sont envoyées via <strong>WhatsApp</strong>.
            Activez les options ci-dessous puis abonnez-vous.
          </p>
        </div>

        {/* Toggle options */}
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Je veux recevoir</p>
            {NOTIF_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${i < NOTIF_OPTIONS.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${opt.bg} ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {/* Toggle switch */}
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${prefs[opt.key] ? "bg-brand-600" : "bg-slate-200"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[opt.key] ? "translate-x-5" : "translate-x-0"}`} />
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={prefs[opt.key]}
                      onChange={() => toggle(opt.key)}
                    />
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 transition-all"
            >
              {saved
                ? <><CheckCircle className="w-4 h-4" /> Préférences enregistrées !</>
                : <><Save className="w-4 h-4" /> Enregistrer</>
              }
            </button>

            {/* WhatsApp subscribe button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1fba58] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              S&apos;abonner via WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
