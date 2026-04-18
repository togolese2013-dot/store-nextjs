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

    const [colRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const colNames = new Set(colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));

    const sets = ["reference=?", "nom=?", "description=?", "categorie_id=?", "prix_unitaire=?"];
    const values: (string | number | boolean | null | Buffer)[] = [
      reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire),
    ];

    // Stock magasin — direct column
    if (colNames.has("stock_magasin")) {
      sets.push("stock_magasin=?");
      values.push(newStockMagasin);
    }

    if (colNames.has("remise"))         { sets.push("remise=?");         values.push(Number(remise ?? 0)); }
    if (colNames.has("neuf"))           { sets.push("neuf=?");           values.push(neuf ? 1 : 0); }
    if (colNames.has("stock_minimum"))  { sets.push("stock_minimum=?");  values.push(Number(stock_minimum ?? 5)); }

    sets.push("actif=?");
    values.push(actif !== false ? 1 : 0);

    // Image: prefer image_url column, fallback to image
    if (colNames.has("image_url")) {
      sets.push("image_url=?");
      values.push(image_url ?? null);
    } else if (colNames.has("image")) {
      sets.push("image=?");
      values.push(image_url ?? null);
    }

    if (colNames.has("images_json")) {
      sets.push("images_json=?");
      values.push(imagesJson);
    }

    values.push(Number(id));
    await db.execute(`UPDATE produits SET ${sets.join(", ")} WHERE id=?`, values);

    // Log stock movement if value changed
    try {
      await db.execute(
        `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note)
         VALUES (?, 'ajustement', ?, ?, 'Ajustement via fiche produit')`,
        [Number(id), newStockMagasin, newStockMagasin]
      );
    } catch { /* stock_mouvements may not exist */ }

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
  await db.execute("DELETE FROM produits WHERE id = ?", [Number(id)]);
  return NextResponse.json({ ok: true });
}
