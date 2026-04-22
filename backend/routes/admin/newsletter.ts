import express from "express";
import { getSession } from "../../lib/auth";
import { listNewsletterSubscribers, deleteNewsletterSubscriber } from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/newsletter", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const subscribers = await listNewsletterSubscribers();
    res.json({ subscribers });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

router.delete("/api/admin/newsletter", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID manquant." });
    await deleteNewsletterSubscriber(Number(id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
