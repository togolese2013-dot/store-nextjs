import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      produit_id INT NOT NULL,
      nom VARCHAR(255) NOT NULL,
      options JSON,
      prix INT NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      reference_sku VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_produit_id (produit_id)
    )
  `);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  await ensureTable();

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM product_variants WHERE produit_id = ? ORDER BY id ASC",
    [Number(id)]
  );

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      options:
        typeof r.options === "string"
          ? JSON.parse(r.options)
          : r.options ?? {},
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;
  await ensureTable();

  const body = await req.json();
  const { nom, options, prix, stock, reference_sku } = body;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    "INSERT INTO product_variants (produit_id, nom, options, prix, stock, reference_sku) VALUES (?,?,?,?,?,?)",
    [
      Number(id),
      nom,
      JSON.stringify(options ?? {}),
      Number(prix),
      Number(stock ?? 0),
      reference_sku ?? null,
    ]
  );

  return NextResponse.json({ ok: true, id: result.insertId });
}
