"use client";

import { useState } from "react";

export default function LivreurLoginPage() {
  const [nom,      setNom]      = useState(""); // used as username field
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ username: nom, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Identifiants incorrects.");
      } else {
        // On subdomain: redirect to / (middleware rewrites to /livreur)
        // On main site: redirect to /livreur
        const isSubdomain = window.location.hostname.startsWith("livraison.");
        window.location.href = isSubdomain ? "/" : "/livreur";
      }
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="livreur-root" style={{ justifyContent: "center", alignItems: "center", padding: "24px 20px", minHeight: "100dvh" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--lv-g-800)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--lv-ink-900)", margin: 0 }}>
            Espace Livreur
          </h1>
          <p style={{ fontSize: 13, color: "var(--lv-ink-400)", marginTop: 4 }}>
            Togolese Shop · Connexion
          </p>
        </div>

        {/* Card */}
        <div className="lv-card" style={{ padding: "28px 24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--lv-ink-500)", marginBottom: 6 }}>
                Identifiant
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Votre numéro de téléphone"
                required
                autoComplete="username"
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: 12, border: "1px solid var(--lv-ink-200)",
                  fontSize: 14, fontFamily: "inherit",
                  background: "var(--lv-bg)", color: "var(--lv-ink-900)",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--lv-ink-500)", marginBottom: 6 }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: 12, border: "1px solid var(--lv-ink-200)",
                  fontSize: 14, fontFamily: "inherit",
                  background: "var(--lv-bg)", color: "var(--lv-ink-900)",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#fef2f2", border: "1px solid #fecaca",
                fontSize: 13, color: "var(--lv-danger)",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="lv-btn--primary"
              style={{ marginTop: 4, padding: "13px", fontSize: 14, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

      </div>

      {/* Register link */}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--lv-ink-400)" }}>
        Nouveau livreur ?{" "}
        <a
          href="/livreur-inscription"
          style={{ color: "var(--lv-g-700)", fontWeight: 600, textDecoration: "none" }}
        >
          Faire une demande
        </a>
      </p>

    </div>
  );
}
