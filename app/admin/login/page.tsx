"use client";

/* ============================================================================
 *  app/admin/login/page.tsx — Afrisika design language
 *  Drop-in replacement. Auth API unchanged: POST /api/admin/auth/login
 *  Redirect logic preserved (livreur → /livreur, otherwise → ?redirect or /admin)
 * ========================================================================== */

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Geist, Instrument_Serif } from "next/font/google";
import {
  Eye, EyeOff, Loader2, User, Lock, ArrowRight, ShoppingBag, CheckCircle,
} from "lucide-react";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--af-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--af-serif",
  display: "swap",
});

function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const redirect = params.get("redirect") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: "API admin indisponible. Vérifiez la configuration BACKEND_URL." };
      if (!res.ok) { setError(data.error || "Identifiants incorrects"); return; }
      const dest = (data.role === "staff" && data.poste === "Livreur") || data.role === "livreur"
        ? "/livreur"
        : redirect;
      window.location.href = dest;
    } catch {
      setError("Impossible de se connecter. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${geist.variable} ${serif.variable} min-h-screen flex text-[#14110E] antialiased`}
      style={{ background: "#FBF7F1", fontFamily: "var(--af-sans)", letterSpacing: "-0.005em" }}
    >
      {/* ════════════════════════════════════════════════════════════════
         LEFT — Brand panel (dark ink + amber accents)
         ════════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex w-[46%] xl:w-[44%] relative overflow-hidden flex-col justify-between p-12 xl:p-14"
        style={{ background: "#14110E", color: "white" }}
      >
        {/* Background glow layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(50% 40% at 90% 0%, rgba(224,122,44,0.20) 0%, transparent 70%), radial-gradient(40% 35% at 0% 100%, rgba(242,167,101,0.10) 0%, transparent 70%)",
          }}
        />
        {/* Fine grain noise */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* Top — brand mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span
            className="w-9 h-9 rounded-[10px] grid place-items-center"
            style={{
              background: "radial-gradient(120% 120% at 20% 20%, #F2A765 0%, #E07A2C 45%, #B8501A 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 10px -4px rgba(184,80,26,0.55)",
            }}
          >
            <ShoppingBag className="w-[16px] h-[16px] text-[#14110E]" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-[18px] tracking-tight">Afrisika</span>
        </div>

        {/* Middle — quote + display headline */}
        <div className="relative z-10 max-w-[480px]">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-medium tracking-[0.06em] mb-7"
            style={{
              background: "rgba(242,167,101,0.10)",
              border: "1px solid rgba(242,167,101,0.18)",
              color: "#F2A765",
            }}
          >
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: "#F2A765" }}>
              <span className="absolute -inset-1 rounded-full opacity-40 animate-ping" style={{ background: "#F2A765" }} />
            </span>
            ESPACE ADMINISTRATEUR
          </span>

          <h2
            className="font-medium tracking-[-0.03em] leading-[1.02] text-[40px] xl:text-[48px] mb-5"
          >
            Gérez votre commerce{" "}
            <span
              className="font-normal italic"
              style={{
                fontFamily: "var(--af-serif)",
                background: "linear-gradient(96deg,#F2A765 0%,#E07A2C 50%,#F2A765 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              en toute sérénité.
            </span>
          </h2>
          <p className="text-[15px] text-white/55 leading-[1.55] max-w-[44ch]">
            Boutique en ligne, magasin physique, stock, CRM, finances et commerciaux — toute votre activité dans une seule plateforme.
          </p>

          {/* Mini features list */}
          <ul className="mt-9 flex flex-col gap-3">
            {[
              "Boutique en ligne & magasin physique (POS)",
              "Gestion de stock multi-points en temps réel",
              "CRM clients, commerciaux & WhatsApp commerce",
              "Finances & paiement mobile (Wave, OM, MoMo)",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14px] text-white/80">
                <CheckCircle className="w-3.5 h-3.5 text-[#F2A765]" strokeWidth={2} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — fine print */}
        <div className="relative z-10 text-[12px] text-white/35 tracking-[0.04em]">
          Lomé · Accra · Abidjan · Cotonou
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════
         RIGHT — Login form
         ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 relative">
        {/* Mobile-only brand mark up top */}
        <div className="lg:hidden absolute top-7 left-7 flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-[9px] grid place-items-center"
            style={{
              background: "radial-gradient(120% 120% at 20% 20%, #F2A765 0%, #E07A2C 45%, #B8501A 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 10px -4px rgba(184,80,26,0.55)",
            }}
          >
            <ShoppingBag className="w-[15px] h-[15px] text-[#14110E]" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-[17px] tracking-tight">Afrisika</span>
        </div>

        {/* Back to landing link, desktop top-right */}
        <Link
          href="/saas"
          className="hidden lg:inline-flex absolute top-7 right-8 items-center gap-1.5 text-[13.5px] text-[#6B635B] hover:text-[#14110E] transition-colors"
        >
          ← Retour au site
        </Link>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-9">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#B8501A] mb-4">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E07A2C" }} />
              Connexion
            </span>
            <h1 className="text-[36px] sm:text-[42px] font-medium tracking-[-0.03em] leading-[1.02] mb-2.5">
              Bon retour,{" "}
              <span className="font-normal italic" style={{ fontFamily: "var(--af-serif)" }}>
                ravi de vous revoir.
              </span>
            </h1>
            <p className="text-[14.5px] text-[#6B635B] leading-[1.5]">
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-[12px] text-[13.5px] leading-[1.45]"
              style={{ background: "#F8E1DD", border: "1px solid #EFC8C0", color: "#9B3A2F" }}
            >
              <span
                className="w-[18px] h-[18px] rounded-full grid place-items-center text-[11px] font-bold shrink-0 mt-px"
                style={{ background: "#9B3A2F", color: "white" }}
              >
                !
              </span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              label="Nom d'utilisateur"
              icon={<User className="w-4 h-4" strokeWidth={1.7} />}
              input={
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex : admin"
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full h-[46px] pl-10 pr-3.5 rounded-[12px] bg-white border border-[#E8E1D4] outline-none text-[14.5px] text-[#14110E] placeholder:text-[#A8A097] transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15"
                />
              }
            />

            <Field
              label="Mot de passe"
              icon={<Lock className="w-4 h-4" strokeWidth={1.7} />}
              right={
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A097] hover:text-[#14110E] transition-colors"
                  aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              input={
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-[46px] pl-10 pr-11 rounded-[12px] bg-white border border-[#E8E1D4] outline-none text-[14.5px] text-[#14110E] placeholder:text-[#A8A097] transition-all focus:border-[#E07A2C] focus:ring-2 focus:ring-[#E07A2C]/15"
                />
              }
            />

            {/* Row: remember + forgot */}
            <div className="flex items-center justify-between mt-1">
              <label className="inline-flex items-center gap-2 text-[13px] text-[#6B635B] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="appearance-none w-4 h-4 rounded-[5px] border border-[#D6CCBA] bg-white checked:bg-[#14110E] checked:border-[#14110E] grid place-items-center transition-colors relative after:content-['✓'] after:text-white after:text-[10px] after:opacity-0 checked:after:opacity-100"
                />
                Se souvenir de moi
              </label>
              <a href="#" className="text-[13px] text-[#B8501A] hover:text-[#14110E] transition-colors font-medium">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 inline-flex items-center justify-center gap-2 w-full h-12 rounded-full text-[15px] font-medium text-white transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: loading ? "#2A2522" : "#14110E",
                boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 20px -8px rgba(20,17,14,0.55)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <span className="flex-1 h-px bg-[#E8E1D4]" />
            <span className="text-[11.5px] uppercase tracking-[0.1em] text-[#A8A097] font-medium">ou</span>
            <span className="flex-1 h-px bg-[#E8E1D4]" />
          </div>

          {/* Sign up callout */}
          <div
            className="rounded-[14px] p-4 flex items-center justify-between gap-4"
            style={{ background: "#F6EFE2", border: "1px solid #E8E1D4" }}
          >
            <div>
              <div className="text-[14px] font-medium text-[#14110E]">Pas encore de compte ?</div>
              <div className="text-[12.5px] text-[#6B635B] mt-0.5">14 jours gratuits, sans carte bancaire.</div>
            </div>
            <Link
              href="/saas#tarifs"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium text-[#14110E] bg-white border border-[#E8E1D4] hover:border-[#14110E]/20 transition-colors shrink-0"
            >
              Créer
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Footnote */}
          <p className="text-center text-[11.5px] text-[#A8A097] mt-8 leading-relaxed">
            Première connexion ? Un compte <span className="font-mono">super_admin</span> sera créé
            <br className="hidden sm:block" /> automatiquement avec ces identifiants.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─── Field — Label + icon-prefixed input ─────────────────────────────── */
function Field({
  label,
  icon,
  input,
  right,
}: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B635B] mb-2">
        {label}
      </span>
      <span className="relative block">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A097] pointer-events-none">
          {icon}
        </span>
        {input}
        {right}
      </span>
    </label>
  );
}

/* ─── Suspense wrapper — required by Next.js 15 for useSearchParams ───── */
export default function AdminLoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#FBF7F1" }}
        >
          <div className="w-8 h-8 border-4 border-[#E07A2C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}
