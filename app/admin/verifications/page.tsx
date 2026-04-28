import VerificationsManager from "@/components/admin/VerificationsManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Vérifications d'identité" };

export default function VerificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérifications d'identité"
        subtitle="Approuvez ou refusez les demandes de vérification KYC"
        accent="green"
      />
      <VerificationsManager />
    </div>
  );
}
