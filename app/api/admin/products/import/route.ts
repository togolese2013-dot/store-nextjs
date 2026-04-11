import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";
import { parse } from "csv-parse/sync";

interface CSVProduct {
  reference: string;
  nom: string;
  description?: string;
  categorie_id?: string;
  prix_unitaire: string;
  stock_boutique?: string;
  remise?: string;
  neuf?: string;
  image_url?: string;
  actif?: string;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier l'extension
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Le fichier doit être au format CSV" }, { status: 400 });
    }

    // Lire le contenu du fichier
    const fileContent = await file.text();
    
    // Parser le CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as CSVProduct[];

    if (records.length === 0) {
      return NextResponse.json({ error: "Le fichier CSV est vide" }, { status: 400 });
    }

    // Vérifier dynamiquement les colonnes de la table
    const [colRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const colNames = new Set(colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
    const hasRemise = colNames.has("remise");
    const hasNeuf = colNames.has("neuf");
    const hasImagesJson = colNames.has("images_json");

    // Valider et traiter chaque ligne
    const results = {
      total: records.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; reference: string; error: string }>,
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 car ligne 1 = en-têtes, et i commence à 0

      try {
        // Validation des champs obligatoires
        if (!row.reference?.trim()) {
          results.errors.push({ row: rowNumber, reference: "", error: "Référence manquante" });
          results.skipped++;
          continue;
        }
        if (!row.nom?.trim()) {
          results.errors.push({ row: rowNumber, reference: row.reference, error: "Nom manquant" });
          results.skipped++;
          continue;
        }
        if (!row.prix_unitaire || isNaN(Number(row.prix_unitaire))) {
          results.errors.push({ row: rowNumber, reference: row.reference, error: "Prix unitaire invalide" });
          results.skipped++;
          continue;
        }

        // Nettoyer et formater les données
        const reference = row.reference.trim().toLowerCase().replace(/\s+/g, "-");
        const nom = row.nom.trim();
        const description = row.description?.trim() || null;
        const categorie_id = row.categorie_id ? Number(row.categorie_id) : null;
        const prix_unitaire = Math.max(0, Number(row.prix_unitaire));
        const stock_boutique = row.stock_boutique ? Math.max(0, Number(row.stock_boutique)) : 0;
        const remise = hasRemise && row.remise ? Math.max(0, Math.min(99, Number(row.remise))) : 0;
        const neuf = hasNeuf && row.neuf ? (row.neuf.toLowerCase() === "true" || row.neuf === "1") : false;
        const image_url = row.image_url?.trim() || null;
        const actif = row.actif === undefined ? true : (row.actif.toLowerCase() === "true" || row.actif === "1");

        // Vérifier si le produit existe déjà (par référence)
        const [existing] = await db.execute<mysql.RowDataPacket[]>(
          "SELECT id FROM produits WHERE reference = ?",
          [reference]
        );

        if (existing.length > 0) {
          // Mise à jour du produit existant
          const productId = existing[0].id;
          
          // Construire la requête UPDATE dynamiquement
          const sets = [
            "nom = ?",
            "description = ?",
            "categorie_id = ?",
            "prix_unitaire = ?",
            "stock_boutique = ?",
            "actif = ?",
            "image = ?"
          ];
          const values = [
            nom,
            description,
            categorie_id,
            prix_unitaire,
            stock_boutique,
            actif ? 1 : 0,
            image_url
          ];

          if (hasRemise) {
            sets.push("remise = ?");
            values.push(remise);
          }
          if (hasNeuf) {
            sets.push("neuf = ?");
            values.push(neuf ? 1 : 0);
          }

          values.push(productId);

          await db.execute(
            `UPDATE produits SET ${sets.join(", ")} WHERE id = ?`,
            values
          );
          
          results.updated++;
        } else {
          // Création d'un nouveau produit
          const columns = ["reference", "nom", "description", "categorie_id", "prix_unitaire", "stock_boutique", "actif", "image"];
          const values = [reference, nom, description, categorie_id, prix_unitaire, stock_boutique, actif ? 1 : 0, image_url];

          if (hasRemise) {
            columns.push("remise");
            values.push(remise);
          }
          if (hasNeuf) {
            columns.push("neuf");
            values.push(neuf ? 1 : 0);
          }
          if (hasImagesJson) {
            columns.push("images_json");
            values.push(null);
          }

          const placeholders = columns.map(() => "?").join(",");
          await db.execute(
            `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`,
            values
          );
          
          results.created++;
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
        results.errors.push({ 
          row: rowNumber, 
          reference: row.reference || "", 
          error: errorMsg 
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé : ${results.created} créés, ${results.updated} mis à jour, ${results.skipped} ignorés`,
      details: results,
    });

  } catch (error) {
    console.error("Erreur lors de l'import CSV:", error);
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Erreur lors de l'import: ${errorMsg}` }, { status: 500 });
  }
}