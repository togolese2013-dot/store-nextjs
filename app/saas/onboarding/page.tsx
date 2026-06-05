"use client";

/* ============================================================================
 *  app/saas/onboarding/page.tsx — 4-step Afrisika onboarding wizard
 *  Afrisika design language. Drop into your Next.js 15 / Tailwind 4 repo.
 *
 *  Flow:
 *    1. Votre commerce  → name, sector, country, city, WhatsApp
 *    2. Votre marque    → logo, accent color, tagline, slug
 *    3. Vos paiements   → toggle mobile money + cash + card
 *    4. C'est parti     → success screen + shareable link + next steps
 *
 *  Live preview on the right column reacts to every change.
 *
 *  Wire-up (to do after dropping in):
 *    - The "Créer ma boutique" CTA on step 3→4 currently just advances.
 *      Replace with: await fetch('/api/admin/auth/signup', {…})
 *    - The "Accéder à mon tableau de bord" CTA on step 4 redirects.
 *      Replace with: router.push('/admin') or window.location.href = '/admin'
 * ========================================================================== */

import { useState, useMemo, useEffect, Fragment } from "react";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, ArrowLeft, ShoppingCart, Upload, Check,
  Copy, Loader2,
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────────────── */

const SECTORS = [
  { id: "Mode",            emoji: "👗" },
  { id: "Alimentation",    emoji: "🥬" },
  { id: "Beauté",          emoji: "💄" },
  { id: "Électronique",    emoji: "📱" },
  { id: "Restaurant",      emoji: "🍽️" },
  { id: "Artisanat",       emoji: "🪡" },
  { id: "Multi-secteurs",  emoji: "🛍️" },
];

const COUNTRIES = [
  { v: "Togo",            label: "🇹🇬 Togo",            dial: "+228", currency: "XOF" },
  { v: "Sénégal",         label: "🇸🇳 Sénégal",         dial: "+221", currency: "XOF" },
  { v: "Côte d'Ivoire",   label: "🇨🇮 Côte d'Ivoire",   dial: "+225", currency: "XOF" },
  { v: "Ghana",           label: "🇬🇭 Ghana",           dial: "+233", currency: "GHS" },
  { v: "Bénin",           label: "🇧🇯 Bénin",           dial: "+229", currency: "XOF" },
  { v: "Mali",            label: "🇲🇱 Mali",            dial: "+223", currency: "XOF" },
  { v: "Burkina Faso",    label: "🇧🇫 Burkina Faso",    dial: "+226", currency: "XOF" },
];

const CURRENCIES = [
  { v: "XOF", label: "FCFA — Franc CFA (UEMOA)",  symbol: "FCFA" },
  { v: "GHS", label: "GHS — Cedi ghanéen",         symbol: "GH₵"  },
  { v: "NGN", label: "NGN — Naira nigérian",        symbol: "₦"    },
  { v: "EUR", label: "EUR — Euro",                  symbol: "€"    },
  { v: "USD", label: "USD — Dollar américain",      symbol: "$"    },
  { v: "GBP", label: "GBP — Livre sterling",        symbol: "£"    },
  { v: "XAF", label: "XAF — Franc CFA (CEMAC)",    symbol: "FCFA" },
  { v: "MAD", label: "MAD — Dirham marocain",       symbol: "DH"   },
];

const COLORS = ["#E07A2C", "#1F3D2E", "#2563EB", "#9B3A2F", "#5A3B7A", "#1E5C3E", "#14110E"];

type PaymentId = "wave" | "om" | "momo" | "flooz" | "cash" | "card";
const PAYMENTS: { id: PaymentId; name: string; meta: string; bg: string; fg?: string; tag: string }[] = [
  { id: "wave",  name: "Wave",                                meta: "Sénégal · Côte d'Ivoire · Mali · Burkina", bg: "#1A66FF", tag: "W"  },
  { id: "om",    name: "Orange Money",                        meta: "Toute l'Afrique de l'Ouest",              bg: "#FF7900", tag: "OM" },
  { id: "momo",  name: "MTN Mobile Money",                    meta: "Ghana · Bénin · Côte d'Ivoire · Togo",   bg: "#FFCC00", fg: "#1A1A1A", tag: "M" },
  { id: "flooz", name: "Flooz / Moov Money",                  meta: "Togo · Bénin · Burkina Faso",             bg: "#0066B3", tag: "F" },
  { id: "cash",  name: "Espèces (cash)",                      meta: "Paiement à la livraison ou en boutique",  bg: "#1F3D2E", tag: "€" },
  { id: "card",  name: "Carte bancaire Visa & Mastercard",    meta: "Paiements internationaux via Stripe",     bg: "#1A1F71", tag: "VC" },
];

