import { listAdminUsers, listUtilisateurs, listPermissions, listAllUtilisateurModules } from "@/lib/admin-db";
import type { AdminUser, Utilisateur, Permission } from "@/lib/admin-db";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic  = "force-dynamic";
export const metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  let adminUsers:      AdminUser[]            = [];
  let utilisateurs:    Utilisateur[]          = [];
  let permissions:     Permission[]           = [];
  let teamModules:     Record<number, string[]> = {};
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

  if (errMsg) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-bold mb-2">Erreur lors du chargement</p>
          <code className="text-xs font-mono bg-red-100 px-2 py-1 rounded">{errMsg}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <UsersManager
        adminUsers={adminUsers}
        initialUtilisateurs={utilisateurs}
        allPermissions={permissions}
        teamModules={teamModules}
      />
    </div>
  );
}
