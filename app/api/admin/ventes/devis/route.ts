import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listDevis, createDevis } from "@/lib/admin-db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const sp     = req.nextUrl.searchParams;
    const search = sp.get("q") || undefined;
    const statut = sp.get("statut") || undefined;
    const limit  = Math.min(100, Number(sp.get("limit")) || 50);
    const offset = Math.max(0, Number(sp.get("offset")) || 0);
    const { items, total } = await listDevis({ search, statut, limit, offset });
    return NextResponse.json({ items, total });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.client_nom || !body.items?.length)
      return NextResponse.json({ error: "client_nom et items sont requis." }, { status: 400 });
    const id = await createDevis({ ...body, admin_id: session.id });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
