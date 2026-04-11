import { listAdminUsers } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersManager from "@/components/admin/UsersManager";

export const metadata = { title: "Utilisateurs admin" };

export default async function UsersPage() {
  const session = await getAdminSession();
  if (session?.role !== "super_admin") redirect("/admin");

  const users = await listAdminUsers();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-800 text-2xl text-slate-900">Utilisateurs admin</h1>
        <p className="text-slate-500 text-sm mt-1">Gérez les comptes ayant accès au panneau d'administration.</p>
      </div>
      <UsersManager users={users} currentSessionId={session!.id} />
    </div>
  );
}
