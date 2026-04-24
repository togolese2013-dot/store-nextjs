import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminZoneLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <>{children}</>;
}
