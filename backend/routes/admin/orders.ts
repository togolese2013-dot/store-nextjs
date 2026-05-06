import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";
import {
  listOrders, countOrders, createOrder, addOrderEvent,
  updateOrderStatus, updateOrderFields, deleteOrder, getOrderById,
  applyOrderDeliveredEffects, ensureOrderVente,
} from "@/lib/admin-db";

async function ensurePaymentColumn() {
  try {
    await (db as mysql.Pool).execute(
      "ALTER TABLE orders ADD COLUMN statut_paiement VARCHAR(50) NULL DEFAULT 'non_paye'"
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code !== "ER_DUP_FIELDNAME") throw err;
  }
}

const router = express.Router();

router.get("/api/admin/orders", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const page   = Math.max(1, Number(req.query.page ?? 1));
  const limit  = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([listOrders(limit, offset), countOrders()]);
  res.json({ success: true, data: orders, total, page, limit });
});

router.post("/api/admin/orders", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, telephone, adresse, zone_livraison, delivery_fee, note, items } = req.body;
  if (!telephone?.trim() || !items?.length) {
    return res.status(400).json({ error: "Téléphone et articles requis." });
  }
  const subtotal = items.reduce((s: number, i: { total: number }) => s + i.total, 0);
  const total    = subtotal + Number(delivery_fee ?? 0);
  const id = await createOrder({ nom, telephone, adresse, zone_livraison, delivery_fee: Number(delivery_fee ?? 0), note, items, subtotal, total });
  await addOrderEvent(id, "pending", "Commande créée par l'admin", session.nom);

  const [rows] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
    "SELECT reference, created_at FROM orders WHERE id = ? LIMIT 1", [id]
  );
  emitAdminEvent("commande", {
    id,
    reference:  rows[0]?.reference  ?? `CMD-${id}`,
    nom:        nom                 ?? "",
    total,
    created_at: String(rows[0]?.created_at ?? new Date().toISOString().slice(0, 19).replace("T", " ")),
  });
  res.json({ success: true, id });
});

router.get("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const order = await getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Commande introuvable." });
  res.json({ success: true, data: order });
});

router.patch("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const id = Number(req.params.id);

  /* ── Status change ── */
  if (req.body.status !== undefined && req.body.field !== "update") {
    const { status, note } = req.body;
    await updateOrderStatus(id, status);
    await addOrderEvent(id, status, note ?? "", session.nom);

    /* When confirmed: create livraison entry so it appears in BOUTIQUE livraisons + livreur platform */
    if (String(status) === "confirmed") {
      try {
        const [[orderRow]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
          "SELECT id, reference, nom, telephone, adresse, zone_livraison, lien_localisation FROM orders WHERE id = ? LIMIT 1",
          [id]
        );
        if (orderRow) {
          /* Idempotent — don't create duplicate for same order */
          const [[existing]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
            "SELECT id FROM livraisons_ventes WHERE order_id = ? LIMIT 1", [id]
          );
          if (!existing) {
            const livRef = `LV-${orderRow.reference}`;
            await (db as mysql.Pool).execute(
              `INSERT IGNORE INTO livraisons_ventes
                 (reference, facture_id, client_nom, client_tel, adresse, contact_livraison,
                  lien_localisation, statut, note, order_id)
               VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', NULL, ?)`,
              [
                livRef,
                orderRow.nom        ?? null,
                orderRow.telephone  ?? null,
                orderRow.adresse    ?? null,
                orderRow.telephone  ?? null,
                orderRow.lien_localisation ?? null,
                id,
              ]
            );
          }
        }
      } catch (e) {
        console.error("[orders] livraison creation failed:", e);
      }
    }

    // Create/sync facture at any status change — first admin to confirm = vendeur
    const actor = { id: typeof session.id === "number" ? session.id : undefined, nom: session.nom };
    await ensureOrderVente(id, actor).catch(e => console.error("[orders] ensureOrderVente failed:", e));

    if (["delivered", "livree", "livrée", "livre", "livré"].includes(String(status))) {
      await applyOrderDeliveredEffects(id, session.nom);
      await ensureOrderVente(id, actor);
      emitAdminEvent("stock");
    }
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }

  /* ── Payment status ── */
  if (req.body.field === "payment") {
    await ensurePaymentColumn();
    const { payment_status } = req.body;
    await updateOrderFields(id, { statut_paiement: payment_status });
    // Sync linked boutique facture
    const [[orderRow]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT vente_facture_id FROM orders WHERE id = ? LIMIT 1", [id]
    );
    if (orderRow?.vente_facture_id) {
      const facturePaiement = payment_status === "paye" ? "paye_total" : payment_status;
      await (db as mysql.Pool).execute(
        "UPDATE factures SET statut_paiement = ? WHERE id = ?",
        [facturePaiement, orderRow.vente_facture_id]
      );
    }
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }

  /* ── Confirm Mobile Money direct payment ── */
  if (req.body.field === "confirm_mm") {
    await ensurePaymentColumn();
    await updateOrderFields(id, { statut_paiement: "paye" });
    // Sync linked boutique facture
    const [[mmOrderRow]] = await (db as mysql.Pool).execute<mysql.RowDataPacket[]>(
      "SELECT vente_facture_id FROM orders WHERE id = ? LIMIT 1", [id]
    );
    if (mmOrderRow?.vente_facture_id) {
      await (db as mysql.Pool).execute(
        "UPDATE factures SET statut_paiement = 'paye_total' WHERE id = ?",
        [mmOrderRow.vente_facture_id]
      );
    }
    await addOrderEvent(id, "confirmée", "Paiement Mobile Money vérifié et confirmé", session.nom);
    emitAdminEvent("finance");
    emitAdminEvent("commande");
    return res.json({ ok: true });
  }

  /* ── Full order update ── */
  if (req.body.field === "update") {
    const { nom, telephone, adresse, zone_livraison, note, delivery_fee, items, lien_localisation } = req.body;
    const parsedItems  = Array.isArray(items) ? items : [];
    const subtotal     = parsedItems.reduce((s: number, i: { total: number }) => s + i.total, 0);
    const deliveryFee  = Number(delivery_fee ?? 0);
    const total        = subtotal + deliveryFee;
    await updateOrderFields(id, {
      nom, telephone, adresse, zone_livraison, note,
      delivery_fee: deliveryFee,
      subtotal,
      total,
      items: JSON.stringify(parsedItems),
      lien_localisation: lien_localisation ?? null,
    });
    await addOrderEvent(id, "modifiée", "Commande modifiée par l'admin", session.nom);
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: "Action non reconnue." });
});

router.delete("/api/admin/orders/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  await deleteOrder(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
