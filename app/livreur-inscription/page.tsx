"use client";

import "@/components/livreur-app/livreur.css";
import { useState, useRef } from "react";

export default function LivreurInscriptionPage() {
  const [nom,          setNom]          = useState("");
  const [telephone,    setTelephone]    = useState("");
  const [numeroPlaque, setNumeroPlaque] = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [carteFile,    setCarteFile]    = useState<File | null>(null);
  const [cartePreview, setCartePreview] = useState<string>("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 10 Mo.");
      return;
    }
    setError("");
    setCarteFile(file);
    const reader = new FileReader();
    reader.onload = ev => setCartePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!carteFile) {
      setError("La photo de la carte d'identité est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload  = ev => resolve(ev.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(carteFile);
      });

      const res = await fetch("/api/livreur/inscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nom, telephone, numero_plaque: numeroPlaque, password,
          carte_identite: base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    borderRadius: 12, border: "1px solid var(--lv-ink-200)",
    fontSize: 14, fontFamily: "inherit",
    background: "var(--lv-bg)", color: "var(--lv-ink-900)",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--lv-ink-500)", marginBottom: 6,
  };

  if (success) {
    return (
      <div className="livreur-root" style={{ justifyContent: "center", alignItems: "center", padding: "24px 20px", minHeight: "100dvh" }}>
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--lv-g-800)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--lv-ink-900)", margin: "0 0 10px" }}>
            Demande envoyée !
          </h2>
          <p style={{ fontSize: 14, color: "var(--lv-ink-400)", lineHeight: 1.6, margin: "0 0 28px" }}>
            Votre demande a bien été reçue. Un administrateur examinera votre dossier et vous contactera sur votre numéro de téléphone.
          </p>
          <a
            href="/login"
            style={{
              display: "block", padding: "13px",
              borderRadius: 12, background: "var(--lv-g-800)",
              color: "#fff", fontWeight: 600, fontSize: 14,
              textDecoration: "none", textAlign: "center",
            }}
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="livreur-root" style={{ justifyContent: "center", alignItems: "center", padding: "24px 20px", minHeight: "100dvh" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--lv-g-800)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--lv-ink-900)", margin: 0 }}>
            Devenir Livreur
          </h1>
          <p style={{ fontSize: 13, color: "var(--lv-ink-400)", marginTop: 4 }}>
            Togolese Shop · Inscription
          </p>
        </div>

        {/* Card */}
        <div className="lv-card" style={{ padding: "28px 24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Votre nom complet"
                required
                autoComplete="name"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Numéro de téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="+228 XX XX XX XX"
                required
                autoComplete="tel"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
              <p style={{ fontSize: 11, color: "var(--lv-ink-400)", marginTop: 4 }}>
                Ce numéro servira d&apos;identifiant de connexion
              </p>
            </div>

            <div>
              <label style={labelStyle}>Numéro de plaque <span style={{ fontWeight: 400, color: "var(--lv-ink-400)" }}>(optionnel)</span></label>
              <input
                type="text"
                value={numeroPlaque}
                onChange={e => setNumeroPlaque(e.target.value)}
                placeholder="ex : TG-1234-A"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
            </div>

            {/* Carte d'identité */}
            <div>
              <label style={labelStyle}>
                Photo de la carte d&apos;identité <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {cartePreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={cartePreview}
                    alt="Aperçu CNI"
                    style={{
                      width: "100%", borderRadius: 12, objectFit: "cover",
                      maxHeight: 180, border: "1px solid var(--lv-ink-200)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setCarteFile(null); setCartePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    style={{
                      position: "absolute", top: 8, right: 8,
                      width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(0,0,0,0.55)", border: "none",
                      color: "#fff", cursor: "pointer", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%", padding: "20px 14px",
                    borderRadius: 12, border: "2px dashed var(--lv-ink-200)",
                    background: "transparent", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lv-ink-400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style={{ fontSize: 13, color: "var(--lv-ink-400)" }}>
                    Appuyer pour choisir une photo
                  </span>
                  <span style={{ fontSize: 11, color: "var(--lv-ink-300)" }}>
                    JPEG, PNG ou WEBP · max 10 Mo
                  </span>
                </button>
              )}
            </div>

            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                autoComplete="new-password"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--lv-g-600)"}
                onBlur={e  => e.currentTarget.style.borderColor = "var(--lv-ink-200)"}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                style={inputStyle}
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
              {loading ? "Envoi en cours…" : "Soumettre ma demande"}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--lv-ink-400)" }}>
          Déjà livreur ?{" "}
          <a href="/login" style={{ color: "var(--lv-g-700)", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </a>
        </p>

      </div>
    </div>
  );
}
