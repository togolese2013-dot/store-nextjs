import TombolaManager from "@/components/admin/TombolaManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Tombola" };

export default function TombolaPage() {
  return (
    <div className="flex flex-col h-full gap-4">
      <PageHeader title="Tombola" subtitle="Tirage au sort parmi les clients éligibles" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TombolaManager />
      </div>
    </div>
  );
}
