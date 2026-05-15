import express from "express";
import { getSession } from "../../lib/auth";

const router = express.Router();

const N8N_WEBHOOK = "https://n8n.togolese.fr/webhook/facebook-publisher";

router.post("/api/admin/social/publish", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });

    const { type, products } = req.body;
    if (!type || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Payload invalide." });
    }

    const n8nRes = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, products }),
    });

    const data = await n8nRes.json().catch(() => ({}));

    if (!n8nRes.ok) {
      return res.status(502).json({ error: data?.error || `n8n a retourné HTTP ${n8nRes.status}` });
    }

    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
