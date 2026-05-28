import express from "express";
import { emitAdminEvent } from "../lib/admin-events";
import { createOrder, addOrderEvent, createPaymentPlan, ensureOrderVente } from "@/lib/admin-db";
import { sendOrderNotifications } from "../lib/whatsapp";
import { db } from "@/lib/db";
import { getClientSession } from "../lib/client-auth";
import { ensurePaymentTables } from "./admin/payment-plans";
import type mysql from "mysql2/promise";

const router = express.Router();

function normalizeTogoPhone(raw: string): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const local = digits.startsWith("228") ? digits.slice(3) : digits;
  return local.length === 8 ? `+228 ${local}` : null;
}

let _orderColsReady = false;
async function ensureOrderCols() {
  if (_orderColsReady) return;
  const pool = db as mysql.Pool;
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN lien_localisation VARCHAR(500) NULL",
    "ALTER TABLE orders ADD COLUMN client_user_id INT NULL",
    "ALTER TABLE orders ADD COLUMN mm_transaction_ref VARCHAR(100) NULL",
    "ALTER TABLE orders ADD COLUMN payment_mode VARCHAR(30) NULL",
    "ALTER TABLE orders ADD COLUMN ref_code VARCHAR(20) NULL",
    "ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL",
    "ALTER TABLE orders ADD COLUMN coupon_remise INT NULL",
  ]) {
    try { await pool.execute(ddl); } catch (e: any) {
      if (e?.code !== "ER_DUP_FIELDNAME") throw e;
    }
  }
  _orderColsReady = true;
}

// POST /api/orders  — public, no auth required
router.post("/api/orders", async (req, res) => {
  try {
    await ensureOrderCols();
    await ensurePaymentTables();

    const {
      nom, telephone, adresse, zone_livraison, delivery_fee,
      note, lien_localisation, items, subtotal, total,
      payment_mode, nb_tranches, mm_transaction_ref, ref_code,
      coupon_code, coupon_remise,
    } = req.body;

    if (!telephone?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Téléphone et articles requis." });
    }
    const cleanTelephone = normalizeTogoPhone(telephone);
    if (!cleanTelephone) {
      return res.status(400).json({ error: "Le numéro WhatsApp doit contenir exactement 8 chiffres togolais." });
    }
    if ((payment_mode === "moov_direct" || payment_mode === "yas_direct") && !String(mm_transaction_ref ?? "").trim()) {
      return res.status(400).json({ error: "La référence de transaction est obligatoire pour ce paiement." });
    }

    // Validate installment params
    const isEchelonne = ["2x", "3x", "4x"].includes(payment_mode);
    const tranches    = isEchelonne ? Math.max(2, Math.min(4, Number(nb_tranches) || 4)) : null;

    const id = await createOrder({
      nom:            nom          ?? "",
      telephone:      cleanTelephone,
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

    // Increment referral uses_count if a valid ref_code was applied
    if (ref_code) {
      pool.execute(
        `UPDATE referrals SET uses_count = uses_count + 1 WHERE code = ?`,
        [String(ref_code).trim().toUpperCase()]
      ).catch(() => {});
    }

    // Increment coupon uses_count
    if (coupon_code) {
      pool.execute(
        `UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?`,
        [String(coupon_code).trim().toUpperCase()]
      ).catch(() => {});
    }

    // Save extra fields
    const extraUpdates: string[] = [];
    const extraValues: unknown[] = [];
    if (lien_localisation)    { extraUpdates.push("lien_localisation = ?");    extraValues.push(lien_localisation); }
    if (payment_mode)         { extraUpdates.push("payment_mode = ?");         extraValues.push(payment_mode); }
    if (mm_transaction_ref)   { extraUpdates.push("mm_transaction_ref = ?");   extraValues.push(mm_transaction_ref); }
    if (ref_code)             { extraUpdates.push("ref_code = ?");             extraValues.push(String(ref_code).trim().toUpperCase()); }
    if (coupon_code)          { extraUpdates.push("coupon_code = ?");          extraValues.push(String(coupon_code).trim().toUpperCase()); }
    if (coupon_remise)        { extraUpdates.push("coupon_remise = ?");        extraValues.push(Number(coupon_remise)); }
    if (extraUpdates.length > 0) {
      await pool.execute(
        `UPDATE orders SET ${extraUpdates.join(", ")} WHERE id = ?`,
        [...extraValues, id]
      );
    }

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
    } else if (payment_mode === "moov_direct" || payment_mode === "yas_direct") {
      // Mobile money — reste en attente de vérification manuelle
      await addOrderEvent(id, "pending", "Commande passée en ligne — vérification paiement mobile money en attente");
    } else {
      // Paiement à la livraison — confirmation et livraison automatiques
      await pool.execute("UPDATE orders SET status = 'confirmed' WHERE id = ?", [id]);
      await addOrderEvent(id, "confirmed", "Confirmé automatiquement (paiement à la livraison)");
      // Créer l'entrée livraison immédiatement
      try {
        const [[existingLiv]] = await pool.execute<mysql.RowDataPacket[]>(
          "SELECT id FROM livraisons_ventes WHERE order_id = ? LIMIT 1", [id]
        );
        if (!existingLiv) {
          const [[orderRow]] = await pool.execute<mysql.RowDataPacket[]>(
            "SELECT reference FROM orders WHERE id = ? LIMIT 1", [id]
          );
          const livRef = `LV-${orderRow?.reference ?? id}`;
          await pool.execute(
            `INSERT IGNORE INTO livraisons_ventes
               (reference, facture_id, client_nom, client_tel, adresse, contact_livraison,
                lien_localisation, statut, note, order_id)
             VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', NULL, ?)`,
            [
              livRef,
              nom            ?? null,
              cleanTelephone ?? null,
              adresse        ?? null,
              cleanTelephone ?? null,
              lien_localisation ?? null,
              id,
            ]
          );
        }
      } catch (e) {
        console.error("[orders] auto livraison creation failed:", e);
      }
    }

    await ensureOrderVente(id);

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

    // WhatsApp notifications — non-blocking
    sendOrderNotifications({
      id,
      reference,
      nom:       nom ?? "",
      telephone: cleanTelephone,
      items:     items ?? [],
      total:     Number(total ?? 0),
    }).catch(console.error);

    return res.json({ success: true, id, reference, payment_mode: payment_mode ?? "comptant" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
