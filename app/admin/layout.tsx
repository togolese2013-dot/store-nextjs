import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import type { AdminPermissions } from "@/lib/admin-permissions";

export const metadata = {
  title: { template: "%s — Admin", default: "Admin — Togolese Shop" },
  manifest: "/site.webmanifest",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  // Redirect livreurs to their dedicated platform
  if (session.role === "livreur") redirect("/livreur");

  // Force password change on first login
  if (session.must_change_password) redirect("/change-password");

  // Use JWT data directly — AdminShell refreshes the token on mount via /api/admin/auth/refresh
  const role: string                       = session.role;
  const permissions: AdminPermissions | null = session.permissions ?? null;

  return (
    <AdminShell
      nom={session.nom}
      role={role}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  );
}
