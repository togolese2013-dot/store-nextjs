import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createStockSortie } from "@/lib/admin-db";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const { produit_id, entrepot_id, quantite, reference, note } = await req.json();
    if (!produit_id || !entrepot_id || !quantite || quantite <= 0) {
      return NextResponse.json({ error: "produit_id, entrepot_id et quantite (> 0) requis." }, { status: 400 });
    }
    await createStockSortie({ produit_id, entrepot_id, quantite: Number(quantite), reference, note });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
