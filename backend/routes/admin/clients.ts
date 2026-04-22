import express from "express";
import { getSession } from "../../lib/auth";
import {
  listClients, countClients, upsertClient, getCRMStats,
  getClientById, deleteClient, getClientOrders, getClientStats,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const page   = Math.max(1, Number(req.query.page) ?? 1);
  const limit  = 30;
  const offset = (page - 1) * limit;
  const search = (req.query.q as string) ?? "";
  const stats  = req.query.stats === "1";

  if (stats) {
    try {
      const crmStats = await getCRMStats();
      return res.json({ success: true, data: crmStats });
    } catch {
      return res.json({ success: true, data: { newClients30d: 0, topClients: [] } });
    }
  }

  try {
    const [clients, total] = await Promise.all([
      listClients(limit, offset, search),
      countClients(search),
    ]);
    res.json({ success: true, data: clients, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("doesn't exist") || msg.includes("Unknown column")) {
      return res.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    }
    res.status(500).json({ error: msg });
  }
});

router.post("/api/admin/clients", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!req.body.telephone?.trim()) {
    return res.status(400).json({ error: "Téléphone requis." });
  }
  const id = await upsertClient(req.body);
  res.json({ success: true, id });
});

router.get("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const client = await getClientById(Number(req.params.id));
  if (!client) return res.status(404).json({ error: "Client introuvable." });
  const [orders, clientStats] = await Promise.all([
    getClientOrders(client.telephone),
    getClientStats(client.telephone),
  ]);
  res.json({ success: true, data: { client, orders, stats: clientStats } });
});

router.put("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const client = await getClientById(Number(req.params.id));
  if (!client) return res.status(404).json({ error: "Client introuvable." });
  await upsertClient({ ...req.body, telephone: client.telephone });
  res.json({ success: true });
});

router.delete("/api/admin/clients/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (session.role !== "super_admin") return res.status(403).json({ error: "Droits insuffisants." });
  await deleteClient(Number(req.params.id));
  res.json({ success: true });
});

export default router;
