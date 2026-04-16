import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import BoutiqueSegmentation from "@/components/admin/BoutiqueSegmentation";

export default async function BoutiqueSegmentationPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <BoutiqueSegmentation />;
}
