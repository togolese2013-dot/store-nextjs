import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createStockEntree } from "@/lib/admin-db";
import { emitAdminEvent } from "@/lib/admin-events";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const { produit_id, quantite, reference, note } = await req.json();
    if (!produit_id || !quantite || quantite <= 0) {
      return NextResponse.json({ error: "produit_id et quantite (> 0) requis." }, { status: 400 });
    }
    await createStockEntree({ produit_id, quantite: Number(quantite), reference, note });
    emitAdminEvent("stock");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
