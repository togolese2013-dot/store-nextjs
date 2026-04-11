import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getClientById, upsertClient, deleteClient, getClientOrders, getClientStats } from "@/lib/admin-db";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await getClientById(Number(id));
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const [orders, stats] = await Promise.all([
    getClientOrders(client.telephone),
    getClientStats(client.telephone),
  ]);

  return NextResponse.json({ success: true, data: { client, orders, stats } });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await getClientById(Number(id));
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const body = await req.json();
  await upsertClient({ ...body, telephone: client.telephone });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  await deleteClient(Number(id));
  return NextResponse.json({ success: true });
}
