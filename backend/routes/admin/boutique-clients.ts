import express from "express";
import { getSession } from "../../lib/auth";
import {
  listBoutiqueClients, countBoutiqueClients, createBoutiqueClient,
  getBoutiqueClientsStats, updateBoutiqueClient, deleteBoutiqueClient,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/boutique-clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const page   = Math.max(1, Number(req.query.page ?? 1));
  const limit  = 30;
  const offset = (page - 1) * limit;
  const search = (req.query.q as string) ?? "";
  const filtre = ((req.query.filtre as string) ?? "tous") as "tous"|"debiteurs"|"dettes";
  const stats  = req.query.stats === "1";

  if (stats) {
    try {
      const data = await getBoutiqueClientsStats();
      return res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("doesn't exist")) return res.json({ success: true, data: null, _migrationNeeded: true });
      return res.status(500).json({ error: msg });
    }
  }

  try {
    const [clients, total] = await Promise.all([
      listBoutiqueClients(limit, offset, search, filtre),
      countBoutiqueClients(search, filtre),
    ]);
    res.json({ success: true, data: clients, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("doesn't exist")) return res.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    res.status(500).json({ error: msg });
  }
});

router.post("/api/admin/boutique-clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!req.body.nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createBoutiqueClient(req.body);
  res.json({ success: true, id });
});

router.patch("/api/admin/boutique-clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await updateBoutiqueClient(Number(req.params.id), req.body);
  res.json({ success: true });
});

router.delete("/api/admin/boutique-clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteBoutiqueClient(Number(req.params.id));
  res.json({ success: true });
});

export default router;
