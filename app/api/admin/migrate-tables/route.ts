import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Temporary migration endpoint — delete after first successful run on Railway
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== "mig_tables_2026_z3p8") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  // fournisseurs
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fournisseurs (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        nom        VARCHAR(200) NOT NULL,
        contact    VARCHAR(100) NULL,
        telephone  VARCHAR(50)  NULL,
        email      VARCHAR(150) NULL,
        adresse    TEXT         NULL,
        note       TEXT         NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    results.push("fournisseurs: OK");
  } catch (e) {
    results.push(`fournisseurs: ERROR — ${String(e)}`);
  }

  // achats
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achats (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        fournisseur_id INT          NULL,
        reference      VARCHAR(100) NOT NULL DEFAULT '',
        date_achat     DATE         NOT NULL,
        statut         ENUM('en_attente','recu','valide') NOT NULL DEFAULT 'en_attente',
        montant_total  DECIMAL(12,2) NOT NULL DEFAULT 0,
        notes          TEXT         NULL,
        created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fournisseur (fournisseur_id),
        INDEX idx_date (date_achat)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    results.push("achats: OK");
  } catch (e) {
    results.push(`achats: ERROR — ${String(e)}`);
  }

  // achat_items
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achat_items (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        achat_id      INT          NOT NULL,
        produit_id    INT          NULL,
        designation   VARCHAR(255) NOT NULL DEFAULT '',
        quantite      INT          NOT NULL DEFAULT 1,
        prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,
        INDEX idx_achat (achat_id),
        INDEX idx_produit (produit_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    results.push("achat_items: OK");
  } catch (e) {
    results.push(`achat_items: ERROR — ${String(e)}`);
  }

  return NextResponse.json({ done: true, results });
}
