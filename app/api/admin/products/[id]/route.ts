import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

/* PUT /api/admin/products/[id] */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { nom, reference, description, categorie_id, prix_unitaire,
            stock_magasin, stock_minimum, remise, neuf, actif, image_url, images } = body;

    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;
    const newStockMagasin = Number(stock_magasin ?? 0);

    // Vérifier dynamiquement les colonnes
    const [colRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const colNames = new Set(colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
    const hasRemise = colNames.has("remise");
    const hasNeuf = colNames.has("neuf");
    const hasImagesJson = colNames.has("images_json");
    const hasStockMinimum = colNames.has("stock_minimum");

    // Construire la requête dynamiquement (ne pas toucher stock_boutique — géré par boutique)
    const sets = ["reference=?", "nom=?", "description=?", "categorie_id=?", "prix_unitaire=?"];
    const values: unknown[] = [reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire)];

    if (hasRemise) {
      sets.push("remise=?");
      values.push(Number(remise ?? 0));
    }
    if (hasNeuf) {
      sets.push("neuf=?");
      values.push(neuf ? 1 : 0);
    }
    if (hasStockMinimum) {
      sets.push("stock_minimum=?");
      values.push(Number(stock_minimum ?? 5));
    }

    sets.push("actif=?", "image=?");
    values.push(actif !== false ? 1 : 0, image_url ?? null);

    if (hasImagesJson) {
      sets.push("images_json=?");
      values.push(imagesJson);
    }

    values.push(Number(id));
    await db.execute(`UPDATE produits SET ${sets.join(", ")} WHERE id=?`, values);

    // Auto-adjust stock magasin if changed
    const [stockRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(SUM(stock), 0) AS current_stock FROM produit_stocks WHERE produit_id = ?`,
      [Number(id)]
    );
    const currentStock = Number(stockRows[0]?.current_stock ?? 0);
    const diff = newStockMagasin - currentStock;

    if (diff !== 0) {
      await db.execute(
        `INSERT INTO produit_stocks (produit_id, entrepot_id, stock)
         VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE stock = GREATEST(0, stock + VALUES(stock))`,
        [Number(id), diff]
      );
      await db.execute(
        `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note)
         VALUES (?, 'ajustement', ?, ?, 'Ajustement via fiche produit')`,
        [Number(id), Math.abs(diff), newStockMagasin]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* DELETE /api/admin/products/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  await db.execute("UPDATE produits SET actif = 0 WHERE id = ?", [Number(id)]);
  return NextResponse.json({ ok: true });
}
