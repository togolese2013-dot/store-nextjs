import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listFactures, createVenteWithStock, getVentesStats } from "@/lib/admin-db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const sp     = req.nextUrl.searchParams;
    const search = sp.get("q") || undefined;
    const statut = sp.get("statut") || undefined;
    const limit  = Math.min(100, Number(sp.get("limit")) || 50);
    const offset = Math.max(0, Number(sp.get("offset")) || 0);
    const [{ items, total }, stats] = await Promise.all([
      listFactures({ search, statut, limit, offset }),
      getVentesStats(),
    ]);
    return NextResponse.json({ items, total, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE"))
      return NextResponse.json({ error: "migration_needed" }, { status: 503 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.client_nom || !body.items?.length)
      return NextResponse.json({ error: "client_nom et items sont requis." }, { status: 400 });
    const id = await createVenteWithStock({ ...body, admin_id: session.id });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
