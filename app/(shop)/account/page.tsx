"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Package, Heart, Settings, MapPin,
  CreditCard, Bell, Star, Users, ChevronRight, LogOut, Clock,
  Loader2, Eye, EyeOff, Mail, Phone, ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";

// ── Google "G" logo ──────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.075 17.64 11.767 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const COUNTRY_CODES = [
  { code: "+228", flag: "🇹🇬" },
  { code: "+233", flag: "🇬🇭" },
  { code: "+229", flag: "🇧🇯" },
  { code: "+225", flag: "🇨🇮" },
  { code: "+221", flag: "🇸🇳" },
  { code: "+237", flag: "🇨🇲" },
  { code: "+242", flag: "🇨🇬" },
  { code: "+241", flag: "🇬🇦" },
  { code: "+33",  flag: "🇫🇷" },
  { code: "+32",  flag: "🇧🇪" },
  { code: "+1",   flag: "🇺🇸" },
];

const MENU = [
  {
    label: "Mon profil",
    desc:  "Nom, téléphone, points",
    href:  "/account/profil",
    icon:  User,
    color: "bg-brand-50 text-brand-700",
    border: "hover:border-brand-200",
  },
  {
    label: "Mes commandes",
    desc:  "Historique & suivi",
    href:  "/account/commandes",
    icon:  Package,
    color: "bg-blue-50 text-blue-700",
    border: "hover:border-blue-200",
  },
  {
    label: "Mes favoris",
    desc:  "Produits sauvegardés",
    href:  "/wishlist",
    icon:  Heart,
    color: "bg-red-50 text-red-600",
    border: "hover:border-red-200",
  },
  {
    label: "Programme Fidélité",
    desc:  "Mes points & coupons",
    href:  "/fidelite",
    icon:  Star,
    color: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
  },
  {
    label: "Parrainage",
    desc:  "Mon lien de parrainage",
    href:  "/parrainage",
    icon:  Users,
    color: "bg-purple-50 text-purple-600",
    border: "hover:border-purple-200",
  },
  {
    label: "Mes adresses",
    desc:  "Adresses enregistrées",
    href:  "/account/adresses",
    icon:  MapPin,
    color: "bg-slate-100 text-slate-600",
    border: "hover:border-slate-300",
  },
  {
    label: "Vu récemment",
    desc:  "Produits consultés",
    href:  "/account/recently-viewed",
    icon:  Clock,
    color: "bg-teal-50 text-teal-600",
    border: "hover:border-teal-200",
  },
  {
    label: "Vérification",
    desc:  "Compte & paiement échelonné",
    href:  "/account/verification",
    icon:  ShieldCheck,
    color: "bg-green-50 text-green-700",
    border: "hover:border-green-200",
  },
];

const SETTINGS = [
  { label: "Paiement",      href: "/account/paiement",      icon: CreditCard },
  { label: "Notifications", href: "/account/notifications",  icon: Bell },
];

interface Profil {
  nom:       string;
  telephone: string;
  photo_url?: string;
}

