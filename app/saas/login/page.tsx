"use client";

/**
 * Page de connexion dédiée Super Admin — /saas/login
 * Wrapper léger sur /admin/login qui redirige vers /admin/saas après auth.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--af-sans", display: "swap" });

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={geist.variable} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4EFE6", fontFamily: "var(--af-sans), sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, background: "#14110E", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#14110E", letterSpacing: "-0.02em" }}>Super Admin</div>
          <div style={{ fontSize: 13.5, color: "#8A8278", marginTop: 4 }}>Plateforme Afrisika</div>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 20, padding: "32px 28px", boxShadow: "0 2px 20px rgba(20,17,14,0.08)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#6B635B", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Identifiant</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                required autoFocus
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E8E1D4", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#14110E"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E1D4"; }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#6B635B", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Mot de passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E8E1D4", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#14110E"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E1D4"; }}
              />
            </div>

            {error && (
              <div style={{ background: "#FDECEA", border: "1px solid #F5C6C2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C84B3A" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !username || !password}
              style={{ marginTop: 4, padding: "13px 0", background: "#14110E", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: !username || !password ? 0.5 : 1, fontFamily: "inherit", transition: "opacity .15s" }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#A09890" }}>
          Accès restreint — super-admin uniquement
        </div>
      </div>
    </div>
  );
}
