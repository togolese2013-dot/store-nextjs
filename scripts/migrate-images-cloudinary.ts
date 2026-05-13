/**
 * Migration one-shot : copie les images shop.togolese.net → Cloudinary
 * et met à jour image_url + images_json dans la table produits.
 *
 * Usage : npx tsx scripts/migrate-images-cloudinary.ts
 */

// Node.js 20.12+ native env loader
try { process.loadEnvFile(".env.local"); } catch { /* absent */ }
try { process.loadEnvFile(".env"); } catch { /* absent */ }

import mysql from "mysql2/promise";
import crypto from "crypto";

const OLD_DOMAIN = "shop.togolese.net";
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY    = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const dbUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const pool = dbUri
  ? mysql.createPool({ uri: dbUri, connectionLimit: 2, ssl: { rejectUnauthorized: false } })
  : mysql.createPool({
      host:            process.env.DB_HOST     || "127.0.0.1",
      port:            Number(process.env.DB_PORT) || 3306,
      user:            process.env.DB_USER,
      password:        process.env.DB_PASSWORD,
      database:        process.env.DB_NAME,
      connectionLimit: 2,
    });

async function uploadToCloudinary(imageUrl: string): Promise<string> {
  // Download image
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${imageUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Build signed upload request
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder    = "togolese-shop";
  const toSign    = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha256").update(toSign).digest("hex");

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
  if (!upload.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Upload Cloudinary échoué");
  }
  return data.secure_url;
}

async function main() {
  // Detect image column name
  const [cols] = await pool.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM produits");
  const colNames = cols.map((c: mysql.RowDataPacket) => c.Field as string);
  const imgCol = colNames.includes("image_url") ? "image_url" : "image";
  console.log(`Colonne image détectée : ${imgCol}`);

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, ${imgCol} AS image_url, images_json FROM produits
     WHERE ${imgCol} LIKE ? OR images_json LIKE ?`,
    [`%${OLD_DOMAIN}%`, `%${OLD_DOMAIN}%`]
  );

  console.log(`${rows.length} produit(s) à migrer\n`);
  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      let newImageUrl: string | null = row.image_url;
      let newImagesJson: string | null = row.images_json;

      if (row.image_url?.includes(OLD_DOMAIN)) {
        process.stdout.write(`  [${row.id}] image principale... `);
        newImageUrl = await uploadToCloudinary(row.image_url);
        console.log(`✓`);
      }

      if (row.images_json?.includes(OLD_DOMAIN)) {
        const imgs: string[] = JSON.parse(row.images_json);
        const migrated = await Promise.all(
          imgs.map(async (url) => {
            if (!url.includes(OLD_DOMAIN)) return url;
            process.stdout.write(`  [${row.id}] image secondaire... `);
            const newUrl = await uploadToCloudinary(url);
            console.log(`✓`);
            return newUrl;
          })
        );
        newImagesJson = JSON.stringify(migrated);
      }

      await pool.execute(
        `UPDATE produits SET ${imgCol} = ?, images_json = ? WHERE id = ?`,
        [newImageUrl, newImagesJson, row.id]
      );
      ok++;
    } catch (e) {
      console.error(`  [${row.id}] ✗ ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }

  console.log(`\nTerminé : ${ok} OK, ${fail} échec(s)`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
