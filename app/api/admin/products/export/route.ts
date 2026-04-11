import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    // Vérifier dynamiquement les colonnes
    const [colRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'
       ORDER BY ORDINAL_POSITION`
    );
    const colNames = colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase());
    
    const hasRemise = colNames.includes("remise");
    const hasNeuf = colNames.includes("neuf");
    const hasImageUrl = colNames.includes("image_url");
    const hasImage = colNames.includes("image");
    const hasImagesJson = colNames.includes("images_json");
    const hasVariationsJson = colNames.includes("variations_json");
    
    const imageCol = hasImageUrl ? "p.image_url" : hasImage ? "p.image" : "NULL";

    // Récupérer tous les produits actifs avec leurs catégories
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT 
         p.id,
         p.reference,
         p.nom,
         p.description,
         p.categorie_id,
         c.nom AS categorie_nom,
         p.prix_unitaire,
         p.stock_boutique,
         ${hasRemise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
         ${hasNeuf ? "COALESCE(p.neuf, 0)" : "0"} AS neuf,
         ${imageCol} AS image_url,
         ${hasImagesJson ? "p.images_json" : "NULL"} AS images_json,
         ${hasVariationsJson ? "p.variations_json" : "NULL"} AS variations_json,
         p.actif,
         p.date_creation,
         p.created_at
       FROM produits p
       LEFT JOIN categories c ON p.categorie_id = c.id
       WHERE p.actif = 1
       ORDER BY p.id`
    );

    // Préparer les en-têtes CSV
    const headers = [
      "id",
      "reference",
      "nom",
      "description",
      "categorie_id",
      "categorie_nom",
      "prix_unitaire",
      "stock_boutique",
      "remise",
      "neuf",
      "image_url",
      "images_json",
      "variations_json",
      "actif",
      "date_creation",
      "created_at"
    ];

    // Convertir les données en lignes CSV
    const csvRows = rows.map((row) => {
      return headers.map((header) => {
        const value = row[header];
        
        // Gérer les valeurs spéciales
        if (value === null || value === undefined) return "";
        
        // Échapper les guillemets et les virgules pour CSV
        let stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      });
    });

    // Créer le contenu CSV
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Créer la réponse avec le fichier CSV
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set("Content-Disposition", `attachment; filename="produits-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;

  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}