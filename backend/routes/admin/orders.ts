import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listOrders, countOrders, createOrder, addOrderEvent,
  updateOrderStatus, getOrderById,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/orders", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const page   = Math.max(1, Number(req.query.page ?? 1));
  const limit  = 25;
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
  emitAdminEvent("commande");
  res.json({ success: true, id });
});

router.get("/api/admin/orders/sse", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end();
  // SSE handled by events route — fallback empty
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  req.on("close", () => res.end());
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
  const { status, note } = req.body;
  await updateOrderStatus(Number(req.params.id), status);
  await addOrderEvent(Number(req.params.id), status, note ?? "", session.nom);
  res.json({ ok: true });
});

export default router;
