import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

/* GET /api/admin/products/[id]/related — récupérer les produits liés */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  
  try {
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

    const [rows] = await db.execute(
      `SELECT 
         pl.id, pl.produit_lié_id, pl.type, pl.ordre,
         p.reference, p.nom, p.prix_unitaire,
         ${hasRemise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0"} AS remise,
         ${imageCol} AS image_url,
         c.nom AS categorie_nom
       FROM produits_liés pl
       JOIN produits p ON pl.produit_lié_id = p.id
       LEFT JOIN categories c ON p.categorie_id = c.id
       WHERE pl.produit_id = ? AND p.actif = 1
       ORDER BY pl.ordre, pl.id`,
      [Number(id)]
    );

    return NextResponse.json({ related: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* POST /api/admin/products/[id]/related — ajouter un produit lié */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  
  try {
    const body = await req.json();
    const { produit_lié_id, type = "similaire", ordre = 0 } = body;

    if (!produit_lié_id) {
      return NextResponse.json({ error: "ID du produit lié manquant." }, { status: 400 });
    }

    // Vérifier que le produit lié existe et est actif
    const [check] = await db.execute(
      "SELECT id FROM produits WHERE id = ? AND actif = 1",
      [Number(produit_lié_id)]
    );
    if (!(check as any[]).length) {
      return NextResponse.json({ error: "Produit lié introuvable ou inactif." }, { status: 404 });
    }

    // Vérifier que ce n'est pas le même produit
    if (Number(id) === Number(produit_lié_id)) {
      return NextResponse.json({ error: "Un produit ne peut pas être lié à lui-même." }, { status: 400 });
    }

    // Vérifier si l'association existe déjà
    const [existing] = await db.execute(
      "SELECT id FROM produits_liés WHERE produit_id = ? AND produit_lié_id = ?",
      [Number(id), Number(produit_lié_id)]
    );
    if ((existing as any[]).length) {
      return NextResponse.json({ error: "Cette association existe déjà." }, { status: 409 });
    }

    // Créer l'association
    await db.execute(
      "INSERT INTO produits_liés (produit_id, produit_lié_id, type, ordre) VALUES (?, ?, ?, ?)",
      [Number(id), Number(produit_lié_id), type, ordre]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* DELETE /api/admin/products/[id]/related/[relatedId] — supprimer une association */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; relatedId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id, relatedId } = await params;
  
  try {
    await db.execute(
      "DELETE FROM produits_liés WHERE produit_id = ? AND id = ?",
      [Number(id), Number(relatedId)]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