const STEP_LABELS = ["Votre commerce", "Votre marque", "Vos paiements", "Votre compte", "C'est parti"];
const TOTAL = 5;
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function lighten(hex: string, amount = 30) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [name,     setName]     = useState("");
  const [sector,   setSector]   = useState("Mode");
  const [country,  setCountry]  = useState("Togo");
  const [city,     setCity]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [currency, setCurrency] = useState("XOF");

  // Auto-select currency when country changes
  useEffect(() => {
    const match = COUNTRIES.find(c => c.v === country);
    if (match) setCurrency(match.currency);
  }, [country]);

  // Step 2
  const [tagline, setTagline] = useState("");
  const [color,   setColor]   = useState(COLORS[0]);
  const [slug,    setSlugRaw] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Step 3
  const [plan,     setPlan]     = useState<"basic"|"pro">("basic");
  const [payments, setPayments] = useState<Set<PaymentId>>(new Set(["wave","om","momo","cash"]));

  // Step 4 — Account
  const [ownerNom,       setOwnerNom]       = useState("");
  const [ownerPhone,     setOwnerPhone]     = useState("");
  const [email,          setEmail]          = useState("");
  const [username,       setUsername]       = useState("");
  const [usernameTouched,setUsernameTouched]= useState(false);
  const [password,       setPassword]       = useState("");
  const [confirm,        setConfirm]        = useState("");
  const [acctErrors,     setAcctErrors]     = useState<{email?:string;username?:string;password?:string;confirm?:string}>({});

  // Submission
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Derived
  const displayName    = name.trim() || "Ma boutique";
  const displaySlug    = slug || slugify(name) || "ma-boutique";
  const displayCountry = COUNTRIES.find(c => c.v === country) ?? COUNTRIES[0];
  const displayCity    = city.trim() || "Lomé";
  const displayTagline = tagline.trim() || `${displayCity} · ${country}`;
  const accent2        = useMemo(() => lighten(color, 30), [color]);

  // Auto-update slug when name changes, unless user has manually edited it
  useEffect(() => {
    if (!slugTouched) setSlugRaw(slugify(name));
  }, [name, slugTouched]);

  // Auto-update username from slug, unless user has manually edited it
  useEffect(() => {
    if (!usernameTouched) setUsername(displaySlug.replace(/-/g, "_").slice(0, 30));
  }, [displaySlug, usernameTouched]);

  function setSlug(v: string) {
    setSlugTouched(true);
    setSlugRaw(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  function togglePayment(id: PaymentId) {
    setPayments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Navigation
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BACKEND}/api/admin/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_nom:       name.trim() || displayName,
          shop_slug:      displaySlug,
          shop_email:     email.trim(),
          shop_plan:      plan,
          shop_currency:  currency,
          admin_nom:      ownerNom.trim() || name.trim() || username,
          admin_username: username.toLowerCase(),
          admin_email:    email.trim(),
          admin_password: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Erreur serveur."); return; }
      setStep(5);
    } catch {
      setSubmitError("Impossible de joindre le serveur. Vérifiez que le backend tourne.");
    } finally {
      setSubmitting(false);
    }
  }

  const next = () => {
    if (step === 4) {
      const e: typeof acctErrors = {};
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email valide requis.";
      if (!username.trim() || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) e.username = "3–30 caractères, lettres/chiffres/underscore.";
      if (password.length < 8) e.password = "8 caractères minimum.";
      if (password !== confirm) e.confirm = "Les mots de passe ne correspondent pas.";
      if (Object.keys(e).length) { setAcctErrors(e); return; }
      handleSubmit();
    } else if (step === 5) {
      window.location.href = "/admin/login";
    } else if (step < TOTAL) {
      setStep(step + 1);
    }
  };
  const prev = () => step > 1 && setStep(step - 1);

  const isStep3Ready = payments.size > 0;
  const nextLabel = step === 4 ? "Créer ma boutique" : step === 5 ? "Accéder à mon tableau de bord" : "Continuer";

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen text-[#14110E] antialiased grid grid-rows-[auto_1fr]"
      style={{ background: "#FBF7F1", fontFamily: "var(--af-sans)", letterSpacing: "-0.005em" }}
    >
      {/* ═══ TOPBAR ═════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-9 py-5 border-b border-[#E8E1D4]"
        style={{ background: "rgba(251,247,241,0.85)", backdropFilter: "saturate(140%) blur(14px)" }}
      >
        <Link href="/saas" className="flex items-center gap-2.5">
          <span
            className="w-[30px] h-[30px] rounded-[9px] grid place-items-center"
            style={{
              background: "radial-gradient(120% 120% at 20% 20%, #F2A765 0%, #E07A2C 45%, #B8501A 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 10px -4px rgba(184,80,26,0.55)",
            }}
          >
            <ShoppingBag className="w-[14px] h-[14px] text-[#14110E]" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-[16px] tracking-tight">Afrisika</span>
        </Link>

        {/* Progress */}
        <nav className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
              <Fragment key={label}>
                <button
                  onClick={() => idx <= step && setStep(idx)}
                  className={`flex items-center gap-2.5 text-[13px] transition-colors ${
                    active ? "text-[#14110E] font-medium" : done ? "text-[#14110E]" : "text-[#8A8278]"
                  } ${idx <= step ? "cursor-pointer" : "cursor-default"}`}
                  disabled={idx > step}
                >
                  <span
                    className="w-[26px] h-[26px] rounded-full grid place-items-center text-[12px] font-medium font-mono transition-all"
                    style={
                      active
                        ? { background: "#14110E", color: "white", boxShadow: "0 6px 16px -6px rgba(20,17,14,0.5)" }
                        : done
                        ? { background: "#E07A2C", color: "white" }
                        : { background: "#F0EBE0", color: "#8A8278" }
                    }
                  >
                    {done ? <Check className="w-3 h-3" strokeWidth={2.5} /> : idx}
                  </span>
                  <span className="hidden md:inline">{label}</span>
                </button>
                {idx < STEP_LABELS.length && (
                  <span className="w-6 sm:w-10 h-px" style={{ background: done ? "#E07A2C" : "#E8E1D4" }} />
                )}
              </Fragment>
            );
          })}
        </nav>

        <Link href="/saas" className="text-[13px] text-[#6B635B] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors">
          Quitter
        </Link>
      </header>

      {/* ═══ MAIN — split ═══════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 min-h-0">

        {/* LEFT — form */}
        <section className="px-6 sm:px-12 lg:px-14 py-10 lg:py-16 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-[480px]">

            {/* STEP 1 — BUSINESS */}
            {step === 1 && (
              <>
                <Eyebrow>Étape 1 sur 5</Eyebrow>
                <H1>Parlez-nous de <Em>votre commerce.</Em></H1>
                <Lede>Quelques infos pour configurer votre boutique. Vous pourrez tout modifier plus tard.</Lede>

                <Field label="Nom du commerce">
                  <Input value={name} onChange={(v) => setName(v)} placeholder="ex : Maison Diallo" autoFocus />
                </Field>

                <Field label="Secteur d'activité">
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSector(s.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13.5px] border transition-all ${
                          sector === s.id
                            ? "bg-[#14110E] border-[#14110E] text-white"
                            : "bg-white border-[#E8E1D4] text-[#2A2522] hover:border-[#14110E]/20"
                        }`}
                      >
                        <span className="text-[14px]">{s.emoji}</span>
                        {s.id}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Pays">
                    <Select value={country} onChange={setCountry}>
                      {COUNTRIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Ville">
                    <Input value={city} onChange={setCity} placeholder="ex : Lomé" />
                  </Field>
                </div>

                <Field label="Devise" hint="Utilisée pour les prix et les paiements de votre boutique.">
                  <Select value={currency} onChange={setCurrency}>
                    {CURRENCIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                  </Select>
                </Field>

                <Field label="Numéro WhatsApp" hint="Vos clients pourront vous contacter directement.">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#6B635B] font-mono pointer-events-none">
                      {displayCountry.dial}
                    </span>
                    <input
                      className="w-full h-[46px] pl-16 pr-3.5 rounded-[12px] bg-white border border-[#E8E1D4] text-[14.5px] outline-none transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15 placeholder:text-[#A8A097]"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="90 00 00 00"
                    />
                  </div>
                </Field>
              </>
            )}

            {/* STEP 2 — BRAND */}
            {step === 2 && (
              <>
                <Eyebrow>Étape 2 sur 5</Eyebrow>
                <H1>Donnez vie à <Em>votre marque.</Em></H1>
                <Lede>Personnalisez l'apparence de votre boutique. Tout reste modifiable plus tard.</Lede>

                <Field label="Logo (optionnel)">
                  <label className="flex items-center gap-3.5 p-5 rounded-[14px] bg-white border-[1.5px] border-dashed border-[#D6CCBA] cursor-pointer hover:border-[#E07A2C] hover:bg-[#FCEBD6]/40 transition-all">
                    <div className="w-14 h-14 rounded-xl bg-[#FCEBD6] text-[#B8501A] grid place-items-center shrink-0">
                      <Upload className="w-5 h-5" strokeWidth={1.7} />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#14110E]">Téléversez votre logo</div>
                      <div className="text-[12.5px] text-[#6B635B] mt-0.5">PNG ou JPG · max 2 Mo · carré recommandé</div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </Field>

                <Field label="Couleur d'accent">
                  <div className="flex flex-wrap gap-2.5">
                    {COLORS.map((c) => {
                      const on = c === color;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          aria-label={`Couleur ${c}`}
                          className="w-11 h-11 rounded-xl relative transition-transform hover:scale-105 grid place-items-center"
                          style={{
                            background: c,
                            color: c,
                            boxShadow: on
                              ? `0 0 0 3px white, 0 0 0 5px ${c}`
                              : "0 1px 2px rgba(20,17,14,0.06)",
                          }}
                        >
                          {on && (
                            <Check
                              className="w-4 h-4 text-white"
                              strokeWidth={3}
                              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Slogan court (optionnel)" hint="Une phrase qui décrit votre boutique en 60 caractères max.">
                  <Input value={tagline} onChange={setTagline} placeholder="ex : L'artisanat ouest-africain." maxLength={60} />
                </Field>

                <Field label="Adresse de votre boutique" hint="Vous pourrez connecter un nom de domaine personnalisé plus tard.">
                  <div className="relative">
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="ma-boutique"
                      className="w-full h-[46px] pl-3.5 pr-[100px] rounded-[12px] bg-white border border-[#E8E1D4] text-[14.5px] outline-none transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15 font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13.5px] text-[#8A8278] font-mono pointer-events-none">
                      .afrisika.app
                    </span>
                  </div>
                </Field>
              </>
            )}

            {/* STEP 3 — PLAN + PAYMENTS */}
            {step === 3 && (
              <>
                <Eyebrow>Étape 3 sur 5</Eyebrow>
                <H1>Choisissez votre <Em>plan d'essai.</Em></H1>
                <Lede>14 jours gratuits · Changez à tout moment · Aucune carte requise.</Lede>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {([
                    { id: "basic", label: "Starter", price: "9 000 F", period: "/ mois", feats: ["Boutique & caisse", "Gestion des stocks", "2 équipiers"] },
                    { id: "pro",   label: "Business", price: "25 000 F", period: "/ mois", feats: ["Tous les espaces", "E-commerce & CRM", "5 équipiers"] },
                  ] as const).map(p => (
                    <button key={p.id} type="button" onClick={() => setPlan(p.id)}
                      className={`flex flex-col gap-1 p-4 rounded-[14px] border-2 text-left transition-all ${
                        plan === p.id ? "border-[#E07A2C] bg-[#FFF8EF]" : "border-[#E8E1D4] bg-white hover:border-[#14110E]/20"
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[13px] font-700 ${plan === p.id ? "text-[#C9601E]" : "text-[#14110E]"}`} style={{fontWeight:700}}>{p.label}</span>
                        {plan === p.id && <span className="text-[10px] font-600 text-[#C9601E] bg-[#FDDCBA] px-2 py-0.5 rounded-full" style={{fontWeight:600}}>Sélectionné</span>}
                      </div>
                      <div className="text-[15px] font-700 text-[#14110E]" style={{fontWeight:700}}>{p.price} <span className="text-[12px] font-400 text-[#8A8278]">{p.period}</span></div>
                      <ul className="mt-2 flex flex-col gap-1">
                        {p.feats.map(f => <li key={f} className="text-[12px] text-[#6B635B] flex items-center gap-1.5"><Check size={11} className="text-[#2D6A4F] shrink-0" />{f}</li>)}
                      </ul>
                    </button>
                  ))}
                </div>

                <p className="text-[12px] text-[#8A8278] mb-4">Modes de paiement acceptés · configurable après l'inscription.</p>

                <div className="flex flex-col gap-2.5">
                  {PAYMENTS.map((p) => {
                    const on = payments.has(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePayment(p.id)}
                        className={`flex items-center gap-3.5 p-3.5 rounded-[14px] border transition-all text-left ${
                          on ? "border-[#E07A2C] bg-[#FFF8EF]" : "border-[#E8E1D4] bg-white hover:border-[#14110E]/18"
                        }`}
                      >
                        <div
                          className="w-[38px] h-[38px] rounded-[10px] grid place-items-center font-bold text-[13px] tracking-tight shrink-0"
                          style={{ background: p.bg, color: p.fg ?? "white" }}
                        >
                          {p.tag}
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-medium text-[#14110E]">{p.name}</div>
                          <div className="text-[12.5px] text-[#6B635B] mt-0.5">{p.meta}</div>
                        </div>
                        <div
                          className="w-[38px] h-[22px] rounded-full relative transition-colors shrink-0"
                          style={{ background: on ? "#14110E" : "#E8E1D4" }}
                        >
                          <span
                            className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform"
                            style={{
                              transform: on ? "translateX(18px)" : "translateX(2px)",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* STEP 4 — ACCOUNT */}
            {step === 4 && (
              <>
                <Eyebrow>Étape 4 sur 5</Eyebrow>
                <H1>Créez votre <Em>compte administrateur.</Em></H1>
                <Lede>Informations du propriétaire et identifiants de connexion.</Lede>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Votre nom *">
                    <Input
                      value={ownerNom}
                      onChange={v => setOwnerNom(v)}
                      placeholder="Kofi Mensah"
                    />
                  </Field>
                  <Field label="Téléphone">
                    <Input
                      type="tel"
                      value={ownerPhone}
                      onChange={v => setOwnerPhone(v)}
                      placeholder="+228 90 00 00 00"
                    />
                  </Field>
                </div>

                <Field label="Email *" hint="Votre email de connexion.">
                  <Input
                    type="email" value={email}
                    onChange={v => { setEmail(v); setAcctErrors(e => ({ ...e, email: undefined })); }}
                    placeholder="vous@email.com"
                  />
                  {acctErrors.email && <p className="text-[12px] text-red-500 mt-1">{acctErrors.email}</p>}
                </Field>

                <Field label="Nom d'utilisateur *" hint="3–30 caractères, lettres/chiffres/underscore.">
                  <Input
                    value={username}
                    onChange={v => {
                      setUsernameTouched(true);
                      setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setAcctErrors(e => ({ ...e, username: undefined }));
                    }}
                    placeholder="mon_compte"
                  />
                  {acctErrors.username && <p className="text-[12px] text-red-500 mt-1">{acctErrors.username}</p>}
                </Field>

                <Field label="Mot de passe *">
                  <Input
                    type="password" value={password}
                    onChange={v => { setPassword(v); setAcctErrors(e => ({ ...e, password: undefined })); }}
                    placeholder="8 caractères minimum"
                  />
                  {acctErrors.password && <p className="text-[12px] text-red-500 mt-1">{acctErrors.password}</p>}
                </Field>

                <Field label="Confirmer le mot de passe *">
                  <Input
                    type="password" value={confirm}
                    onChange={v => { setConfirm(v); setAcctErrors(e => ({ ...e, confirm: undefined })); }}
                    placeholder="Répétez le mot de passe"
                  />
                  {acctErrors.confirm && <p className="text-[12px] text-red-500 mt-1">{acctErrors.confirm}</p>}
                </Field>

                {submitError && (
                  <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-[13px] text-red-700">
                    {submitError}
                  </div>
                )}
              </>
            )}

            {/* STEP 5 — SUCCESS */}
            {step === 5 && (
              <div className="text-center">
                <div
                  className="w-[84px] h-[84px] rounded-[24px] mx-auto mb-7 grid place-items-center text-white"
                  style={{
                    background: "linear-gradient(180deg, #ED8A38, #C9601E)",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 24px 60px -20px rgba(184,80,26,0.55)",
                  }}
                >
                  <Check className="w-10 h-10" strokeWidth={2.5} />
                </div>
                <H1>Bienvenue, <Em>{displayName} est en ligne.</Em></H1>
                <Lede className="mx-auto">Votre boutique en ligne est créée. Partagez le lien ci-dessous pour recevoir vos premières commandes.</Lede>

                <div className="bg-white border border-[#E8E1D4] rounded-[14px] p-4 flex items-center gap-3 my-7 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#6B635B] font-medium">Votre boutique</div>
                    <div className="font-mono text-[13.5px] text-[#14110E] mt-0.5 truncate">{displaySlug}.afrisika.app</div>
                  </div>
                  <CopyButton text={`${displaySlug}.afrisika.app`} />
                </div>

                <div className="text-left bg-[#F6EFE2] border border-[#E8E1D4] rounded-[14px] p-5 mb-6">
                  <h4 className="text-[14px] font-medium mb-3 tracking-tight">Vos prochaines étapes</h4>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {[
                      { t: "Créer votre boutique en ligne",                 done: true },
                      { t: "Ajoutez vos 3 premiers produits",                done: false },
                      { t: "Configurez vos zones de livraison",              done: false },
                      { t: "Connectez votre compte mobile money",            done: false },
                      { t: "Invitez votre équipe (commerciaux, caissiers)",  done: false },
                    ].map((s) => (
                      <li
                        key={s.t}
                        className={`text-[13.5px] flex items-start gap-2 ${s.done ? "text-[#6B635B] line-through" : "text-[#2A2522]"}`}
                      >
                        <span className="text-[#B8501A] text-[14px] leading-none mt-0.5 shrink-0">
                          {s.done ? "●" : "○"}
                        </span>
                        {s.t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* NAV */}
            <div className="flex items-center justify-between gap-4 mt-8">
              <button
                onClick={prev}
                className="inline-flex items-center gap-2 h-[46px] px-5 rounded-full text-[14.5px] font-medium text-[#14110E] bg-transparent border border-[#E8E1D4] hover:bg-white hover:border-[#14110E]/20 transition-all"
                style={{ visibility: step > 1 && step < 5 ? "visible" : "hidden" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Précédent
              </button>

              <div className="flex items-center gap-5 ml-auto">
                {step > 1 && step < 4 && (
                  <button
                    onClick={() => setStep(s => Math.min(s + 1, TOTAL))}
                    className="text-[13.5px] text-[#6B635B] hover:text-[#14110E] hover:underline underline-offset-[3px] transition-colors"
                  >
                    Passer cette étape
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={submitting || (step === 3 && !isStep3Ready)}
                  className="inline-flex items-center gap-2 h-[46px] px-5 rounded-full text-[14.5px] font-medium text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    background: submitting ? "#2A2522" : "#14110E",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -8px rgba(20,17,14,0.5)",
                  }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Création en cours…" : nextLabel}
                  {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — live preview */}
        <aside
          className="hidden lg:flex relative overflow-hidden border-l border-[#E8E1D4] items-center justify-center p-12"
          style={{ background: "linear-gradient(180deg, #F6EFE2 0%, #FBF7F1 100%)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(40% 40% at 80% 0%, rgba(224,122,44,0.10), transparent 70%), radial-gradient(40% 40% at 0% 100%, rgba(31,61,46,0.06), transparent 70%)",
            }}
          />

          <div className="relative z-10 w-full max-w-[460px]">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[#8A8278] font-medium mb-4">
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#2D8A5F]">
                <span className="absolute -inset-1 rounded-full bg-[#2D8A5F] opacity-40 animate-ping" />
              </span>
              Aperçu en direct
            </div>

            {/* Phone frame */}
            <div
              className="w-[320px] mx-auto bg-[#14110E] rounded-[36px] p-[10px]"
              style={{ boxShadow: "0 30px 80px -20px rgba(20,17,14,0.35), 0 0 0 1px rgba(20,17,14,0.05)" }}
            >
              <div className="bg-white rounded-[28px] overflow-hidden aspect-[1/1.85] flex flex-col">
                {/* Header */}
                <div className="px-[18px] pt-[14px] pb-[12px] text-white transition-colors" style={{ background: color }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className="w-7 h-7 rounded-lg bg-white grid place-items-center text-[18px] italic"
                      style={{ fontFamily: "var(--af-serif)", color }}
                    >
                      {displayName[0]?.toUpperCase() ?? "M"}
                    </div>
                    <ShoppingCart className="w-4 h-4 opacity-70" strokeWidth={1.7} />
                  </div>
                  <div className="text-[15px] font-semibold tracking-tight mb-px">{displayName}</div>
                  <div className="text-[11px] text-white/70 tracking-wide">{displayTagline}</div>
                </div>

                {/* Body */}
                <div className="px-[18px] py-4 flex-1 bg-[#FBF7F1]">
                  <div className="flex items-baseline justify-between mb-2.5">
                    <div className="text-[13px] font-medium text-[#14110E]">Best-sellers</div>
                    <div className="text-[11px] font-medium" style={{ color }}>Voir tout →</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { n: "Pagne wax",   p: "18 000 F", c: color,     c2: accent2, letter: "P" },
                      { n: "Bogolan",     p: "12 000 F", c: "#3a2f25", c2: "#3a2f25cc", letter: "B" },
                      { n: "Karité 250g", p: "4 500 F",  c: "#F2A765", c2: "#E07A2C", letter: "K" },
                      { n: "Bissap 500g", p: "1 500 F",  c: "#7a3a2a", c2: "#7a3a2acc", letter: "B" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-[10px] p-2 border border-[#F0EBE0]">
                        <div
                          className="aspect-[1/0.85] rounded-md grid place-items-center text-[22px] italic text-white/60"
                          style={{
                            background: `linear-gradient(135deg, ${item.c}, ${item.c2})`,
                            fontFamily: "var(--af-serif)",
                          }}
                        >
                          {item.letter}
                        </div>
                        <div className="text-[11px] font-medium text-[#14110E] mt-1.5">{item.n}</div>
                        <div className="text-[10.5px] font-medium mt-px" style={{ color }}>{item.p}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer — payment tags */}
                <div className="bg-white border-t border-[#F0EBE0] px-3 py-2 flex gap-1.5 flex-wrap">
                  {PAYMENTS.map((p) => {
                    const on = payments.has(p.id);
                    const label = p.id === "card" ? "Carte" : p.id === "om" ? "Orange Money" : p.id === "momo" ? "MoMo" : p.name.split(" ")[0];
                    return (
                      <span
                        key={p.id}
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium border"
                        style={
                          on
                            ? { background: color, color: "white", borderColor: color }
                            : { background: "#FBF7F1", color: "#6B635B", borderColor: "#E8E1D4" }
                        }
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-center mt-5 text-[12px] text-[#8A8278]">
              <span className="font-mono text-[#14110E]">{displaySlug}.afrisika.app</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Small bits ───────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#B8501A] mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#E07A2C]" />
      {children}
    </span>
  );
}
function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-[34px] sm:text-[42px] lg:text-[44px] font-medium tracking-[-0.03em] leading-[1.02] mb-3">{children}</h1>;
}
function Em({ children }: { children: React.ReactNode }) {
  return <span className="font-normal italic" style={{ fontFamily: "var(--af-serif)" }}>{children}</span>;
}
function Lede({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[15.5px] text-[#6B635B] leading-[1.55] mb-8 max-w-[48ch] ${className}`}>{children}</p>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="block mb-[18px]">
      <span className="block text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B635B] mb-2">{label}</span>
      {children}
      {hint && <p className="text-[12px] text-[#8A8278] mt-1.5">{hint}</p>}
    </div>
  );
}
function Input({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[46px] px-3.5 rounded-[12px] bg-white border border-[#E8E1D4] text-[14.5px] text-[#14110E] outline-none transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15 placeholder:text-[#A8A097]"
    />
  );
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[46px] pl-3.5 pr-10 rounded-[12px] bg-white border border-[#E8E1D4] text-[14.5px] text-[#14110E] outline-none transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15 appearance-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B635B' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
      }}
    >
      {children}
    </select>
  );
}
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E1D4] text-[12.5px] font-medium hover:bg-[#FBF7F1] transition-colors shrink-0"
    >
      {copied ? <><Check className="w-3 h-3" strokeWidth={2.5} /> Copié</> : <><Copy className="w-3 h-3" strokeWidth={1.7} /> Copier</>}
    </button>
  );
}
