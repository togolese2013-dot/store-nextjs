import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'
       ORDER BY ORDINAL_POSITION`
    );
    
    const columns = rows.map((r) => (r.COLUMN_NAME as string).toLowerCase());
    
    return NextResponse.json({
      columns,
      hasRemise: columns.includes("remise"),
      hasNeuf: columns.includes("neuf"),
      hasImageUrl: columns.includes("image_url"),
      hasImage: columns.includes("image"),
      hasImagesJson: columns.includes("images_json"),
      hasVariationsJson: columns.includes("variations_json"),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des colonnes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}