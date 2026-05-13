/**
 * Migration : toutes les images produit non-Cloudinary → Cloudinary
 * Usage : MYSQL_PUBLIC_URL="mysql://..." npx tsx scripts/migrate-images-cloudinary.ts
 */

try { process.loadEnvFile(".env.local"); } catch { /* absent */ }
try { process.loadEnvFile(".env"); } catch { /* absent */ }

import mysql from "mysql2/promise";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const pool = dbUri
  ? mysql.createPool({ uri: dbUri, connectionLimit: 2, ssl: { rejectUnauthorized: false } })
  : mysql.createPool({
      host:     process.env.DB_HOST || "127.0.0.1",
      port:     Number(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 2,
    });

function isCloudinary(url: string): boolean {
  return url.includes("cloudinary.com");
}

function isExternal(url: string): boolean {
  return url.startsWith("http") && !isCloudinary(url);
}

async function uploadToCloudinary(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${imageUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder    = "togolese-shop";
  const signature = crypto.createHash("sha256")
    .update(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  form.append("file",      new Blob([buffer]));
  form.append("folder",    folder);
  form.append("timestamp", timestamp);
  form.append("api_key",   API_KEY);
  form.append("signature", signature);

  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  const data = await upload.json() as { secure_url?: string; error?: { message: string } };
  if (!upload.ok || !data.secure_url) throw new Error(data.error?.message ?? "Upload échoué");
  return data.secure_url;
}

async function main() {
  // Detect column name
  const [cols] = await pool.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM produits");
  const colNames = cols.map(c => c.Field as string);
  const imgCol = colNames.includes("image_url") ? "image_url" : "image";
  console.log(`Colonne image : ${imgCol}\n`);

  // Fetch all products with at least one non-Cloudinary image
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, ${imgCol} AS img, images_json FROM produits
     WHERE (${imgCol} IS NOT NULL AND ${imgCol} != '' AND ${imgCol} NOT LIKE '%cloudinary.com%')
        OR (images_json IS NOT NULL AND images_json NOT LIKE '%cloudinary.com%' AND images_json != '[]')`
  );

  console.log(`${rows.length} produit(s) avec images externes\n`);
  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      let newImg: string | null = row.img;
      let newJson: string | null = row.images_json;
      let changed = false;

      // Image principale
      if (row.img && isExternal(row.img)) {
        process.stdout.write(`  [${row.id}] principale (${new URL(row.img).hostname})... `);
        newImg = await uploadToCloudinary(row.img);
        console.log("✓");
        changed = true;
      }

      // Images secondaires
      if (row.images_json) {
        let imgs: string[] = [];
        try { imgs = JSON.parse(row.images_json); } catch { imgs = []; }
        const migrated = await Promise.all(
          imgs.map(async (url: string) => {
            if (!url || !isExternal(url)) return url;
            process.stdout.write(`  [${row.id}] secondaire (${new URL(url).hostname})... `);
            const newUrl = await uploadToCloudinary(url);
            console.log("✓");
            changed = true;
            return newUrl;
          })
        );
        if (changed) newJson = JSON.stringify(migrated);
      }

      if (changed) {
        await pool.execute(
          `UPDATE produits SET ${imgCol} = ?, images_json = ? WHERE id = ?`,
          [newImg, newJson, row.id]
        );
      }
      ok++;
    } catch (e) {
      console.error(`  [${row.id}] ✗ ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }

  console.log(`\nTerminé : ${ok} OK, ${fail} échec(s)`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
