"use client";

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";

const COUPON = "PARRAIN10";
const DISCOUNT = "−10%";

export default function ReferralBanner() {
  const [parrain, setParrain] = useState<{ code: string; nom: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check cookie for referral
    const match = document.cookie.match(/ts_ref=([^;]+)/);
    if (!match) return;
    const code = decodeURIComponent(match[1]);

    fetch(`/api/referrals?code=${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.nom) {
          setParrain({ code, nom: data.nom });
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !parrain) return null;

  return (
    <div className="bg-accent-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold flex-1 justify-center">
        <Gift className="w-4 h-4 shrink-0" />
        <span>
          <strong>{parrain.nom}</strong> vous offre {DISCOUNT} sur votre 1re commande — code{" "}
          <span className="font-900 tracking-wider bg-white/20 px-1.5 py-0.5 rounded">{COUPON}</span>
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Fermer"
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
