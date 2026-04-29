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

  // JWT role may be stale (old backend) — resolve from DB
  if (role !== "super_admin") {
    try {
      const dbUser = await getAdminById(Number(session.id));
      if (dbUser) {
        role = dbUser.role;
        if (dbUser.permissions) {
          try { permissions = JSON.parse(dbUser.permissions) as AdminPermissions; } catch { /* ignore */ }
        }
      } else {
        // User not found in DB but JWT is valid — grant full access
        role = "super_admin";
      }
    } catch {
      // DB unreachable — JWT is valid so grant full access
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
