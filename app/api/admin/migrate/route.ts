import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addCol(table: string, column: string, definition: string) {
  const exists = await columnExists(table, column);
  if (exists) return "skipped";
  await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return "ok";
}

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    if (!process.env.RESET_SECRET || secret !== process.env.RESET_SECRET) {
      return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
    }

    const results: Record<string, string> = {};

    // boutique_stock.from_magasin — used in all stock boutique queries
    results["boutique_stock.from_magasin"] = await addCol(
      "boutique_stock", "from_magasin", "TINYINT(1) NOT NULL DEFAULT 1"
    );

    // Make all existing rows visible in boutique
    if (results["boutique_stock.from_magasin"] === "ok") {
      await db.execute("UPDATE boutique_stock SET from_magasin = 1");
    }

    // utilisateurs table (for staff management)
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
          id            INT AUTO_INCREMENT PRIMARY KEY,
          nom           VARCHAR(120) NOT NULL,
          email         VARCHAR(150) DEFAULT NULL,
          telephone     VARCHAR(30)  DEFAULT NULL,
          poste         VARCHAR(100) DEFAULT NULL,
          mot_de_passe  VARCHAR(255) DEFAULT NULL,
          actif         TINYINT(1)   DEFAULT 1,
          date_creation DATETIME     DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results["utilisateurs"] = "ok";
    } catch (e) {
      results["utilisateurs"] = String(e);
    }

    // Other potentially missing columns
    const cols = [
      { table: "factures",        column: "avec_livraison",    def: "TINYINT(1) DEFAULT 0" },
      { table: "factures",        column: "adresse_livraison", def: "VARCHAR(500) NULL" },
      { table: "factures",        column: "contact_livraison", def: "VARCHAR(255) NULL" },
      { table: "factures",        column: "lien_localisation", def: "VARCHAR(500) NULL" },
      { table: "factures",        column: "mode_paiement",     def: "VARCHAR(50) NULL" },
      { table: "factures",        column: "statut_paiement",   def: "VARCHAR(50) NULL" },
      { table: "factures",        column: "montant_acompte",   def: "DECIMAL(12,2) NULL" },
      { table: "produits",        column: "images_json",       def: "JSON NULL" },
      { table: "orders",          column: "client_id",         def: "INT NULL" },
      { table: "orders",          column: "entrepot_id",       def: "INT NULL" },
      { table: "finance_entries", column: "mode_paiement",     def: "VARCHAR(50) DEFAULT 'especes'" },
    ];

    for (const c of cols) {
      const key = `${c.table}.${c.column}`;
      try {
        results[key] = await addCol(c.table, c.column, c.def);
      } catch (e) {
        results[key] = `error: ${String(e)}`;
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
