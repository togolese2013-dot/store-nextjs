import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createStockAjustement } from "@/lib/admin-db";
import { emitAdminEvent } from "@/lib/admin-events";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const { produit_id, quantite, motif } = await req.json();
    if (!produit_id || quantite === undefined || quantite === null) {
      return NextResponse.json({ error: "produit_id et quantite requis." }, { status: 400 });
    }
    if (!motif?.trim()) {
      return NextResponse.json({ error: "Un motif est requis pour un ajustement." }, { status: 400 });
    }
    await createStockAjustement({ produit_id, quantite: Number(quantite), motif });
    emitAdminEvent("stock");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
