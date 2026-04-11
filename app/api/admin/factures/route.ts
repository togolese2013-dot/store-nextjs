import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [ventes] = await db.query(
    `SELECT v.*, GROUP_CONCAT(vi.produit_nom ORDER BY vi.id SEPARATOR ', ') as produits_list,
            COUNT(vi.id) as nb_articles
     FROM ventes v
     LEFT JOIN vente_items vi ON vi.vente_id = v.id
     WHERE v.statut = 'validee'
     GROUP BY v.id
     ORDER BY v.created_at DESC
     LIMIT 50`
  );

  return NextResponse.json({ factures: ventes });
}
