import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listAchats, countAchats, getAchatStats, createAchat } from "@/lib/admin-db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const sp     = req.nextUrl.searchParams;
  const page   = Math.max(1, Number(sp.get("page")) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;

  const [achats, total, stats] = await Promise.all([
    listAchats(limit, offset),
    countAchats(),
    getAchatStats(),
  ]);

  return NextResponse.json({ achats, total, stats, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const body = await req.json();
    const { fournisseur_id, reference, date_achat, statut, note, items } = body;

    if (!reference?.trim()) return NextResponse.json({ error: "La référence est obligatoire." }, { status: 400 });
    if (!date_achat)         return NextResponse.json({ error: "La date est obligatoire." }, { status: 400 });
    if (!items?.length)      return NextResponse.json({ error: "Au moins un article est requis." }, { status: 400 });

    const id = await createAchat({ fournisseur_id: fournisseur_id ?? null, reference, date_achat, statut: statut ?? "en_attente", note: note ?? null, items });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
