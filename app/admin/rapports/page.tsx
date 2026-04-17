import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RapportsManager from "@/components/admin/RapportsManager";

export const metadata = { title: "Rapports — Admin" };

export default async function RapportsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <RapportsManager />;
}
