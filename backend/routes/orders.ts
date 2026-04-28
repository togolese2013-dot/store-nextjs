import express from "express";
import { emitAdminEvent } from "../lib/admin-events";
import { createOrder, addOrderEvent, createPaymentPlan } from "@/lib/admin-db";
import { db } from "@/lib/db";
import { getClientSession } from "../lib/client-auth";
import { ensurePaymentTables } from "./admin/payment-plans";
import type mysql from "mysql2/promise";

const router = express.Router();

async function ensureOrderCols() {
  const pool = db as mysql.Pool;
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN lien_localisation VARCHAR(500) NULL",
    "ALTER TABLE orders ADD COLUMN client_user_id INT NULL",
    "ALTER TABLE orders ADD COLUMN mm_transaction_ref VARCHAR(100) NULL",
    "ALTER TABLE orders ADD COLUMN payment_mode VARCHAR(30) NULL",
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
    await ensurePaymentTables();

    const {
      nom, telephone, adresse, zone_livraison, delivery_fee,
      note, lien_localisation, items, subtotal, total,
      payment_mode, nb_tranches, mm_transaction_ref,
    } = req.body;

    if (!telephone?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Téléphone et articles requis." });
    }

    // Validate installment params
    const isEchelonne = ["2x", "3x", "4x"].includes(payment_mode);
    const tranches    = isEchelonne ? Math.max(2, Math.min(4, Number(nb_tranches) || 4)) : null;

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

    const pool = db as mysql.Pool;

    // Link to client account if logged in
    const clientSession = await getClientSession(req).catch(() => null);
    if (clientSession?.id) {
      await pool.execute(
        "UPDATE orders SET client_user_id = ? WHERE id = ?",
        [clientSession.id, id]
      );
    }

    // Save extra fields
    const extraUpdates: string[] = [];
    const extraValues: unknown[] = [];
    if (lien_localisation)    { extraUpdates.push("lien_localisation = ?");    extraValues.push(lien_localisation); }
    if (payment_mode)         { extraUpdates.push("payment_mode = ?");         extraValues.push(payment_mode); }
    if (mm_transaction_ref)   { extraUpdates.push("mm_transaction_ref = ?");   extraValues.push(mm_transaction_ref); }
    if (extraUpdates.length > 0) {
      await pool.execute(
        `UPDATE orders SET ${extraUpdates.join(", ")} WHERE id = ?`,
        [...extraValues, id]
      );
    }

    // Mobile money direct — statut reste 'pending', payment_mode indique la vérification nécessaire

    // Payment plan: put order in "plan_paiement" status and create tranches
    if (isEchelonne && tranches) {
      await pool.execute(
        "UPDATE orders SET status = 'plan_paiement' WHERE id = ?", [id]
      );
      await createPaymentPlan({
        order_id:      id,
        nb_tranches:   tranches,
        montant_total: Number(total ?? 0),
      });
      await addOrderEvent(id, "plan_paiement",
        `Paiement en ${tranches} fois — tranche 1 à régler pour confirmer`
      );
    } else {
      await addOrderEvent(id, "pending", "Commande passée en ligne");
    }

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
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

    return res.json({ success: true, id, reference, payment_mode: payment_mode ?? "comptant" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
