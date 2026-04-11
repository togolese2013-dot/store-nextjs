import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filtre = searchParams.get("filtre") ?? "tous";

  let whereClause = "";
  if (filtre === "disponible") whereClause = "AND sb.quantite > sb.seuil_alerte";
  else if (filtre === "faible")     whereClause = "AND sb.quantite > 0 AND sb.quantite <= sb.seuil_alerte";
  else if (filtre === "epuise")     whereClause = "AND sb.quantite = 0";

  const [stocks] = await db.query(
    `SELECT sb.*, p.nom as produit_nom, p.reference as produit_ref,
            p.prix_unitaire as prix_unitaire, c.nom as categorie_nom
     FROM stock_boutique sb
     JOIN produits p ON p.id = sb.produit_id
     LEFT JOIN categories c ON c.id = p.categorie_id
     WHERE 1=1 ${whereClause}
     ORDER BY p.nom ASC`
  );

  const [[stats]] = await db.query(`
    SELECT
      COUNT(*) as total_produits,
      SUM(CASE WHEN quantite = 0 THEN 1 ELSE 0 END) as ruptures,
      SUM(CASE WHEN quantite > 0 AND quantite <= seuil_alerte THEN 1 ELSE 0 END) as faibles,
      SUM(CASE WHEN quantite > seuil_alerte THEN 1 ELSE 0 END) as disponibles
    FROM stock_boutique
  `) as any;

  const [[entrees]] = await db.query(
    "SELECT COALESCE(SUM(quantite), 0) as total FROM stock_mouvements WHERE type = 'entree'"
  ) as any;
  const [[retraits]] = await db.query(
    "SELECT COALESCE(SUM(quantite), 0) as total FROM stock_mouvements WHERE type = 'retrait'"
  ) as any;

  return NextResponse.json({
    stocks,
    stats: { ...stats, total_entrees: entrees.total, total_retraits: retraits.total },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { produit_id, type, quantite, note } = await req.json();

  if (!produit_id || !type || !quantite) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const conn = await db.getConnection();
  try {
    if (type === "entree") {
      await conn.query(
        `INSERT INTO stock_boutique (produit_id, quantite) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)`,
        [produit_id, quantite]
      );
    } else if (type === "retrait") {
      await conn.query(
        `UPDATE stock_boutique SET quantite = GREATEST(0, quantite - ?) WHERE produit_id = ?`,
        [quantite, produit_id]
      );
    }

    const [[sb]] = await conn.query(
      "SELECT quantite FROM stock_boutique WHERE produit_id = ?",
      [produit_id]
    ) as any;

    await conn.query(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [produit_id, type, quantite, sb?.quantite ?? 0, note ?? null, session.id ?? null]
    );

    return NextResponse.json({ ok: true, stock_apres: sb?.quantite ?? 0 });
  } finally {
    conn.release();
  }
}
