import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import type { AdminPermissions } from "@/lib/admin-permissions";
import { getShopById, isShopAccessAllowed } from "@/lib/shops";

export const metadata = {
  title: { template: "%s — Admin", default: "Admin — Togolese Shop" },
  manifest: "/site.webmanifest",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs     = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  // Login / onboarding pages must never be wrapped in AdminShell
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/onboarding")) {
    return <>{children}</>;
  }

  const session = await getAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  // Redirect livreurs to their dedicated platform
  if (session.role === "livreur") redirect("/livreur");

  // Force password change on first login
  if (session.must_change_password) redirect("/change-password");

  // Billing guard — skip for shop #1 (legacy) and billing page itself
  const isBilling = pathname.startsWith("/admin/billing") || pathname.startsWith("/admin/saas");

  if (!isBilling && session.shop_id !== 1) {
    try {
      const shop = await getShopById(session.shop_id);
      if (shop && !isShopAccessAllowed(shop)) {
        redirect("/admin/billing");
      }
    } catch { /* DB unavailable — fail open */ }
  }

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
