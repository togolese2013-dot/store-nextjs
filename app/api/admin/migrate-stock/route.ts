import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Temporary migration endpoint — delete after first successful run on Railway
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== "mig_stock_2026_x7k9") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stock_mouvements (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        produit_id  INT NOT NULL,
        type        ENUM('entree','retrait','vente','ajustement') NOT NULL DEFAULT 'ajustement',
        quantite    INT NOT NULL DEFAULT 0,
        stock_apres INT NOT NULL DEFAULT 0,
        reference   VARCHAR(100) NULL,
        note        TEXT NULL,
        user_id     INT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_produit (produit_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    results.push("stock_mouvements: OK");
  } catch (e) {
    results.push(`stock_mouvements: ERROR — ${String(e)}`);
  }

  return NextResponse.json({ done: true, results });
}
