"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import ReviewActions from "./ReviewActions";
import type { Review } from "@/lib/admin-db";

interface ReviewWithProduct extends Review {
  product_nom?: string;
}

interface Props {
  reviews: ReviewWithProduct[];
}

const FILTERS = [
  { label: "Tous",    value: 0 },
  { label: "5 ★",    value: 5 },
  { label: "4 ★",    value: 4 },
  { label: "3 ★",    value: 3 },
  { label: "2 ★",    value: 2 },
  { label: "1 ★",    value: 1 },
];

const STATUS = [
  { label: "Tous",       value: "all" },
  { label: "Approuvés",  value: "approved" },
  { label: "En attente", value: "pending" },
];

export default function ReviewsClient({ reviews }: Props) {
  const [ratingFilter, setRatingFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => reviews.filter(r => {
    if (ratingFilter > 0 && r.rating !== ratingFilter) return false;
    if (statusFilter === "approved" && !r.approved) return false;
    if (statusFilter === "pending"  &&  r.approved) return false;
    return true;
  }), [reviews, ratingFilter, statusFilter]);

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
        <Star className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-semibold">Aucun avis pour l'instant</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Rating filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setRatingFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                ratingFilter === f.value
                  ? "bg-indigo-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block" />

        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s.value
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} avis
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-12 flex flex-col items-center text-slate-400">
          <Star className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm font-semibold">Aucun avis pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{review.nom}</p>
                    <p className="text-xs text-slate-400">
                      {review.product_nom ?? "Produit supprimé"} ·{" "}
                      {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-slate-200"}`}
                        fill={i < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
                )}
                {!review.approved && (
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                    En attente d'approbation
                  </span>
                )}
              </div>
              <ReviewActions reviewId={review.id} approved={review.approved} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
