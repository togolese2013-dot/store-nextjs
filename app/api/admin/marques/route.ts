import { getAdminSession } from "@/lib/auth";
import { listAdminMarques, createMarque } from "@/lib/admin-db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const marques = await listAdminMarques();
  return NextResponse.json(marques);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { nom, description = "" } = await req.json();
  if (!nom?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  const id = await createMarque({ nom: nom.trim(), description: description.trim() });
  return NextResponse.json({ id }, { status: 201 });
}
