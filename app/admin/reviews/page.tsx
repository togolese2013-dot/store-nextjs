import { listReviews } from "@/lib/admin-db";
import ReviewsClient from "@/components/admin/ReviewsClient";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Avis clients" };

export default async function ReviewsPage() {
  const reviews = await listReviews();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avis clients"
        subtitle={`${reviews.length} avis au total`}
        accent="indigo"
      />
      <ReviewsClient reviews={reviews} />
    </div>
  );
}
