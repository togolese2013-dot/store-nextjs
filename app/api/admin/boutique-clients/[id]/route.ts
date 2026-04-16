import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  getBoutiqueClientById,
  updateBoutiqueClient,
  deleteBoutiqueClient,
} from "@/lib/admin-db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const client = await getBoutiqueClientById(Number(id));
  if (!client) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ success: true, data: client });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await updateBoutiqueClient(Number(id), body);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  await deleteBoutiqueClient(Number(id));
  return NextResponse.json({ success: true });
}
