import { getAdminSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getBoutiqueClientById, getClientFacturesByNom } from "@/lib/admin-db";
import ClientDetailPage from "@/components/admin/ClientDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoutiqueClientDetailPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const client = await getBoutiqueClientById(Number(id), session.shop_id);
  if (!client) notFound();

  const factures = await getClientFacturesByNom(client.nom, session.shop_id, client.id);

  return <ClientDetailPage client={client} factures={factures} />;
}
