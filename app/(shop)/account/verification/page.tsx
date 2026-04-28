"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, ShieldAlert, Clock, Upload, ArrowLeft,
  CheckCircle2, XCircle, Loader2, Camera, CreditCard,
} from "lucide-react";
import { clsx } from "clsx";

type Statut = "en_attente" | "verifie" | "rejete" | null;

interface VerifState {
  statut: Statut;
  note_admin: string | null;
}

interface FilePreview {
  data: string; // base64
  type: string;
  preview: string;
}

function UploadZone({
  label,
  hint,
  icon: Icon,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  icon: React.ElementType;
  file: FilePreview | null;
  onChange: (f: FilePreview) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      onChange({ data, type: f.type, preview: data });
    };
    reader.readAsDataURL(f);
  }

  return (
    <div>
      <p className="text-xs font-bold text-slate-600 mb-2">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden",
          file ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50"
        )}
      >
        {file ? (
          <div className="relative w-full h-44">
            <Image src={file.preview} alt={label} fill className="object-contain p-2" />
            <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1 rounded-full">Changer</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center">
              <Icon className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-sm font-semibold text-slate-500">Ajouter une photo</span>
            <span className="text-xs text-slate-400 text-center leading-relaxed">{hint}</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

export default function VerificationPage() {
  const [state,      setState]      = useState<VerifState | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [idCard,     setIdCard]     = useState<FilePreview | null>(null);
  const [selfie,     setSelfie]     = useState<FilePreview | null>(null);

  useEffect(() => {
    fetch("/api/account/verification", { credentials: "include" })
      .then(r => r.json())
      .then(data => setState({ statut: data.statut ?? null, note_admin: data.note_admin ?? null }))
      .catch(() => setState({ statut: null, note_admin: null }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idCard || !selfie) { setError("Veuillez ajouter les deux photos."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/account/verification", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id_card: { data: idCard.data, type: idCard.type },
          selfie:  { data: selfie.data, type: selfie.type },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState({ statut: "en_attente", note_admin: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/account" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-slate-900 text-base">Vérification du compte</h1>
            <p className="text-xs text-slate-400">Débloquez le paiement échelonné</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        )}

        {/* Vérifié */}
        {!loading && state?.statut === "verifie" && (
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Compte Vérifié</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Votre identité a été confirmée. Vous avez accès au paiement échelonné 2×, 3× et 4×.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Paiement échelonné activé
            </div>
          </div>
        )}

        {/* En attente */}
        {!loading && state?.statut === "en_attente" && (
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-slate-900 mb-2">En cours de vérification</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Vos documents ont été envoyés. Notre équipe les vérifie sous 24–48h. Vous recevrez une confirmation.
            </p>
          </div>
        )}

        {/* Rejeté → re-soumettre */}
        {!loading && state?.statut === "rejete" && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Documents refusés</p>
              {state.note_admin && (
                <p className="text-red-700 text-xs mt-1">{state.note_admin}</p>
              )}
              <p className="text-red-600 text-xs mt-1">Veuillez soumettre de nouveaux documents ci-dessous.</p>
            </div>
          </div>
        )}

        {/* Formulaire (statut null ou rejeté) */}
        {!loading && (state?.statut === null || state?.statut === "rejete") && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Explications */}
            {state?.statut === null && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Pourquoi vérifier mon compte ?</p>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      La vérification d'identité vous permet d'accéder au paiement en plusieurs fois (2×, 3× ou 4×) pour vos commandes.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "Photo nette de votre pièce d'identité (recto)",
                    "Selfie tenant votre pièce d'identité visible",
                    "Traitement sous 24–48h par notre équipe",
                  ].map(t => (
                    <div key={t} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload zones */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
              <h2 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-700" />
                Vos documents
              </h2>

              <UploadZone
                label="Carte d'identité (recto)"
                hint="Photo de votre CNI, passeport ou permis de conduire. Format JPG ou PNG."
                icon={CreditCard}
                file={idCard}
                onChange={setIdCard}
              />

              <UploadZone
                label="Selfie avec votre pièce d'identité"
                hint="Tenez votre carte face à la caméra. Votre visage et le document doivent être visibles."
                icon={Camera}
                file={selfie}
                onChange={setSelfie}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !idCard || !selfie}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-900 text-white font-bold text-sm hover:bg-brand-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Envoyer pour vérification</>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 leading-relaxed">
              Vos documents sont transmis de façon sécurisée et utilisés uniquement pour vérifier votre identité.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
