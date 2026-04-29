import { getAdminSession } from "@/lib/auth";
import { getAdminById } from "@/lib/admin-db";
import AdminShell from "@/components/admin/AdminShell";
import type { AdminPermissions } from "@/lib/admin-permissions";

export const metadata = { title: { template: "%s — Admin", default: "Admin — Togolese Shop" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  let role        = session.role;
  let permissions: AdminPermissions | null = session.permissions ?? null;

  // For staff (team members from utilisateurs): trust JWT permissions as-is.
  // For other non-super_admin roles: JWT may be stale — resolve from admin_users DB.
  if (role !== "super_admin" && role !== "staff") {
    try {
      const dbUser = await getAdminById(Number(session.id));
      if (dbUser) {
        role = dbUser.role;
        if (dbUser.permissions) {
          try { permissions = JSON.parse(dbUser.permissions) as AdminPermissions; } catch { /* ignore */ }
        }
      } else {
        // Old admin JWT not found in DB — grant full access (backward compat)
        role = "super_admin";
      }
    } catch {
      role = "super_admin";
    }
  }

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
