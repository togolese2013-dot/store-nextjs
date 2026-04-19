"use client";

import { useEffect, useState } from "react";
import { Star, Send, Loader2, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

interface Review {
  id:         number;
  nom:        string;
  rating:     number;
  comment:    string;
  created_at: string;
}

interface Props {
  productId: number;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            className={clsx(
              "w-5 h-5 transition-colors",
              n <= display ? "text-amber-400" : "text-slate-200"
            )}
            fill={n <= display ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Il y a ${months} mois`;
  return `Il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? "s" : ""}`;
}

export default function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg]         = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /* Form state */
  const [nom, setNom]         = useState("");
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews ?? []);
        setAvg(data.avg ?? null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating === 0) { setError("Veuillez choisir une note."); return; }
    if (!nom.trim())  { setError("Votre prénom est requis."); return; }
    if (!comment.trim()) { setError("Le commentaire est requis."); return; }

    setSending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, nom: nom.trim(), rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setSent(true);
      setNom(""); setRating(0); setComment("");
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-display text-xl font-800 text-slate-900">Avis clients</h2>
        {!loading && avg !== null && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avg)} />
            <span className="text-sm font-semibold text-slate-700">{avg.toFixed(1)}</span>
            <span className="text-sm text-slate-400">· {reviews.length} avis</span>
          </div>
        )}
        {!loading && avg === null && (
          <span className="text-sm text-slate-400">Aucun avis pour le moment</span>
        )}
      </div>

      {/* ── Reviews list ── */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des avis…
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4 mb-8">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {r.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.nom}</p>
                    <p className="text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <StarRating value={r.rating} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-8">Soyez le premier à laisser un avis !</p>
      )}

      {/* ── Submit form ── */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Donner votre avis</h3>

        {sent ? (
          <div className="flex items-center gap-3 py-4 px-5 rounded-xl bg-green-50 text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Merci pour votre avis !</p>
              <p className="text-xs text-green-600">Il sera publié après validation.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Votre note *</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Votre prénom *</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex : Koffi"
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-brand-500 outline-none transition-colors bg-white font-sans"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Votre commentaire *</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Décrivez votre expérience avec ce produit…"
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-brand-500 outline-none transition-colors resize-none bg-white font-sans"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                : <><Send className="w-4 h-4" /> Envoyer l'avis</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
