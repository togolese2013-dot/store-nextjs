import express from "express";
import { emitAdminEvent } from "../lib/admin-events";
import { createOrder, addOrderEvent } from "@/lib/admin-db";
import { db } from "@/lib/db";
import { getClientSession } from "../lib/client-auth";
import type mysql from "mysql2/promise";

const router = express.Router();

async function ensureOrderCols() {
  const pool = db as mysql.Pool;
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN lien_localisation VARCHAR(500) NULL",
    "ALTER TABLE orders ADD COLUMN client_user_id INT NULL",
  ]) {
    try { await pool.execute(ddl); } catch (e: any) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }
}

// POST /api/orders  — public, no auth required
router.post("/api/orders", async (req, res) => {
  try {
    await ensureOrderCols();

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

    // Link to client account if logged in
    const clientSession = await getClientSession(req).catch(() => null);
    if (clientSession?.id) {
      await (db as mysql.Pool).execute(
        "UPDATE orders SET client_user_id = ? WHERE id = ?",
        [clientSession.id, id]
      );
    }

    if (lien_localisation) {
      await (db as mysql.Pool).execute(
        "UPDATE orders SET lien_localisation = ? WHERE id = ?",
        [lien_localisation, id]
      );
    }

    await addOrderEvent(id, "pending", "Commande passée en ligne");

    const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT reference, created_at FROM orders WHERE id = ? LIMIT 1", [id]
    );
    const reference = (rows[0]?.reference as string) ?? `CMD-${id}`;

    emitAdminEvent("commande", {
      id,
      reference,
      nom:        nom        ?? "",
      total:      Number(total ?? 0),
      created_at: String(rows[0]?.created_at ?? new Date().toISOString().slice(0, 19).replace("T", " ")),
    });

    return res.json({ success: true, id, reference });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
