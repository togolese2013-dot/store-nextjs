import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listFournisseurs, createFournisseur } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const fournisseurs = await listFournisseurs();
  return NextResponse.json({ fournisseurs });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const body = await req.json();
    const { nom, contact, telephone, email, adresse, note } = body;
    if (!nom?.trim()) return NextResponse.json({ error: "Le nom est obligatoire." }, { status: 400 });

    const id = await createFournisseur({ nom, contact, telephone, email, adresse, note });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
