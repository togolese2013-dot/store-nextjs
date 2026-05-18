import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdminSession } from "@/lib/auth";
import { getUtilisateurById, getAdminById } from "@/lib/admin-db";

export default async function LivreurProtectedLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host") ?? "";
  const isSubdomain = host.startsWith("livraison.");
  const mainHost    = host.replace(/^livraison\./, "");

  const loginUrl = isSubdomain ? "/login" : "/livreur/login";
  const adminUrl = isSubdomain ? `https://${mainHost}/admin` : "/admin";
  const cpUrl    = isSubdomain ? `https://${mainHost}/change-password` : "/change-password";

  const session = await getAdminSession();
  if (!session) redirect(loginUrl);
  if (session.must_change_password) redirect(cpUrl);

  if (session.role === "staff") {
    const member = await getUtilisateurById(Number(session.id));
    if (!member || member.poste !== "Livreur") redirect(adminUrl);
  } else if (session.role === "livreur") {
    const admin = await getAdminById(Number(session.id));
    if (!admin || admin.poste !== "Livreur") redirect(adminUrl);
  } else {
    redirect(adminUrl);
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
