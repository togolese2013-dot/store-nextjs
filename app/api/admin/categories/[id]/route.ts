import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/lib/admin-db";

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const { nom, description = "" } = await req.json();
  if (!nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  await updateCategory(Number(id), nom.trim(), description.trim());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  await deleteCategory(Number(id));
  return NextResponse.json({ success: true });
}
