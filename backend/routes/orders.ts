import express from "express";
import { emitAdminEvent } from "../lib/admin-events";
import { createOrder, addOrderEvent, createPaymentPlan, ensureOrderVente } from "@/lib/admin-db";
import { sendOrderNotifications } from "../lib/whatsapp";
import { db } from "@/lib/db";
import { getClientSession } from "../lib/client-auth";
import { ensurePaymentTables } from "./admin/payment-plans";
import type mysql from "mysql2/promise";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadScreenshotToCloudinary(base64Data: string): Promise<string> {
  // Strip data URL prefix if present
  const data = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(data, "base64");

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Image trop volumineuse (max 10 Mo).");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        "togolese-payment-proofs",
        resource_type: "image",
        format:        "jpg",
        quality:       "auto",
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload échoué"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

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

// ── Server-side price validation ─────────────────────────────────────────────
// Prevents client-side price manipulation (e.g. submitting total: 1 FCFA)
// Best-effort: if DB query fails (e.g. table missing), logs and allows order.
const PRICE_TOLERANCE = 100; // FCFA — rounding tolerance

async function validateOrderPricing(
  items: Array<{ id?: number; produit_id?: number; qty?: number; quantite?: number }>,
  zone_livraison: string | undefined,
  delivery_fee_claimed: number,
  coupon_code: string | undefined,
  coupon_remise_claimed: number,
  total_claimed: number,
): Promise<{ ok: true; subtotal: number; fee: number; remise: number } | { ok: false; error: string }> {
  try {
    const pool = db as mysql.Pool;

    // 1. Recalculate subtotal from DB prices
    const productIds = items
      .map(i => Number(i.id ?? i.produit_id))
      .filter(id => id > 0);

    if (productIds.length === 0) return { ok: false, error: "Aucun article valide." };

    const ph = productIds.map(() => "?").join(",");
    const [products] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, prix_unitaire, COALESCE(remise, 0) AS remise FROM produits WHERE id IN (${ph}) AND actif = 1`,
      productIds
    );
    const priceMap = new Map<number, { prix: number; remise: number }>();
    for (const p of products) {
      priceMap.set(Number(p.id), { prix: Number(p.prix_unitaire), remise: Number(p.remise) });
    }

    let serverSubtotal = 0;
    for (const item of items) {
      const pid = Number(item.id ?? item.produit_id);
      const qty = Math.max(1, Number(item.qty ?? item.quantite ?? 1));
      const prod = priceMap.get(pid);
      if (!prod) return { ok: false, error: `Produit introuvable ou inactif : ID ${pid}` };
      const unitPrice = prod.remise > 0
        ? Math.round(prod.prix * (1 - prod.remise / 100))
        : prod.prix;
      serverSubtotal += unitPrice * qty;
    }

    // 2. Validate delivery fee
    let serverFee = 0;
    if (zone_livraison) {
      try {
        const [zones] = await pool.execute<mysql.RowDataPacket[]>(
          "SELECT fee, prix_libre FROM delivery_zones WHERE nom = ? AND actif = 1 LIMIT 1",
          [zone_livraison]
        );
        const zone = zones[0];
        if (zone) {
          if (zone.prix_libre) {
            // "Prix à confirmer" — accept claimed fee up to 20 000 FCFA
            serverFee = Math.min(Number(delivery_fee_claimed), 20000);
          } else {
            serverFee = Number(zone.fee ?? 0);
            if (Math.abs(Number(delivery_fee_claimed) - serverFee) > PRICE_TOLERANCE) {
              return { ok: false, error: "Frais de livraison invalides." };
            }
          }
        } else {
          // Zone not found — accept claimed fee (might be a custom/new zone)
          serverFee = Number(delivery_fee_claimed ?? 0);
        }
      } catch {
        // delivery_zones table might not exist yet — accept claimed fee
        serverFee = Number(delivery_fee_claimed ?? 0);
      }
    }

    // 3. Validate coupon discount
    let serverRemise = 0;
    if (coupon_code) {
      try {
        const [coupons] = await pool.execute<mysql.RowDataPacket[]>(
          `SELECT type, valeur, min_order, max_uses, uses_count, expires_at
           FROM coupons WHERE code = ? AND actif = 1 LIMIT 1`,
          [String(coupon_code).trim().toUpperCase()]
        );
        const coupon = coupons[0];
        if (coupon) {
          const expired    = coupon.expires_at && new Date(coupon.expires_at) < new Date();
          const maxedOut   = Number(coupon.max_uses) > 0 && Number(coupon.uses_count) >= Number(coupon.max_uses);
          const underMin   = serverSubtotal < Number(coupon.min_order);
          if (!expired && !maxedOut && !underMin) {
            serverRemise = coupon.type === "fixed"
              ? Math.min(Number(coupon.valeur), serverSubtotal)
              : Math.round(serverSubtotal * Number(coupon.valeur) / 100);
          }
        }
        // If coupon_remise_claimed > server-calculated remise → fraud attempt
        if (Number(coupon_remise_claimed) > serverRemise + PRICE_TOLERANCE) {
          return { ok: false, error: "Remise coupon invalide." };
        }
        // Use server-calculated remise (authoritative)
      } catch {
        // coupons table might not exist → accept claimed remise
        serverRemise = Number(coupon_remise_claimed ?? 0);
      }
    }

    // 4. Compare totals
    const expectedTotal = serverSubtotal - serverRemise + serverFee;
    if (Math.abs(total_claimed - expectedTotal) > PRICE_TOLERANCE) {
      console.warn(
        `[orders] Price mismatch: claimed=${total_claimed}, expected=${expectedTotal}`,
        `(sub=${serverSubtotal}, fee=${serverFee}, remise=${serverRemise})`
      );
      return { ok: false, error: `Total invalide. Attendu : ${expectedTotal} FCFA, reçu : ${total_claimed} FCFA.` };
    }

    return { ok: true, subtotal: serverSubtotal, fee: serverFee, remise: serverRemise };
  } catch (err) {
    // Validation error (e.g. missing column) — log and allow order to proceed
    console.error("[orders] price validation error (non-blocking):", err);
    return { ok: true, subtotal: Number(total_claimed), fee: Number(delivery_fee_claimed), remise: Number(coupon_remise_claimed ?? 0) };
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
      payment_mode, nb_tranches, ref_code,
      coupon_code, coupon_remise,
      mm_screenshot_b64,
    } = req.body;

    if (!telephone?.trim() || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Téléphone et articles requis." });
    }
    const cleanTelephone = normalizeTogoPhone(telephone);
    if (!cleanTelephone) {
      return res.status(400).json({ error: "Le numéro WhatsApp doit contenir exactement 8 chiffres togolais." });
    }
    if ((payment_mode === "moov_direct" || payment_mode === "yas_direct") && !mm_screenshot_b64) {
      return res.status(400).json({ error: "La capture d'écran de confirmation est obligatoire." });
    }

    // Upload payment screenshot to Cloudinary
    let mm_transaction_ref: string | null = null;
    if (mm_screenshot_b64) {
      try {
        mm_transaction_ref = await uploadScreenshotToCloudinary(mm_screenshot_b64);
      } catch (uploadErr) {
        console.error("[orders] screenshot upload failed:", uploadErr);
        return res.status(500).json({ error: "Échec de l'upload de la capture d'écran. Réessayez." });
      }
    }

    // Server-side price validation — prevents client-side total manipulation
    const priceCheck = await validateOrderPricing(
      items,
      zone_livraison,
      Number(delivery_fee ?? 0),
      coupon_code,
      Number(coupon_remise ?? 0),
      Number(total ?? 0),
    );
    if (!priceCheck.ok) {
      return res.status(400).json({ error: priceCheck.error });
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
