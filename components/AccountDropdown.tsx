"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Package, Heart, Star, Users, MapPin,
  CreditCard, Bell, Settings, ChevronRight,
  LogOut, Loader2, Eye, EyeOff, Mail, Phone,
} from "lucide-react";
import { clsx } from "clsx";

// ── Google "G" logo ──────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.075 17.64 11.767 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────
export interface ClientUser {
  id:        number;
  nom:       string;
  email:     string | null;
  telephone: string | null;
  photo_url: string | null;
}

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

const MENU_LINKS = [
  { label: "Mon profil",         href: "/account/profil",    icon: User,    color: "text-brand-700"  },
  { label: "Mes commandes",      href: "/account/commandes", icon: Package, color: "text-blue-600"   },
  { label: "Mes favoris",        href: "/wishlist",           icon: Heart,   color: "text-red-500"    },
  { label: "Programme Fidélité", href: "/fidelite",           icon: Star,    color: "text-amber-500"  },
  { label: "Parrainage",         href: "/parrainage",         icon: Users,   color: "text-purple-600" },
];

const SETTINGS_LINKS = [
  { label: "Mes adresses",  href: "/account/adresses",      icon: MapPin     },
  { label: "Paiement",      href: "/account/paiement",      icon: CreditCard },
  { label: "Notifications", href: "/account/notifications",  icon: Bell       },
];

// ── Composant principal ───────────────────────────────────────
interface Props {
  open:    boolean;
  onClose: () => void;
  /** Called after login/logout so Header can refresh the avatar */
  onUserChange: (user: ClientUser | null) => void;
}

export default function AccountDropdown({ open, onClose, onUserChange }: Props) {
  const [status,      setStatus]      = useState<"loading" | "guest" | "logged">("loading");
  const [user,        setUser]        = useState<ClientUser | null>(null);
  const [view,        setView]        = useState<"login" | "register">("login");
  const [loginType,   setLoginType]   = useState<"email" | "phone">("email");
  const [countryCode, setCountryCode] = useState("+228");
  const [identifier,  setIdentifier]  = useState("");
  const [password,    setPassword]    = useState("");
  const [nom,         setNom]         = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  // Check session once on mount (catches Google OAuth redirect cookie)
  useEffect(() => {
    fetch("/api/account/me", { cache: "no-store", credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user as ClientUser);
          setStatus("logged");
          syncLocalStorage(data.user as ClientUser);
          onUserChange(data.user as ClientUser);
        } else {
          setUser(null);
          setStatus("guest");
        }
      })
      .catch(() => { setUser(null); setStatus("guest"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncLocalStorage(u: ClientUser) {
    try {
      localStorage.setItem("ts_profil", JSON.stringify({
        nom:       u.nom,
        telephone: u.telephone ?? "",
        photo_url: u.photo_url ?? "",
      }));
      window.dispatchEvent(new Event("profil-updated"));
    } catch { /* ignore */ }
  }

  function clearLocalStorage() {
    try {
      localStorage.removeItem("ts_profil");
      window.dispatchEvent(new Event("profil-updated"));
    } catch { /* ignore */ }
  }

  function resetForm() {
    setIdentifier("");
    setPassword("");
    setNom("");
    setError("");
    setShowPwd(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fullId = loginType === "phone"
        ? `${countryCode}${identifier.replace(/\D/g, "")}`
        : identifier.trim();

      const res  = await fetch("/api/account/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: fullId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user as ClientUser);
      setStatus("logged");
      syncLocalStorage(data.user as ClientUser);
      onUserChange(data.user as ClientUser);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const fullId = loginType === "phone"
        ? `${countryCode}${identifier.replace(/\D/g, "")}`
        : identifier.trim();

      const res  = await fetch("/api/account/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nom: nom.trim(), identifier: fullId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user as ClientUser);
      setStatus("logged");
      syncLocalStorage(data.user as ClientUser);
      onUserChange(data.user as ClientUser);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    setUser(null);
    setStatus("guest");
    setView("login");
    clearLocalStorage();
    onUserChange(null);
    onClose();
  }

  if (!open) return null;

  // ── Loading ────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Guest : formulaire login / register ────────────────────
  if (status === "guest") {
    const isLogin = view === "login";

    return (
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <p className="font-display font-800 text-slate-900 text-base">
            {isLogin ? "Se connecter" : "Créer un compte"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Togolese Shop</p>
        </div>

        {/* Email / Téléphone tabs */}
        <div className="px-5 mb-3">
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
            {(["email", "phone"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setLoginType(t); setIdentifier(""); setError(""); }}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  loginType === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t === "email"
                  ? <><Mail className="w-3.5 h-3.5" /> Email</>
                  : <><Phone className="w-3.5 h-3.5" /> Téléphone</>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleRegister} className="px-5 pb-4 space-y-2.5">

          {/* Nom (register only) */}
          {!isLogin && (
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom complet"
              required
              autoComplete="name"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
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
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
            />
          ) : (
            <div className="flex gap-1.5 w-full overflow-hidden">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="shrink-0 w-[78px] px-1.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-xs transition-all font-sans"
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
                className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
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
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border-2 border-slate-200 focus:border-brand-600 bg-slate-50 focus:bg-white outline-none text-sm transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-900 text-white font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-all"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isLogin ? "Se connecter" : "Créer mon compte"
            }
          </button>
        </form>

        {/* Divider */}
        <div className="px-5 flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[11px] text-slate-400">ou</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Google button */}
        <div className="px-5 pb-4">
          <a
            href="/api/account/google"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
          >
            <GoogleIcon />
            Continuer avec Google
          </a>
        </div>

        {/* Toggle login ↔ register */}
        <div className="border-t border-slate-100 px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => { setView(isLogin ? "register" : "login"); resetForm(); }}
            className="text-xs text-slate-500 hover:text-brand-700 transition-colors"
          >
            {isLogin
              ? <>Pas encore de compte ?{" "}<span className="font-semibold text-brand-700">Créer un compte</span></>
              : <>Déjà un compte ?{" "}<span className="font-semibold text-brand-700">Se connecter</span></>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Logged in : menu compte ────────────────────────────────
  const initials = user?.nom?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">

      {/* User header — cliquable → /account */}
      <Link
        href="/account"
        onClick={onClose}
        className="px-4 py-4 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50 transition-colors"
      >
        {user?.photo_url ? (
          <Image
            src={user.photo_url}
            alt={user.nom}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-white text-sm font-800 shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-800 text-sm text-slate-900 truncate">{user?.nom ?? "—"}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email ?? user?.telephone ?? ""}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      </Link>

      {/* Main menu */}
      {MENU_LINKS.map(item => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
          >
            <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
            <span className="text-sm text-slate-700 font-medium flex-1">{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>
        );
      })}

      {/* Settings */}
      <div className="border-t border-slate-50 mt-1">
        <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
          <Settings className="w-3 h-3" /> Paramètres
        </p>
        {SETTINGS_LINKS.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="text-sm text-slate-600 flex-1">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="border-t border-slate-50 p-2 mt-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
