import { getAdminSession } from "@/lib/auth";
import { getAdminById, getUtilisateurById } from "@/lib/admin-db";
import { getShopById } from "@/lib/shops";
import type { AdminPermissions } from "@/lib/admin-permissions";
import { getAccessibleModules } from "@/lib/admin-permissions";
import { redirect } from "next/navigation";
import AdminWorkspaceClient from "./AdminWorkspaceClient";
import type { WorkspaceId } from "@/components/workspace-selector/types";

export const metadata = { title: "Accueil Admin" };

const WORKSPACE_IDS: WorkspaceId[] = ['magasin', 'boutique', 'store', 'crm', 'admin'];

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  let role        = session.role ?? "";
  let permissions: AdminPermissions | null = session.permissions ?? null;

  if (session && role === "staff") {
    try {
      const dbMember = await getUtilisateurById(Number(session.id));
      if (dbMember?.permissions) {
        try { permissions = JSON.parse(dbMember.permissions) as AdminPermissions; } catch { /* ignore */ }
      } else {
        permissions = null;
      }
    } catch { /* ignore */ }
  } else if (session && role !== "super_admin") {
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

  const accessible = new Set(getAccessibleModules(role, permissions));
  const workspaceIds = WORKSPACE_IDS.filter(id => accessible.has(id));

  const shop = await getShopById(session.shop_id).catch(() => null);
  const shopName = shop?.nom ?? "Maison Diallo";

  return (
    <AdminWorkspaceClient
      workspaceIds={workspaceIds}
      shopName={shopName}
      shopLocation={shop?.pays ?? ''}
      userName={session.nom}
      shopPlan={shop?.plan ?? 'free'}
      shopStatus={shop?.subscription_status ?? 'active'}
      shopTrialEndsAt={shop?.trial_ends_at ?? null}
      shopPeriodEnd={shop?.current_period_end ?? null}
    />
  );
}
