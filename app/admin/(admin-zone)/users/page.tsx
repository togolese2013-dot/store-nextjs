import { listUtilisateurs, listPermissions } from "@/lib/admin-db";
import type { Utilisateur, Permission } from "@/lib/admin-db";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic  = "force-dynamic";
export const metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  let utilisateurs: Utilisateur[] = [];
  let permissions:  Permission[]  = [];
  let errMsg = "";

  try {
    [utilisateurs, permissions] = await Promise.all([
      listUtilisateurs(),
      listPermissions(),
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
        initialUtilisateurs={utilisateurs}
        allPermissions={permissions}
      />
    </div>
  );
}
