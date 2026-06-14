import express from "express";
import { getSession } from "../../lib/auth";
import { getShopById, getShopPayments, recordShopPayment, activateBasicPlan } from "@/lib/shops";
import { getPlanPrice } from "../../lib/cinetpay";

const router = express.Router();

const MERCHANT_NUMBERS: Record<"moov" | "yas", string> = {
  moov: process.env.MERCHANT_MOOV ?? "98165380",
  yas:  process.env.MERCHANT_YAS  ?? "90226491",
};

// ── GET /api/admin/billing — statut abonnement actuel ────────────────────────
router.get("/api/admin/billing", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  try {
    const shop = await getShopById(session.shop_id);
    if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

    const payments = await getShopPayments(session.shop_id);

    res.json({
      shop_id:             shop.id,
      nom:                 shop.nom,
      plan:                shop.plan,
      subscription_status: shop.subscription_status,
      trial_ends_at:       shop.trial_ends_at,
      current_period_end:  shop.current_period_end,
      actif:               shop.actif,
      merchant_moov:       MERCHANT_NUMBERS.moov,
      merchant_yas:        MERCHANT_NUMBERS.yas,
      payments,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/billing/initiate — soumettre un paiement manuel ──────────
router.post("/api/admin/billing/initiate", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const { plan, duration_months = 1, operator, mm_reference } = req.body as {
    plan?:            string;
    duration_months?: number;
    operator?:        string;
    mm_reference?:    string;
  };

  if (!plan || !["basic", "pro", "business"].includes(plan)) {
    return res.status(400).json({ error: "Plan invalide." });
  }
  if (!operator || !["moov", "yas"].includes(operator)) {
    return res.status(400).json({ error: "Opérateur invalide (moov ou yas)." });
  }
  if (!mm_reference || mm_reference.trim().length < 3) {
    return res.status(400).json({ error: "Référence de transaction requise." });
  }

  const months       = Math.min(Math.max(Number(duration_months) || 1, 1), 12);
  const planKey      = plan as "basic" | "pro" | "business";
  const pricePerMonth = await getPlanPrice(planKey);
  const amount       = pricePerMonth * months;

  // Basic is free — activate immediately, no payment record needed
  if (planKey === "basic") {
    try {
      await activateBasicPlan(session.shop_id);
      return res.json({ ok: true, activated: true });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
    }
  }

  const transactionId = `SAAS-${session.shop_id}-${planKey.toUpperCase()}-${Date.now()}`;

  try {
    await recordShopPayment({
      shopId:         session.shop_id,
      transactionId,
      plan:           planKey,
      amount,
      durationMonths: months,
      status:         "pending",
      operator:       operator as "moov" | "yas",
      mmReference:    mm_reference.trim(),
    });

    res.json({ ok: true, transactionId, amount });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
