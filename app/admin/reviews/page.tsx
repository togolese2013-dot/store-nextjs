import { listReviews } from "@/lib/admin-db";
import ReviewActions from "@/components/admin/ReviewActions";
import { Star } from "lucide-react";

export const metadata = { title: "Avis clients" };

export default async function ReviewsPage() {
  const reviews = await listReviews();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Avis clients</h1>
        <p className="text-slate-500 text-sm mt-1">{reviews.length} avis au total</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 flex flex-col items-center text-slate-400">
          <Star className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-semibold">Aucun avis pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{review.nom}</p>
                    <p className="text-xs text-slate-400">
                      {(review as unknown as { product_nom?: string }).product_nom ?? "Produit supprimé"} ·{" "}
                      {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-slate-200"}`}
                        fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-slate-600 italic">"{review.comment}"</p>}
              </div>
              <ReviewActions reviewId={review.id} approved={review.approved} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
