import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import AnalyticsClient from "@/components/admin/AnalyticsClient";

export const metadata = { title: "Analytics — Site vitrine" };

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Trafic et comportement des visiteurs du site vitrine"
      />
      <AnalyticsClient />
    </div>
  );
}
