import { listReferrals } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import ParrainageClient from "@/components/admin/ParrainageClient";

export const metadata = { title: "Parrainage" };

export default async function ParrainagePage() {
  let referrals: Awaited<ReturnType<typeof listReferrals>> = [];
  try { referrals = await listReferrals(); } catch { /* table may not exist */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parrainage"
        subtitle="Gérez les codes de parrainage et suivez les filleuls."
        accent="indigo"
      />
      <ParrainageClient initialReferrals={referrals} />
    </div>
  );
}
