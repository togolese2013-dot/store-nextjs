import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getUtilisateurById, getAdminById } from "@/lib/admin-db";

export const metadata = { title: "Espace Livreur — Togolese Shop" };

export default async function LivreurLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login?redirect=/livreur");

  // Force password change on first login
  if (session.must_change_password) redirect("/change-password");

  // Accept livreurs from utilisateurs (role staff) OR admin_users (role livreur)
  let nomLivreur = session.nom;
  if (session.role === "staff") {
    const member = await getUtilisateurById(Number(session.id));
    if (!member || member.poste !== "Livreur") redirect("/admin");
    nomLivreur = member.nom;
  } else if (session.role === "livreur") {
    const admin = await getAdminById(Number(session.id));
    if (!admin || admin.poste !== "Livreur") redirect("/admin");
    nomLivreur = admin.nom;
  } else {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Espace Livreur</p>
              <p className="text-xs text-slate-400 leading-none mt-0.5">{nomLivreur}</p>
            </div>
          </div>
          <a
            href="/api/admin/auth/logout"
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium px-2 py-1"
          >
            Déconnexion
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {children}
      </main>
    </div>
  );
}
