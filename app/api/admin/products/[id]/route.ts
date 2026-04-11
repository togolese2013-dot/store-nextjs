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
            stock_boutique, remise, neuf, actif, image_url, images } = body;

    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;

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

    // Construire la requête dynamiquement
    const sets = ["reference=?", "nom=?", "description=?", "categorie_id=?", "prix_unitaire=?", "stock_boutique=?"];
    const values = [reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire), Number(stock_boutique ?? 0)];

    if (hasRemise) {
      sets.push("remise=?");
      values.push(Number(remise ?? 0));
    }
    if (hasNeuf) {
      sets.push("neuf=?");
      values.push(neuf ? 1 : 0);
    }
    
    sets.push("actif=?", "image=?");
    values.push(actif !== false ? 1 : 0, image_url ?? null);
    
    if (hasImagesJson) {
      sets.push("images_json=?");
      values.push(imagesJson);
    }

    values.push(Number(id));
    
    await db.execute(
      `UPDATE produits SET ${sets.join(", ")} WHERE id=?`,
      values
    );
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
