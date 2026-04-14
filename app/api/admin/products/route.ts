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
            stock_boutique, stock_minimum, remise, neuf, actif, image_url, images } = body;

    if (!nom || !reference || !prix_unitaire) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

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
    const hasStockMinimum = colNames.has("stock_minimum");

    // Construire la requête dynamiquement
    const columns = ["reference", "nom", "description", "categorie_id", "prix_unitaire", "stock_boutique"];
    const values = [reference, nom, description ?? null, categorie_id ?? null, Number(prix_unitaire), Number(stock_boutique ?? 0)];

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

    columns.push("actif", "image");
    values.push(actif !== false ? 1 : 0, image_url ?? null);

    if (hasImagesJson) {
      columns.push("images_json");
      values.push(imagesJson);
    }

    const placeholders = columns.map(() => "?").join(",");
    await db.execute(
      `INSERT INTO produits (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
