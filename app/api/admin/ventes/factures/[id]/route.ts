import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateFactureStatut, deleteFacture, getFactureById } from "@/lib/admin-db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const facture = await getFactureById(Number(id));
  if (!facture) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(facture);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const { statut } = await req.json();
  if (!statut) return NextResponse.json({ error: "statut requis." }, { status: 400 });
  await updateFactureStatut(Number(id), statut);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  await deleteFacture(Number(id));
  return NextResponse.json({ ok: true });
}
