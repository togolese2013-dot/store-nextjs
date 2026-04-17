import { getAdminSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: { template: "%s — Admin", default: "Admin — Togolese Shop" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  /* No session = login page */
  if (!session) {
    return <>{children}</>;
  }

  return (
    <AdminShell nom={session.nom} role={session.role}>
      {children}
    </AdminShell>
  );
}
