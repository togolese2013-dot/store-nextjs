import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listLivreurs, createLivreur } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const livreurs = await listLivreurs();
  return NextResponse.json({ items: livreurs });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const { nom, telephone } = await req.json();
    if (!nom?.trim()) return NextResponse.json({ error: "nom requis." }, { status: 400 });
    const livreur = await createLivreur({ nom: nom.trim(), telephone });
    return NextResponse.json({ ok: true, livreur });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
