import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// One-time migration endpoint — delete after use.
// Protected by RESET_SECRET env var.

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();
    const expected = process.env.RESET_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
    }

    const results: { name: string; status: "ok" | "skipped" | "error"; error?: string }[] = [];

    // Create utilisateurs table (staff management, separate from admin_users)
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
          id             INT AUTO_INCREMENT PRIMARY KEY,
          nom            VARCHAR(120) NOT NULL,
          email          VARCHAR(150) DEFAULT NULL,
          telephone      VARCHAR(30)  DEFAULT NULL,
          poste          VARCHAR(100) DEFAULT NULL,
          mot_de_passe   VARCHAR(255) DEFAULT NULL,
          actif          TINYINT(1)   DEFAULT 1,
          date_creation  DATETIME     DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      results.push({ name: "utilisateurs", status: "ok" });
    } catch (e) {
      results.push({ name: "utilisateurs", status: "error", error: String(e) });
    }

    // Add any other missing columns
    const columnMigrations = [
      { table: "factures", column: "avec_livraison",    definition: "TINYINT(1) DEFAULT 0" },
      { table: "factures", column: "adresse_livraison", definition: "VARCHAR(500) NULL" },
      { table: "factures", column: "contact_livraison", definition: "VARCHAR(255) NULL" },
      { table: "factures", column: "lien_localisation", definition: "VARCHAR(500) NULL" },
      { table: "factures", column: "mode_paiement",     definition: "VARCHAR(50) NULL" },
      { table: "factures", column: "statut_paiement",   definition: "VARCHAR(50) NULL" },
      { table: "factures", column: "montant_acompte",   definition: "DECIMAL(12,2) NULL" },
      { table: "produits", column: "images_json",       definition: "JSON NULL" },
      { table: "orders",   column: "client_id",         definition: "INT NULL" },
      { table: "orders",   column: "entrepot_id",       definition: "INT NULL" },
      { table: "finance_entries", column: "mode_paiement", definition: "VARCHAR(50) DEFAULT 'especes'" },
    ];

    for (const m of columnMigrations) {
      const name = `${m.table}.${m.column}`;
      try {
        const exists = await columnExists(m.table, m.column);
        if (exists) {
          results.push({ name, status: "skipped" });
        } else {
          await db.execute(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`);
          results.push({ name, status: "ok" });
        }
      } catch (e) {
        results.push({ name, status: "error", error: String(e) });
      }
    }

    const errors = results.filter((r) => r.status === "error");
    return NextResponse.json({ ok: errors.length === 0, results, errors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
