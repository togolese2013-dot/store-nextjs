import "server-only";
import { db } from "./db";
import type { Product } from "./utils";
import { finalPrice, formatPrice } from "./utils";
import mysql from "mysql2/promise";

export interface RelatedProduct {
  id: number;
  produit_lié_id: number;
  type: "similaire" | "complementaire" | "upsell";
  ordre: number;
  reference: string;
  nom: string;
  prix_unitaire: number;
  remise: number;
  image_url: string | null;
  categorie_nom: string | null;
}

/**
 * Vérifie dynamiquement les colonnes de la table produits
 */
async function getProduitColumns() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
  return {
    remise: names.has("remise"),
    neuf: names.has("neuf"),
    image_url: names.has("image_url"),
    image: names.has("image"),
  };
}

/** Cache — évite de vérifier l'existence de la table à chaque requête */
let _relatedTableExists: boolean | null = null;

async function relatedTableExists(): Promise<boolean> {
  if (_relatedTableExists !== null) return _relatedTableExists;
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits_liés'
       LIMIT 1`
    );
    _relatedTableExists = (rows as mysql.RowDataPacket[]).length > 0;
  } catch {
    _relatedTableExists = false;
  }
  return _relatedTableExists;
}

/**
 * Récupère les produits liés à un produit donné
 */
export async function getRelatedProducts(productId: number): Promise<RelatedProduct[]> {
  if (!(await relatedTableExists())) return [];

  try {
    const cols = await getProduitColumns();
    const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";

    const [rows] = await db.execute(
      `SELECT
         pl.id, pl.produit_lié_id, pl.type, pl.ordre,
         p.reference, p.nom, p.prix_unitaire,
         ${cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
         ${imageCol} AS image_url,
         c.nom AS categorie_nom
       FROM produits_liés pl
       JOIN produits p ON pl.produit_lié_id = p.id
       LEFT JOIN categories c ON p.categorie_id = c.id
       WHERE pl.produit_id = ? AND p.actif = 1
       ORDER BY pl.ordre, pl.id`,
      [productId]
    );

    return (rows as any[]).map((row) => ({
      id: Number(row.id),
      produit_lié_id: Number(row.produit_lié_id),
      type: row.type as "similaire" | "complementaire" | "upsell",
      ordre: Number(row.ordre),
      reference: row.reference as string,
      nom: row.nom as string,
      prix_unitaire: Number(row.prix_unitaire),
      remise: Number(row.remise),
      image_url: (row.image_url ?? null) as string | null,
      categorie_nom: (row.categorie_nom ?? null) as string | null,
    }));
  } catch (error) {
    console.error("Erreur produits liés:", error);
    return [];
  }
}

/**
 * Convertit un produit lié en format Product pour l'affichage
 */
export function relatedToProduct(related: RelatedProduct): Product {
  const price = finalPrice({
    prix_unitaire: related.prix_unitaire,
    remise: related.remise,
  } as Product);

  return {
    id: related.produit_lié_id,
    reference: related.reference,
    nom: related.nom,
    description: null,
    categorie_id: null,
    categorie_nom: related.categorie_nom,
    prix_unitaire: related.prix_unitaire,
    stock_boutique: 0, // Non disponible dans la requête
    stock_magasin:  0, // Non disponible dans la requête
    remise: related.remise,
    neuf: false, // Non disponible dans la requête
    image_url: related.image_url,
    images: related.image_url ? [related.image_url] : [],
    variations: null,
    date_creation: "",
    marque_id:  null,
    marque_nom: null,
  };
}

/**
 * Récupère les produits liés avec leurs informations complètes
 */
export async function getRelatedProductsWithDetails(productId: number): Promise<Product[]> {
  const related = await getRelatedProducts(productId);
  return related.map(relatedToProduct);
}