import { getAdminSession } from "@/lib/auth";
import { updateMarque, deleteMarque } from "@/lib/admin-db";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { nom, description = "" } = await req.json();
  if (!nom?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  await updateMarque(Number(id), { nom: nom.trim(), description: description.trim() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  await deleteMarque(Number(id));
  return NextResponse.json({ ok: true });
}
