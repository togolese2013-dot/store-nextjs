import express from "express";
import { getSession } from "../../lib/auth";
import {
  listStockAlerts, createStockAlert, updateStockAlert, deleteStockAlert,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/stock-alerts", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const alerts = await listStockAlerts(session.shop_id ?? 1);
  res.json({ alerts });
});

router.post("/api/admin/stock-alerts", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { nom, target_type, target, threshold, channels, active } = req.body;
    if (!nom?.trim())    return res.status(400).json({ error: "Nom requis." });
    if (!target?.trim()) return res.status(400).json({ error: "Cible requise." });
    const id = await createStockAlert({
      nom, target_type: target_type ?? 'Produit', target,
      threshold: Number(threshold) || 5,
      channels: Array.isArray(channels) ? channels : [],
      active: active ? 1 : 0,
      shop_id: session.shop_id ?? 1,
    }, session.shop_id ?? 1);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/stock-alerts/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const data: Record<string, any> = {};
    const b = req.body;
    if (b.nom         !== undefined) data.nom         = b.nom;
    if (b.target_type !== undefined) data.target_type = b.target_type;
    if (b.target      !== undefined) data.target      = b.target;
    if (b.threshold   !== undefined) data.threshold   = Number(b.threshold);
    if (b.channels    !== undefined) data.channels    = Array.isArray(b.channels) ? b.channels : [];
    if (b.active      !== undefined) data.active      = b.active ? 1 : 0;
    await updateStockAlert(Number(req.params.id), data, session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/stock-alerts/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteStockAlert(Number(req.params.id), session.shop_id ?? 1);
  res.json({ ok: true });
});

export default router;
