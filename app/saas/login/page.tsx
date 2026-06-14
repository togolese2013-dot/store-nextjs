"use client";

import { useState } from "react";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--af-sans",
  display: "swap",
});

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export default function SuperAdminLoginPage() {
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [focusedEl, setFocused]   = useState<"user" | "pwd" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password, shop_slug: "default" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Identifiants incorrects."); return; }
      if (data.role !== "super_admin") { setError("Accès réservé au super-admin."); return; }
      window.location.href = "/admin/saas";
    } catch {
      setError("Erreur réseau — veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const inputBorder = (el: "user" | "pwd") =>
    focusedEl === el ? "1.5px solid #14110E" : "1.5px solid #E8E1D4";

  return (
    <div
      className={geist.variable}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--af-sans), system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Left panel — branding */}
      <div
        style={{
          width: 440,
          flexShrink: 0,
          background: "#14110E",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 44px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot texture */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Glows */}
        <div style={{ position: "absolute", top: -120, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,96,30,.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,74,136,.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "white", borderRadius: 11, display: "grid", placeItems: "center", flexShrink: 0, color: "#14110E" }}>
            <IconShield />
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: "white", letterSpacing: "-.02em" }}>Afrisika</span>
        </div>

        {/* Headline + stats */}
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 99, padding: "5px 12px", marginBottom: 28,
          }}>
            <div style={{ color: "#F2A765" }}><IconShield /></div>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", fontWeight: 500, letterSpacing: ".04em" }}>Super Admin</span>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 500, color: "white", letterSpacing: "-.03em", lineHeight: 1.05, marginBottom: 14 }}>
            Gérez toute<br />la plateforme
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.65, maxWidth: "28ch" }}>
            Accès restreint aux administrateurs autorisés de la plateforme Afrisika.
          </p>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 36 }}>
            {[
              { value: "SaaS",    label: "Plateforme multi-tenant", color: "white"   },
              { value: "Afrisika", label: "Marque principale",       color: "#F2A765" },
              { value: "Plans",   label: "Basic · Pro · Business",   color: "white"   },
              { value: "FCFA",    label: "Paiement Moov & Yas",      color: "#DDEBE2" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: stat.color, letterSpacing: "-.02em", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", fontSize: 11.5, color: "rgba(255,255,255,.25)" }}>
          © 2026 Afrisika · Tous droits réservés
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, background: "#FBF7F1",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40,
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 500, color: "#14110E", letterSpacing: "-.025em", marginBottom: 6 }}>
              Connexion
            </h2>
            <p style={{ fontSize: 13.5, color: "#8A8278", lineHeight: 1.5 }}>
              Entrez vos identifiants pour accéder au panneau super-admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6B635B", marginBottom: 7, letterSpacing: ".04em", textTransform: "uppercase" }}>
                Identifiant
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#A09890", pointerEvents: "none" }}>
                  <IconUser />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nom d'utilisateur"
                  required autoFocus
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%", padding: "12px 14px 12px 40px",
                    border: inputBorder("user"), borderRadius: 11,
                    fontSize: 14, fontFamily: "inherit", color: "#14110E",
                    background: "#FFFFFF", outline: "none", boxSizing: "border-box",
                    boxShadow: "0 1px 2px rgba(20,17,14,.04)",
                    transition: "border-color .15s",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ fontSize: 11.5, fontWeight: 500, color: "#6B635B", letterSpacing: ".04em", textTransform: "uppercase" }}>
                  Mot de passe
                </label>
                <a href="/admin/login" style={{ fontSize: 12, color: "#8A8278", textDecoration: "none" }}>
                  Connexion boutique →
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#A09890", pointerEvents: "none" }}>
                  <IconLock />
                </div>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  onFocus={() => setFocused("pwd")}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%", padding: "12px 42px 12px 40px",
                    border: inputBorder("pwd"), borderRadius: 11,
                    fontSize: 14, fontFamily: "inherit", color: "#14110E",
                    background: "#FFFFFF", outline: "none", boxSizing: "border-box",
                    boxShadow: "0 1px 2px rgba(20,17,14,.04)",
                    transition: "border-color .15s",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#A09890", padding: 4, display: "grid", placeItems: "center",
                  }}
                >
                  {showPwd ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEF2F0", border: "1px solid #F5C6C2",
                borderRadius: 9, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <div style={{ color: "#C84B3A", flexShrink: 0 }}><IconX /></div>
                <span style={{ fontSize: 13, color: "#C84B3A" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                marginTop: 4, width: "100%", padding: "13px 0",
                background: "#14110E", color: "white", border: "none",
                borderRadius: 11, fontSize: 14, fontWeight: 600,
                cursor: loading || !username || !password ? "not-allowed" : "pointer",
                opacity: !username || !password ? 0.5 : 1,
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 1px 0 rgba(255,255,255,.08) inset, 0 6px 16px -8px rgba(20,17,14,.5)",
                transition: "opacity .15s",
              }}
            >
              {loading ? "Connexion…" : "Se connecter"}
              {!loading && <IconArrow />}
            </button>

          </form>

          <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#B0A898" }}>
            Accès restreint — super-admin uniquement.
          </p>

        </div>
      </div>
    </div>
  );
}
