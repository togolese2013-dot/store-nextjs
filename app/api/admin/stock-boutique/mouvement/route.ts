import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createBoutiqueMouvement } from "@/lib/admin-db";

/* POST /api/admin/stock-boutique/mouvement */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const body = await req.json();
    const { produit_id, type, quantite, motif, ref_commande } = body;

    if (!produit_id || !type || !quantite) {
      return NextResponse.json({ error: "produit_id, type et quantite sont requis." }, { status: 400 });
    }
    if (!["entree", "sortie", "retrait", "ajustement"].includes(type)) {
      return NextResponse.json({ error: "Type de mouvement invalide." }, { status: 400 });
    }
    if (Number(quantite) <= 0) {
      return NextResponse.json({ error: "La quantité doit être supérieure à 0." }, { status: 400 });
    }

    await createBoutiqueMouvement({
      produit_id:   Number(produit_id),
      type,
      quantite:     Number(quantite),
      motif:        motif  || undefined,
      ref_commande: ref_commande || undefined,
      admin_id:     session.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
