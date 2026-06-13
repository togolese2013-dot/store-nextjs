import { listReferrals, getSetting } from "@/lib/admin-db";
import PageHeader from "@/components/admin/PageHeader";
import ParrainageClient from "@/components/admin/ParrainageClient";

export const metadata = { title: "Parrainage" };

export default async function ParrainagePage() {
  let referrals: Awaited<ReturnType<typeof listReferrals>> = [];
  try { referrals = await listReferrals(); } catch {}

  const [filleulPct, parrainPct] = await Promise.all([
    getSetting("referral_filleul_pct").then(v => Number(v) || 10).catch(() => 10),
    getSetting("referral_parrain_pct").then(v => Number(v) || 5).catch(() => 5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parrainage"
        subtitle="Gérez les codes de parrainage et suivez les filleuls."
        accent="indigo"
      />
      <ParrainageClient
        initialReferrals={referrals}
        initialFilleulPct={filleulPct}
        initialParrainPct={parrainPct}
      />
    </div>
  );
}
