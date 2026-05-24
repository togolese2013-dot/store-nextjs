"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Building2, User, Check, ArrowRight, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Globe,
} from "lucide-react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface ShopForm {
  nom:   string;
  slug:  string;
  email: string;
  plan:  "free" | "basic" | "pro";
}

interface AdminForm {
  nom:      string;
  username: string;
  email:    string;
  password: string;
  confirm:  string;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

/* ─── Helpers ────────────────────────────────────────────────────────── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/* ─── Step indicators ────────────────────────────────────────────────── */

function Steps({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Boutique",    icon: Building2 },
    { n: 2, label: "Administrateur", icon: User },
    { n: 3, label: "Confirmé",    icon: Check },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            current === s.n
              ? "bg-blue-600 text-white"
              : current > s.n
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-400"
          }`}>
            {current > s.n
              ? <Check className="w-3.5 h-3.5" />
              : <s.icon className="w-3.5 h-3.5" />
            }
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.n}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 sm:w-10 ${current > s.n ? "bg-emerald-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────── */

function Field({
  label, id, type = "text", value, onChange, placeholder, hint, error, suffix, children,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  hint?: React.ReactNode; error?: string; suffix?: string; children?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id} type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
          } ${suffix ? "pr-28" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono bg-gray-50 px-2 py-1 rounded">
            {suffix}
          </span>
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

/* ─── Step 1 — Boutique ─────────────────────────────────────────────── */

function Step1({
  form, setForm, slugStatus, onNext,
}: {
  form: ShopForm;
  setForm: React.Dispatch<React.SetStateAction<ShopForm>>;
  slugStatus: SlugStatus;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<ShopForm>>({});

  function validate() {
    const e: Partial<ShopForm> = {};
    if (!form.nom.trim())   e.nom  = "Nom de boutique requis.";
    if (!form.slug.trim())  e.slug = "Slug requis.";
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(form.slug)) e.slug = "3–50 caractères, lettres minuscules et tirets.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email valide requis.";
    if (slugStatus === "taken") e.slug = "Ce slug est déjà pris.";
    if (slugStatus === "checking") e.slug = "Vérification en cours...";
    setErrors(e);
    return !Object.keys(e).length;
  }

  const PLANS = [
    { id: "free",  label: "Gratuit",  desc: "20 produits, 50 cmd/mois" },
    { id: "basic", label: "Pro",      desc: "Illimité, WhatsApp CRM" },
    { id: "pro",   label: "Business", desc: "Multi-admin, API" },
  ] as const;

  return (
    <div className="space-y-5">
      <Field
        label="Nom de la boutique *" id="shop_nom"
        value={form.nom} placeholder="Ma Super Boutique"
        onChange={v => {
          setForm(f => ({ ...f, nom: v, slug: slugify(v) }));
          setErrors(e => ({ ...e, nom: undefined }));
        }}
        error={errors.nom}
      />

      <div>
        <label htmlFor="shop_slug" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse de votre boutique *
        </label>
        <div className="relative">
          <input
            id="shop_slug" type="text"
            value={form.slug}
            onChange={e => {
              setForm(f => ({ ...f, slug: e.target.value.toLowerCase() }));
              setErrors(er => ({ ...er, slug: undefined }));
            }}
            placeholder="ma-boutique"
            className={`w-full border rounded-xl px-4 py-3 text-sm pr-40 focus:outline-none focus:ring-2 transition-all ${
              errors.slug ? "border-red-300 focus:ring-red-200"
              : slugStatus === "available" ? "border-emerald-300 focus:ring-emerald-200"
              : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded font-mono">
            .shopsaas.com
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {slugStatus === "checking" && <><Loader2 className="w-3 h-3 animate-spin text-blue-500" /><span className="text-gray-400">Vérification...</span></>}
          {slugStatus === "available" && <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">Disponible !</span></>}
          {slugStatus === "taken" && <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-red-500">Ce slug est déjà pris.</span></>}
          {slugStatus === "invalid" && <><AlertCircle className="w-3 h-3 text-amber-500" /><span className="text-amber-600">Format invalide (lettres, chiffres, tirets).</span></>}
          {slugStatus === "idle" && <span className="text-gray-400">URL de votre boutique : <strong>{form.slug || "votre-slug"}</strong>.shopsaas.com</span>}
        </div>
        {errors.slug && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.slug}</p>}
      </div>

      <Field
        label="Email de contact *" id="shop_email"
        type="email" value={form.email}
        placeholder="contact@maboutique.com"
        onChange={v => { setForm(f => ({ ...f, email: v })); setErrors(e => ({ ...e, email: undefined })); }}
        error={errors.email}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map(p => (
            <button
              key={p.id} type="button"
              onClick={() => setForm(f => ({ ...f, plan: p.id }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.plan === p.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm text-gray-900">{p.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => validate() && onNext()}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Continuer <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Step 2 — Admin ─────────────────────────────────────────────────── */

function Step2({
  form, setForm, onNext, onBack, loading, error,
}: {
  form: AdminForm;
  setForm: React.Dispatch<React.SetStateAction<AdminForm>>;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  error: string;
}) {
  const [errors, setErrors] = useState<Partial<AdminForm>>({});
  const [showPwd, setShowPwd] = useState(false);

  function validate() {
    const e: Partial<AdminForm> = {};
    if (!form.nom.trim())      e.nom      = "Nom requis.";
    if (!form.username.trim()) e.username = "Nom d'utilisateur requis.";
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) e.username = "3–30 caractères, lettres/chiffres/underscore.";
    if (form.password.length < 8) e.password = "8 caractères minimum.";
    if (form.password !== form.confirm) e.confirm = "Les mots de passe ne correspondent pas.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  return (
    <div className="space-y-5">
      <Field
        label="Votre nom complet *" id="admin_nom"
        value={form.nom} placeholder="Jean Dupont"
        onChange={v => { setForm(f => ({ ...f, nom: v })); setErrors(e => ({ ...e, nom: undefined })); }}
        error={errors.nom}
      />
      <Field
        label="Nom d'utilisateur *" id="admin_username"
        value={form.username} placeholder="jdupont"
        onChange={v => { setForm(f => ({ ...f, username: v })); setErrors(e => ({ ...e, username: undefined })); }}
        error={errors.username}
        hint="Sert à vous connecter à l'admin."
      />
      <Field
        label="Email (optionnel)" id="admin_email"
        type="email" value={form.email} placeholder="vous@email.com"
        onChange={v => setForm(f => ({ ...f, email: v }))}
      />
      <div>
        <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
        <div className="relative">
          <input
            id="admin_password"
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: undefined })); }}
            placeholder="8 caractères minimum"
            className={`w-full border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.password ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
            }`}
          />
          <button
            type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
      </div>
      <Field
        label="Confirmer le mot de passe *" id="admin_confirm"
        type={showPwd ? "text" : "password"}
        value={form.confirm} placeholder="Répétez le mot de passe"
        onChange={v => { setForm(f => ({ ...f, confirm: v })); setErrors(e => ({ ...e, confirm: undefined })); }}
        error={errors.confirm}
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:border-gray-300 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <button type="button"
          onClick={() => validate() && onNext()}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : <>Créer ma boutique <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3 — Success ───────────────────────────────────────────────── */

function Step3({ slug }: { slug: string }) {
  const loginUrl = `/admin/login`;

  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Boutique créée !</h2>
      <p className="text-gray-500 mb-6">
        Votre boutique <strong className="text-gray-900">{slug}.shopsaas.com</strong> est prête.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="text-gray-500">Boutique client :</span>
          <span className="font-mono text-blue-600 text-xs">{slug}.shopsaas.com</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-blue-500" />
          <span className="text-gray-500">Panel admin :</span>
          <span className="font-mono text-blue-600 text-xs">{slug}.shopsaas.com/admin</span>
        </div>
      </div>

      <Link
        href={loginUrl}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        Accéder à mon admin <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-xs text-gray-400 mt-4">
        Utilisez le nom d&apos;utilisateur et le mot de passe que vous venez de choisir.
      </p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [shopForm, setShopForm] = useState<ShopForm>({ nom: "", slug: "", email: "", plan: "free" });
  const [adminForm, setAdminForm] = useState<AdminForm>({ nom: "", username: "", email: "", password: "", confirm: "" });
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  /* ── Slug live check ─────────────────────────────────────────────── */
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) { setSlugStatus("idle"); return; }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) { setSlugStatus("invalid"); return; }
    setSlugStatus("checking");
    try {
      const res = await fetch(`${BACKEND}/api/admin/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSlugStatus(data.available ? "available" : "taken");
    } catch {
      setSlugStatus("idle");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkSlug(shopForm.slug), 500);
    return () => clearTimeout(t);
  }, [shopForm.slug, checkSlug]);

  /* ── Submit ──────────────────────────────────────────────────────── */
  async function handleSubmit() {
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BACKEND}/api/admin/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_nom:       shopForm.nom,
          shop_slug:      shopForm.slug,
          shop_email:     shopForm.email,
          shop_plan:      shopForm.plan,
          admin_nom:      adminForm.nom,
          admin_username: adminForm.username,
          admin_email:    adminForm.email,
          admin_password: adminForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Erreur serveur."); return; }
      setCreatedSlug(shopForm.slug);
      setStep(3);
    } catch {
      setSubmitError("Impossible de joindre le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/saas" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base">ShopSaaS</span>
          </Link>
          <Link href="/admin/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Déjà un compte ? Connexion
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {step < 3 && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {step === 1 ? "Créez votre boutique" : "Votre compte administrateur"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 1
                  ? "Configurez votre boutique en quelques secondes."
                  : "Ce compte vous permet de gérer votre boutique."}
              </p>
            </div>
          )}

          <Steps current={step} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            {step === 1 && (
              <Step1
                form={shopForm} setForm={setShopForm}
                slugStatus={slugStatus}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2
                form={adminForm} setForm={setAdminForm}
                onNext={handleSubmit} onBack={() => setStep(1)}
                loading={loading} error={submitError}
              />
            )}
            {step === 3 && <Step3 slug={createdSlug} />}
          </div>

          {step < 3 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Étape {step} sur 2 — En créant votre boutique, vous acceptez nos{" "}
              <Link href="/saas" className="underline hover:text-blue-600">conditions d&apos;utilisation</Link>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
