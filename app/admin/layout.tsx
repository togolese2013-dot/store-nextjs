import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getAdminById, getUtilisateurById } from "@/lib/admin-db";
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

  // Redirect livreurs to their dedicated platform
  if (role === "livreur") redirect("/livreur");

  // Force password change on first login
  if (session.must_change_password) redirect("/change-password");

  if (role === "staff") {
    // Team member from utilisateurs — always resolve permissions from DB (JWT may be stale)
    try {
      const dbMember = await getUtilisateurById(Number(session.id));
      if (dbMember?.poste === "Livreur") redirect("/livreur");
      if (dbMember?.permissions) {
        try { permissions = JSON.parse(dbMember.permissions) as AdminPermissions; } catch { /* ignore */ }
      } else {
        permissions = null;
      }
    } catch { /* ignore */ }
  } else if (role !== "super_admin") {
    // Admin user — JWT role may be stale, resolve from admin_users DB
    try {
      const dbUser = await getAdminById(Number(session.id));
      if (dbUser) {
        role = dbUser.role;
        if (dbUser.permissions) {
          try { permissions = JSON.parse(dbUser.permissions) as AdminPermissions; } catch { /* ignore */ }
        }
      } else {
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
