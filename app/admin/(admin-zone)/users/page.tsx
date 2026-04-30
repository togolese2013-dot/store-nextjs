import { listAdminUsers, listUtilisateurs, listPermissions, listAllUtilisateurModules } from "@/lib/admin-db";
import type { AdminUser, Utilisateur, Permission } from "@/lib/admin-db";
import UsersManager from "@/components/admin/UsersManager";
import AdminZonePage from "@/components/admin/AdminZonePage";
import { Users } from "lucide-react";

export const dynamic  = "force-dynamic";
export const metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  let adminUsers:   AdminUser[]              = [];
  let utilisateurs: Utilisateur[]            = [];
  let permissions:  Permission[]             = [];
  let teamModules:  Record<number, string[]> = {};
  let errMsg = "";

  try {
    [adminUsers, utilisateurs, permissions, teamModules] = await Promise.all([
      listAdminUsers(),
      listUtilisateurs(),
      listPermissions(),
      listAllUtilisateurModules(),
    ]);
  } catch (err) {
    errMsg = err instanceof Error ? err.message : String(err);
    console.error("[UsersPage]", err);
  }

  return (
    <AdminZonePage
      title="Utilisateurs"
      description="Gérez les comptes administrateurs, l'équipe opérationnelle et les niveaux d'accès."
      icon={Users}
      iconClass="bg-indigo-100 text-indigo-700"
      maxWidth="5xl"
    >
      {errMsg ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-bold mb-2">Erreur lors du chargement</p>
          <code className="text-xs font-mono bg-red-100 px-2 py-1 rounded">{errMsg}</code>
        </div>
      ) : (
        <UsersManager
          adminUsers={adminUsers}
          initialUtilisateurs={utilisateurs}
          allPermissions={permissions}
          teamModules={teamModules}
        />
      )}
    </AdminZonePage>
  );
}
