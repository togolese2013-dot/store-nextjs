import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getUtilisateurById, getAdminById } from "@/lib/admin-db";
import "@/components/livreur-app/livreur.css";

export const metadata = { title: "Espace Livreur — Togolese Shop" };

export default async function LivreurLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login?redirect=/livreur");
  if (session.must_change_password) redirect("/change-password");

  if (session.role === "staff") {
    const member = await getUtilisateurById(Number(session.id));
    if (!member || member.poste !== "Livreur") redirect("/admin");
  } else if (session.role === "livreur") {
    const admin = await getAdminById(Number(session.id));
    if (!admin || admin.poste !== "Livreur") redirect("/admin");
  } else {
    redirect("/admin");
  }

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {children}
    </div>
  );
}
