import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ success: true, products: [] });

  // Vérifier dynamiquement les colonnes
  const [colRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const colNames = new Set(colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
  const hasRemise = colNames.has("remise");
  const hasImageUrl = colNames.has("image_url");
  const hasImage = colNames.has("image");
  
  const imageCol = hasImageUrl ? "p.image_url" : hasImage ? "p.image" : "NULL";

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT 
       p.id, p.nom, p.reference, p.prix_unitaire,
       ${hasRemise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
       ${imageCol} AS image_url,
       c.nom AS categorie_nom
     FROM produits p
     LEFT JOIN categories c ON p.categorie_id = c.id
     WHERE p.actif = 1 AND (p.nom LIKE ? OR p.reference LIKE ?)
     ORDER BY p.nom ASC LIMIT 10`,
    [`%${q}%`, `%${q}%`]
  );

  const products = rows.map((r) => ({
    id: Number(r.id),
    nom: r.nom as string,
    reference: r.reference as string,
    prix_unitaire: Number(r.prix_unitaire),
    remise: Number(r.remise),
    image_url: (r.image_url ?? null) as string | null,
    categorie_nom: (r.categorie_nom ?? null) as string | null,
  }));

  return NextResponse.json({ success: true, products });
}
