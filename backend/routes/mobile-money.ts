import express from "express";
import { db } from "@/lib/db";
import { addOrderEvent } from "@/lib/admin-db";
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

const OPERATOR_MODE: Record<string, string> = {
  flooz: "moov",
  yas:   "moov",
};

/* ──────────────────────────────────────────────
   GET /api/debug/fedapay-test  (diagnostic — à supprimer après)
   Appelle: /api/debug/fedapay-test?phone=90000000
────────────────────────────────────────────── */
router.get("/api/debug/fedapay-test", async (req, res) => {
  const phone = String(req.query.phone || "90000000");
  const log: Record<string, unknown> = { phone };

  try {
    /* Test 1: créer le client */
    const custRes = await fetch(`${FEDAPAY_BASE}/customers`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({ firstname: "Test", lastname: "Debug", phone_number: { number: phone, country: "tg" } }),
    });
    const custData = await custRes.json();
    log.step1_status = custRes.status;
    log.step1_customer = custData;

    const customerId = (custData as any)?.["v1/customer"]?.id;
    if (!customerId) return res.json({ ok: false, error: "customer creation failed", log });

    /* Test 2: créer la transaction */
    const txRes = await fetch(`${FEDAPAY_BASE}/transactions`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({
        description: "Test diagnostic",
        amount: 100,
        currency: { iso: "XOF" },
        callback_url: "https://example.com/webhook",
        customer: { id: customerId },
      }),
    });
    const txData = await txRes.json();
    log.step2_status = txRes.status;
    log.step2_transaction = txData;

    const txId = (txData as any)?.["v1/transaction"]?.id;
    if (!txId) return res.json({ ok: false, error: "transaction creation failed", log });

    /* Test 3: générer le token */
    const tokenRes = await fetch(`${FEDAPAY_BASE}/transactions/${txId}/token`, {
      method: "POST",
      headers: fedapayHeaders(),
      body: JSON.stringify({}),
    });
    const tokenData = await tokenRes.json();
    log.step3_status = tokenRes.status;
    log.step3_token = tokenData;

    return res.json({ ok: true, log });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err), log });
  }
});

/* ──────────────────────────────────────────────
   POST /api/orders/pay/mobile-money
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

    /* ── Étape 1 : Créer la transaction avec customer inline ── */
    const parts = (nom || "Client").trim().split(/\s+/);
    const firstname = parts[0];
    const lastname  = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];

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
          firstname,
          lastname,
          phone_number: { number: cleanPhone, country: "tg" },
        },
      }),
    });

    const txData = await txRes.json() as {
      "v1/transaction"?: { id: number };
      message?: string;
      errors?: unknown;
    };

    console.error("[fedapay] create transaction response:", JSON.stringify(txData));

    const txId = txData?.["v1/transaction"]?.id;

    if (!txId) {
      return res.status(502).json({
        error: "Impossible de créer la transaction FedaPay.",
        detail: txData,
      });
    }

    /* ── Étape 3 : Générer le token de paiement ── */
    const tokenRes = await fetch(`${FEDAPAY_BASE}/transactions/${txId}/token`, {
      method:  "POST",
      headers: fedapayHeaders(),
      body:    JSON.stringify({}),
    });

    const tokenData = await tokenRes.json() as { token?: string; message?: string };

    if (!tokenRes.ok || !tokenData.token) {
      console.error("[fedapay] generate token failed:", JSON.stringify(tokenData));
      return res.status(502).json({ error: "Impossible de générer le token de paiement." });
    }

    /* ── Étape 4 : Envoyer le push USSD ── */
    const pushRes = await fetch(`${FEDAPAY_BASE}/${mode}`, {
      method:  "POST",
      headers: fedapayHeaders(),
      body:    JSON.stringify({ token: tokenData.token }),
    });

    const pushData = await pushRes.json() as { message?: string };

    if (!pushRes.ok) {
      console.error("[fedapay] USSD push failed:", JSON.stringify(pushData));
      return res.status(502).json({ error: pushData.message || "Erreur lors de l'envoi du push USSD." });
    }

    /* ── Étape 5 : Stocker txId sur la commande ── */
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
────────────────────────────────────────────── */
router.post("/api/webhooks/fedapay", async (req, res) => {
  try {
    const event = req.body as {
      name?: string;
      entity?: { id?: number; status?: string; amount?: number };
    };

    if (event.name !== "transaction.approved") {
      return res.json({ received: true });
    }

    const txId   = event.entity?.id;
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
