import express from "express";
import { getSession } from "../../lib/auth";
import { db, invalidateProduitColsCache } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

router.get("/api/admin/schema/columns", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const table = (req.query.table as string) || "produits";
  const [cols] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]
  );
  const names = new Set(cols.map(r => (r.COLUMN_NAME as string).toLowerCase()));
  res.json({
    columns:       cols,
    hasRemise:     names.has("remise"),
    hasNeuf:       names.has("neuf"),
    hasImagesJson: names.has("images_json"),
  });
});

router.post("/api/admin/schema/migrate", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const results: Record<string, string> = {};
  try {
    const [cols] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
    );
    const names = new Set(cols.map(r => (r.COLUMN_NAME as string).toLowerCase()));

    if (!names.has("images_json")) {
      await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN images_json TEXT NULL`);
      results.images_json = "colonne ajoutée";
    } else { results.images_json = "déjà présente"; }

    if (!names.has("variations_json")) {
      await (db as import("mysql2/promise").Pool).execute(`ALTER TABLE produits ADD COLUMN variations_json TEXT NULL`);
      results.variations_json = "colonne ajoutée";
    } else { results.variations_json = "déjà présente"; }

    invalidateProduitColsCache();
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
