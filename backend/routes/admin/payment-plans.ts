import express from "express";
import { getSession } from "../../lib/auth";
import {
  listPaymentPlans, getPaymentPlanByOrderId,
  markTranchePaid, markTrancheUnpaid, cancelPaymentPlan,
} from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

async function ensurePaymentTables() {
  const pool = db as mysql.Pool;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payment_plans (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      order_id        INT NOT NULL,
      nb_tranches     INT NOT NULL DEFAULT 4,
      montant_total   DECIMAL(10,2) NOT NULL,
      montant_tranche DECIMAL(10,2) NOT NULL,
      statut          ENUM('en_cours','solde','annule') DEFAULT 'en_cours',
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS payment_tranches (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      plan_id        INT NOT NULL,
      numero         INT NOT NULL,
      montant        DECIMAL(10,2) NOT NULL,
      date_echeance  DATE NOT NULL,
      date_paiement  DATETIME NULL,
      statut         ENUM('en_attente','payee','en_retard') DEFAULT 'en_attente',
      mode_paiement  VARCHAR(30) NULL,
      note           VARCHAR(255) NULL,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  // Add mode_paiement column if table already existed without it
  try {
    await pool.execute(`ALTER TABLE payment_tranches ADD COLUMN mode_paiement VARCHAR(30) NULL`);
  } catch (e: any) { if (e?.code !== "ER_DUP_FIELDNAME") throw e; }
}

// List all payment plans
router.get("/api/admin/payment-plans", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    await ensurePaymentTables();
    const plans = await listPaymentPlans();
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Get plan + tranches for a specific order
router.get("/api/admin/payment-plans/order/:orderId", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    await ensurePaymentTables();
    const plan = await getPaymentPlanByOrderId(Number(req.params.orderId));
    if (!plan) return res.status(404).json({ error: "Plan introuvable" });
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Mark a tranche as paid or unpaid
router.patch("/api/admin/payment-tranches/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    const { paid, note, mode_paiement } = req.body;
    if (paid) {
      await markTranchePaid(Number(req.params.id), note, mode_paiement);
    } else {
      await markTrancheUnpaid(Number(req.params.id));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Cancel a payment plan
router.delete("/api/admin/payment-plans/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    await cancelPaymentPlan(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export { ensurePaymentTables };
export default router;
