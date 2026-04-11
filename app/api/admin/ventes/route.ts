import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT v.*,
       (SELECT COUNT(*) FROM vente_items vi WHERE vi.vente_id = v.id) as nb_articles
     FROM ventes v
     ORDER BY v.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) as total FROM ventes"
  ) as any;

  return NextResponse.json({ ventes: rows, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { client_nom, client_telephone, items, remise = 0, montant_recu, note } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Au moins un article requis" }, { status: 400 });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ cnt }]] = await conn.query("SELECT COUNT(*) as cnt FROM ventes") as any;
    const reference = `VTE-${String(cnt + 1).padStart(4, "0")}`;

    const total = items.reduce((s: number, i: any) => s + i.total, 0);
    const totalNet = total - remise;
    const monnaie = Math.max(0, (montant_recu ?? totalNet) - totalNet);

    const [result] = await conn.query(
      `INSERT INTO ventes (reference, client_nom, client_telephone, total, remise, montant_recu, monnaie, note, vendeur_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference, client_nom ?? null, client_telephone ?? null, totalNet, remise, montant_recu ?? totalNet, monnaie, note ?? null, session.id ?? null]
    ) as any;
    const venteId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO vente_items (vente_id, produit_id, produit_nom, produit_ref, variante_nom, quantite, prix_unitaire, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [venteId, item.produit_id, item.produit_nom, item.produit_ref ?? null, item.variante_nom ?? null, item.quantite, item.prix_unitaire, item.total]
      );

      await conn.query(
        `UPDATE stock_boutique SET quantite = GREATEST(0, quantite - ?) WHERE produit_id = ?`,
        [item.quantite, item.produit_id]
      );

      const [[sb]] = await conn.query(
        "SELECT quantite FROM stock_boutique WHERE produit_id = ?",
        [item.produit_id]
      ) as any;
      await conn.query(
        `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, user_id)
         VALUES (?, 'vente', ?, ?, ?, ?)`,
        [item.produit_id, item.quantite, sb?.quantite ?? 0, reference, session.id ?? null]
      );
    }

    await conn.commit();
    return NextResponse.json({ ok: true, reference, venteId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
