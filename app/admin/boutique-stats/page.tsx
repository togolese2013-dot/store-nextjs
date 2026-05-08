import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// ssr: false — recharts and date calculations are browser-only
const BoutiqueStatsManager = dynamic(
  () => import("@/components/admin/BoutiqueStatsManager"),
  { ssr: false, loading: () => null }
);

export const metadata = { title: "Statistiques — Boutique" };

export default async function BoutiqueStatsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <BoutiqueStatsManager />;
}