export default function AccountPage() {
  const [status,      setStatus]      = useState<"loading" | "guest" | "logged">("loading");
  const [profil,      setProfil]      = useState<Profil | null>(null);

  // Login / register form state
  const [view,        setView]        = useState<"login" | "register">("login");
  const [loginType,   setLoginType]   = useState<"email" | "phone">("email");
  const [countryCode, setCountryCode] = useState("+228");
  const [identifier,  setIdentifier]  = useState("");
  const [password,    setPassword]    = useState("");
  const [nom,         setNom]         = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [verifStatut, setVerifStatut] = useState<"en_attente" | "verifie" | "rejete" | null>(null);

  // Check session on mount
  useEffect(() => {
    fetch("/api/account/me", { cache: "no-store", credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          syncLocalStorage(data.user);
          setStatus("logged");
          fetch("/api/account/verification", { credentials: "include" })
            .then(r => r.json())
            .then(v => setVerifStatut(v.statut ?? null))
            .catch(() => {});
        } else {
          setStatus("guest");
        }
      })
      .catch(() => setStatus("guest"));
  }, []);

  // Also read localStorage for profil display
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_profil");
      if (raw) setProfil(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [status]);

  function syncLocalStorage(u: { nom: string; telephone?: string | null; photo_url?: string | null }) {
    try {
      const p = { nom: u.nom, telephone: u.telephone ?? "", photo_url: u.photo_url ?? "" };
      localStorage.setItem("ts_profil", JSON.stringify(p));
      setProfil(p);
      window.dispatchEvent(new Event("profil-updated"));
    } catch { /* ignore */ }
  }

  function resetForm() {
    setIdentifier(""); setPassword(""); setNom(""); setError(""); setShowPwd(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const fullId = loginType === "phone"
        ? `${countryCode}${identifier.replace(/\D/g, "")}`
        : identifier.trim();
      const res  = await fetch("/api/account/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fullId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      syncLocalStorage(data.user);
      setStatus("logged");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally { setSubmitting(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const fullId = loginType === "phone"
        ? `${countryCode}${identifier.replace(/\D/g, "")}`
        : identifier.trim();
      const res  = await fetch("/api/account/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim(), identifier: fullId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      syncLocalStorage(data.user);
      setStatus("logged");
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally { setSubmitting(false); }
  }

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    try {
      localStorage.removeItem("ts_profil");
      window.dispatchEvent(new Event("profil-updated"));
    } catch { /* ignore */ }
    window.location.href = "/";
  }

  // ── Loading ──────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  // ── Guest : login / register ─────────────────────────────────
  if (status === "guest") {
    const isLogin = view === "login";
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top brand bar */}
        <div className="bg-white border-b border-slate-100 px-4 py-5 text-center">
          <h1 className="font-display text-xl font-bold text-slate-900">Mon compte</h1>
          <p className="text-sm text-slate-400 mt-0.5">Togolese Shop</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <p className="font-display font-bold text-slate-900 text-lg">
                {isLogin ? "Se connecter" : "Créer un compte"}
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                {isLogin ? "Accédez à votre espace personnel" : "Rejoignez Togolese Shop"}
              </p>
            </div>

            {/* Email / Téléphone tabs */}
            <div className="px-6 mb-4">
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                {(["email", "phone"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setLoginType(t); setIdentifier(""); setError(""); }}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
                      loginType === t
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {t === "email"
                      ? <><Mail className="w-4 h-4" /> Email</>
                      : <><Phone className="w-4 h-4" /> Téléphone</>
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="px-6 pb-5 space-y-3">

              {/* Nom — register only */}
              {!isLogin && (
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Nom complet"
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
              )}

              {/* Identifier */}
              {loginType === "email" ? (
                <input
                  type="email"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
              ) : (
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="shrink-0 w-[84px] px-2 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-xs transition-all font-sans"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value.replace(/\D/g, ""))}
                    placeholder="90 00 00 00"
                    required
                    autoComplete="tel"
                    className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                  />
                </div>
              )}

              {/* Password */}
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  minLength={isLogin ? undefined : 6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-all"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isLogin ? "Se connecter" : "Créer mon compte"
                }
              </button>
            </form>

            {/* Divider */}
            <div className="px-6 flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Google */}
            <div className="px-6 pb-5">
              <a
                href="/api/account/google"
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
              >
                <GoogleIcon />
                Continuer avec Google
              </a>
            </div>

            {/* Toggle */}
            <div className="border-t border-slate-100 px-6 py-4 text-center">
              <button
                type="button"
                onClick={() => { setView(isLogin ? "register" : "login"); resetForm(); }}
                className="text-sm text-slate-500 hover:text-brand-700 transition-colors"
              >
                {isLogin
                  ? <>Pas encore de compte ?{" "}<span className="font-semibold text-brand-700">Créer un compte</span></>
                  : <>Déjà un compte ?{" "}<span className="font-semibold text-brand-700">Se connecter</span></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged in : menu compte ──────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            {profil?.photo_url ? (
              <Image
                src={profil.photo_url}
                alt={profil.nom}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {profil?.nom ? profil.nom.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {profil?.nom ?? "Mon compte"}
              </h1>
              <p className="text-sm text-slate-400">{profil?.telephone ?? "Complétez votre profil"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Card grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {MENU.map(item => {
            const isVerif = item.href === "/account/verification";
            const badge = isVerif ? (
              verifStatut === "verifie"    ? <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Vérifié</span>
            : verifStatut === "en_attente" ? <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">En attente</span>
            : verifStatut === "rejete"     ? <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Refusé</span>
            : <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Non vérifié</span>
            ) : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bg-white rounded-2xl border border-slate-100 ${item.border} p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                  {badge && <div className="mt-1.5">{badge}</div>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings row */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Settings className="inline w-3 h-3 mr-1" />Paramètres
          </p>
          {SETTINGS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${i < SETTINGS.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-slate-500" />
              </div>
              <p className="flex-1 font-semibold text-sm text-slate-800">{item.label}</p>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
