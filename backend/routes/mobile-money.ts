import express from "express";
import { db } from "@/lib/db";
import { addOrderEvent, emitAdminEvent } from "@/lib/admin-db";
import { emitAdminEvent as emitEvent } from "../lib/admin-events";
import type mysql from "mysql2/promise";

const router = express.Router();

const FEDAPAY_BASE = "https://api.fedapay.com/v1";

function fedapayHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
  };
}

/* ─── Operator → FedaPay mode mapping ─── */
const OPERATOR_MODE: Record<string, string> = {
  flooz: "moov",
  yas:   "moov", // Mix by Yas = réseau Moov Africa Togo
};

/* ──────────────────────────────────────────────
   POST /api/orders/pay/mobile-money
   Body: { orderId, orderRef, operator, phone, total, nom }
────────────────────────────────────────────── */
router.post("/api/orders/pay/mobile-money", async (req, res) => {
  try {
    const { orderId, orderRef, operator, phone, total, nom } = req.body as {
      orderId:  number;
      orderRef: string;
      operator: string;
      phone:    string;
      total:    number;
      nom:      string;
    };

    if (!orderId || !operator || !phone || !total) {
      return res.status(400).json({ error: "Paramètres manquants." });
    }

    const mode = OPERATOR_MODE[operator];
    if (!mode) return res.status(400).json({ error: "Opérateur non supporté." });

    const cleanPhone = phone.replace(/\D/g, "").replace(/^228/, "");

    const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://store.togolese.fr";

    /* 1 — Créer la transaction FedaPay */
    const txRes = await fetch(`${FEDAPAY_BASE}/transactions`, {
      method:  "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        description:  `Commande ${orderRef}`,
        amount:       Math.round(total),
        currency:     { iso: "XOF" },
        callback_url: `${process.env.BACKEND_URL || ""}/api/webhooks/fedapay`,
        return_url:   `${siteUrl}/account/commandes`,
        customer: {
          firstname: nom || "Client",
          lastname:  "",
          phone_number: { number: cleanPhone, country: "tg" },
        },
      }),
    });

    const txData = await txRes.json() as { v1?: { transaction?: { id: number } }; message?: string };
    const txId = txData?.v1?.transaction?.id;

    if (!txId) {
      console.error("[fedapay create]", txData);
      return res.status(502).json({ error: "Impossible de créer la transaction FedaPay." });
    }

    /* 2 — Initialiser le paiement (envoie le push USSD) */
    const payRes = await fetch(`${FEDAPAY_BASE}/transactions/${txId}/pay`, {
      method:  "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        mode,
        mobile_money: { number: cleanPhone, country: "tg" },
      }),
    });

    const payData = await payRes.json() as { message?: string };
    if (!payRes.ok) {
      console.error("[fedapay pay]", payData);
      return res.status(502).json({ error: payData.message || "Erreur lors de l'envoi USSD." });
    }

    /* 3 — Stocker txId sur la commande */
    const pool = db as mysql.Pool;
    try {
      await pool.execute("ALTER TABLE orders ADD COLUMN fedapay_tx_id INT NULL", []);
    } catch { /* already exists */ }
    try {
      await pool.execute("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'non_paye'", []);
    } catch { /* already exists */ }

    await pool.execute(
      "UPDATE orders SET fedapay_tx_id = ?, payment_status = 'en_attente' WHERE id = ?",
      [txId, orderId]
    );

    return res.json({ ok: true, transactionId: txId });
  } catch (err) {
    console.error("[mobile-money pay]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   GET /api/orders/pay/status/:txId
   Polling côté client — vérifie uniquement notre DB
   (seul le webhook FedaPay peut passer payment_status à 'paye')
────────────────────────────────────────────── */
router.get("/api/orders/pay/status/:txId", async (req, res) => {
  try {
    const txId = Number(req.params.txId);
    const pool = db as mysql.Pool;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT payment_status FROM orders WHERE fedapay_tx_id = ? LIMIT 1",
      [txId]
    );

    const paymentStatus = rows[0]?.payment_status as string | undefined;
    return res.json({ status: paymentStatus === "paye" ? "approved" : "pending" });
  } catch (err) {
    console.error("[mobile-money status]", err);
    return res.status(500).json({ error: "Erreur statut." });
  }
});

/* ──────────────────────────────────────────────
   POST /api/webhooks/fedapay
   Reçu automatiquement par FedaPay après confirmation client
────────────────────────────────────────────── */
router.post("/api/webhooks/fedapay", async (req, res) => {
  try {
    const event = req.body as {
      name?: string;
      entity?: { id?: number; status?: string; description?: string; amount?: number };
    };

    if (event.name !== "transaction.approved") {
      return res.json({ received: true });
    }

    const txId  = event.entity?.id;
    const amount = event.entity?.amount;
    if (!txId) return res.json({ received: true });

    const pool = db as mysql.Pool;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, reference, nom, total FROM orders WHERE fedapay_tx_id = ? LIMIT 1",
      [txId]
    );
    const order = rows[0];
    if (!order) return res.json({ received: true });

    await pool.execute(
      "UPDATE orders SET payment_status = 'paye', status = 'confirmée' WHERE id = ?",
      [order.id]
    );

    await addOrderEvent(order.id as number, "confirmée", `Paiement Mobile Money confirmé — ${amount ? `${amount} FCFA` : ""}`);

    emitEvent("paiement", {
      orderId:   order.id,
      reference: order.reference,
      nom:       order.nom,
      total:     order.total,
    });

    return res.json({ received: true });
  } catch (err) {
    console.error("[webhook/fedapay]", err);
    return res.status(500).json({ error: "Erreur webhook." });
  }
});

export default router;
