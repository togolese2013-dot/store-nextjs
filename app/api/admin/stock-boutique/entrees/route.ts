import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

/* GET /api/admin/stock-boutique/entrees?q=&limit=&offset= */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const sp     = req.nextUrl.searchParams;
    const q      = sp.get("q") || "";
    const limit  = Math.min(200, Math.max(1, Number(sp.get("limit")) || 50));
    const offset = Math.max(0, Number(sp.get("offset")) || 0);

    const conditions = ["bm.type = 'entree'"];
    const params: (string | number)[] = [];

    if (q) {
      conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      `SELECT bm.id, bm.produit_id, p.nom AS nom_produit, p.reference,
              bm.quantite, bm.motif, bm.ref_commande, bm.created_at
       FROM boutique_mouvements bm
       JOIN produits p ON p.id = bm.produit_id
       ${where}
       ORDER BY bm.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    const [cnt] = await (db as import("mysql2/promise").Pool).query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt
       FROM boutique_mouvements bm
       JOIN produits p ON p.id = bm.produit_id
       ${where}`,
      params
    );

    return NextResponse.json({ items: rows, total: Number(cnt[0]?.cnt ?? 0) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
