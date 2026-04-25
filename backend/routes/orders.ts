import express from "express";
import { emitAdminEvent } from "../lib/admin-events";
import { createOrder, addOrderEvent } from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

async function ensureLienLocalisation() {
  try {
    await (db as mysql.Pool).execute(
      "ALTER TABLE orders ADD COLUMN lien_localisation VARCHAR(500) NULL"
    );
  } catch (err: any) {
    if (err?.code !== "ER_DUP_FIELDNAME") throw err;
  }
}

// POST /api/orders  — public, no auth required
router.post("/api/orders", async (req, res) => {
  try {
    await ensureLienLocalisation();

    const {
      nom, telephone, adresse, zone_livraison, delivery_fee,
      note, lien_localisation, items, subtotal, total,
    } = req.body;

    if (!telephone?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Téléphone et articles requis." });
    }

    const id = await createOrder({
      nom:            nom          ?? "",
      telephone:      telephone.trim(),
      adresse:        adresse      ?? "",
      zone_livraison: zone_livraison ?? "",
      delivery_fee:   Number(delivery_fee ?? 0),
      note:           note         ?? "",
      items,
      subtotal:       Number(subtotal ?? 0),
      total:          Number(total   ?? 0),
    });

    // Store lien_localisation separately (column added above)
    if (lien_localisation) {
      await (db as mysql.Pool).execute(
        "UPDATE orders SET lien_localisation = ? WHERE id = ?",
        [lien_localisation, id]
      );
    }

    await addOrderEvent(id, "pending", "Commande passée en ligne");
    emitAdminEvent("commande");

    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT reference FROM orders WHERE id = ?", [id]
    );
    const reference = (rows[0]?.reference as string) ?? `CMD-${id}`;

    return res.json({ success: true, id, reference });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
