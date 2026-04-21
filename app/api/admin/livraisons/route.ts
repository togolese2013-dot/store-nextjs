import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listLivraisonsAdmin, createManualLivraison } from "@/lib/admin-db";
import { emitAdminEvent } from "@/lib/admin-events";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const sp     = req.nextUrl.searchParams;
  const search = sp.get("q")      || undefined;
  const statut = sp.get("statut") || undefined;
  const limit  = Math.min(100, Number(sp.get("limit"))  || 50);
  const offset = Math.max(0,   Number(sp.get("offset")) || 0);
  const { items, total } = await listLivraisonsAdmin({ search, statut, limit, offset });
  return NextResponse.json({ items, total });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const body = await req.json();
    const { client_nom, client_tel, adresse, contact_livraison, lien_localisation, note } = body;
    if (!client_nom?.trim()) {
      return NextResponse.json({ error: "Nom du client requis." }, { status: 400 });
    }
    const id = await createManualLivraison({ client_nom, client_tel, adresse, contact_livraison, lien_localisation, note });
    emitAdminEvent("livraison");
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
