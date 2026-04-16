import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  listFinanceEntries,
  getFinanceStats,
  createFinanceEntry,
} from "@/lib/admin-db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const sp     = req.nextUrl.searchParams;
    const type   = sp.get("type")   || undefined;
    const search = sp.get("q")      || undefined;
    const limit  = Math.min(100, Number(sp.get("limit"))  || 50);
    const offset = Math.max(0,   Number(sp.get("offset")) || 0);
    const [{ items, total }, stats] = await Promise.all([
      listFinanceEntries({ type, search, limit, offset }),
      getFinanceStats(),
    ]);
    return NextResponse.json({ items, total, stats });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const body = await req.json();
    const { type, mode_paiement, categorie, description, montant, date_entree } = body;
    if (!type || !montant || !date_entree) {
      return NextResponse.json({ error: "type, montant et date_entree sont requis." }, { status: 400 });
    }
    const id = await createFinanceEntry({ type, mode_paiement, categorie, description, montant: Number(montant), date_entree });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
