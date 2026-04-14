import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateDevisStatut, deleteDevis } from "@/lib/admin-db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const { statut } = await req.json();
  if (!statut) return NextResponse.json({ error: "statut requis." }, { status: 400 });
  await updateDevisStatut(Number(id), statut);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  await deleteDevis(Number(id));
  return NextResponse.json({ ok: true });
}
