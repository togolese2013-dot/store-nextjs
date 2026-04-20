import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const results: Record<string, string> = {};

  try {
    const [cols] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const names = new Set(cols.map(r => (r.COLUMN_NAME as string).toLowerCase()));

    if (!names.has("images_json")) {
      await db.execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
      results.images_json = "colonne ajoutée";
    } else {
      results.images_json = "déjà présente";
    }

    if (!names.has("variations_json")) {
      await db.execute(`ALTER TABLE produits ADD COLUMN variations_json TEXT NULL`);
      results.variations_json = "colonne ajoutée";
    } else {
      results.variations_json = "déjà présente";
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[migrate]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
