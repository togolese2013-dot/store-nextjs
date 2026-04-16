import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateUtilisateur, deleteUtilisateur } from "@/lib/admin-db";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body   = await req.json();

  // Hash password if provided
  if (body.motDePasse) {
    body.motDePasse = await bcrypt.hash(body.motDePasse, 12);
  }

  await updateUtilisateur(Number(id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  await deleteUtilisateur(Number(id));
  return NextResponse.json({ ok: true });
}
