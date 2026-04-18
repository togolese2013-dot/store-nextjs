import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProducts, getProductCount, getCategories } from "@/lib/db";
import mysql from "mysql2/promise";

/* GET /api/admin/products?page=1&q=...&category=... */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const sp       = req.nextUrl.searchParams;
  const q        = sp.get("q") || undefined;
  const catId    = sp.get("category") ? Number(sp.get("category")) : undefined;
  const page     = Math.max(1, Number(sp.get("page")) || 1);
  const limit    = 20;
  const offset   = (page - 1) * limit;

  const [products, total, categories] = await Promise.all([
    getProducts({ search: q, categoryId: catId, limit, offset }),
    getProductCount({ search: q, categoryId: catId }),
    getCategories(),
  ]);

  return NextResponse.json({ products, total, categories, page, limit });
}

/* POST /api/admin/products — create */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nom, reference, description, categorie_id, prix_unitaire,
            stock_magasin, stock_minimum, remise, neuf, actif, image_url, images } = body;

    if (!nom || !reference || !prix_unitaire) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;
    const stockMagasin = Number(stock_magasin ?? 0);

    // Detect available columns dynamically (Railway table is legacy PHP schema)
    const [colRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const colNames = new Set(colRows.map((r) => (r.COLUMN_NAME as string).toLowerCase()));
    const hasRemise        = colNames.has("remise");
    const hasNeuf          = colNames.has("neuf");
    const hasImagesJson    = colNames.has("images_json");
    const hasStockMinimum  = colNames.has("stock_minimum");
    const hasStockBoutique = colNames.has("stock_boutique");
    const hasImageUrl      = colNames.has("image_url");
    const hasImage         = colNames.has("image");

    // Build INSERT dynamically
    const columns: string[] = ["reference", "nom", "description", "categorie_id", "prix_unitaire"];
    const values: (string | number | boolean | null | Buffer)[] = [
      reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire),
    ];

    // Stock boutique column (set to 0 — managed by boutique operations)
    if (hasStockBoutique) {
      columns.push("stock_boutique");
      values.push(0);
    }

    if (hasRemise) {
      columns.push("remise");
      values.push(Number(remise ?? 0));
    }
    if (hasNeuf) {
      columns.push("neuf");
      values.push(neuf ? 1 : 0);
    }
    if (hasStockMinimum) {
      columns.push("stock_minimum");
      values.push(Number(stock_minimum ?? 5));
    }

    columns.push("actif");
    values.push(actif !== false ? 1 : 0);

    // Image column: prefer image_url, fall back to image
    if (hasImageUrl) {
      columns.push("image_url");
      values.push(image_url ?? null);
    } else if (hasImage) {
      columns.push("image");
      values.push(image_url ?? null);
    }

    if (hasImagesJson) {
      columns.push("images_json");
      values.push(imagesJson);
    }

    const placeholders = columns.map(() => "?").join(",");
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    const newId = result.insertId;

    // Insert stock magasin initial in produit_stocks (entrepot_id=1)
    if (stockMagasin > 0) {
      await db.execute(
        `INSERT INTO produit_stocks (produit_id, entrepot_id, stock)
         VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock)`,
        [newId, stockMagasin]
      );
      await db.execute(
        `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note)
         VALUES (?, 'entree', ?, ?, 'Stock initial à la création du produit')`,
        [newId, stockMagasin, stockMagasin]
      );
    }

    return NextResponse.json({ ok: true, id: newId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
