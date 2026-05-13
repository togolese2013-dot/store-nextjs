try { process.loadEnvFile(".env.local"); } catch {}
import mysql from "mysql2/promise";

const pool = mysql.createPool({ uri: process.env.MYSQL_PUBLIC_URL, ssl: { rejectUnauthorized: false }, connectionLimit: 2 });
const DOMAIN = "shop.togolese.net";

const tables: Record<string, string[]> = {
  produits:         ["image_url", "images_json"],
  product_variants: ["image_url"],
  boutique_stock:   ["image_url"],
  hero_slides:      ["image", "image_mobile"],
  categories:       ["image_url"],
  marques:          ["logo_url"],
  settings:         ["value"],
  orders:           ["items"],
  factures:         ["items"],
  devis:            ["items"],
  achat_items:      ["image_url"],
};

async function main() {
  for (const [table, cols] of Object.entries(tables)) {
    try {
      const where = cols.map(c => `\`${c}\` LIKE ?`).join(" OR ");
      const params = cols.map(() => `%${DOMAIN}%`);
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM \`${table}\` WHERE ${where}`, params
      );
      const cnt = Number(rows[0].cnt);
      console.log(`${table}: ${cnt > 0 ? `⚠️  ${cnt} ligne(s)` : "✓ clean"}`);
    } catch { console.log(`${table}: (absente)`); }
  }
  await pool.end();
}
main().catch(console.error);
