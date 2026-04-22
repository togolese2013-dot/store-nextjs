import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  getProduitsWithStock, getStockMovements, getStockMovementCounts,
  createStockEntree, createStockSortie, createStockAjustement,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/stock/produits", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const produits = await getProduitsWithStock();
    res.json({ produits });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/stock/entrepots", (_req, res) => {
  res.json({ entrepots: [] });
});

router.get("/api/admin/stock/mouvements", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const type   = (req.query.type as string) || undefined;
    const search = (req.query.q as string)    || undefined;
    const limit  = Math.min(100, Number(req.query.limit)  || 50);
    const offset = Math.max(0,   Number(req.query.offset) || 0);
    const [{ items, total }, counts] = await Promise.all([
      getStockMovements({ type: type as "entree"|"retrait"|"vente"|"sortie"|"tous"|"ajustement", search, limit, offset }),
      getStockMovementCounts(),
    ]);
    res.json({ items, total, counts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/stock/entree", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { produit_id, quantite, reference, note } = req.body;
    if (!produit_id || !quantite || quantite <= 0) {
      return res.status(400).json({ error: "produit_id et quantite (> 0) requis." });
    }
    await createStockEntree({ produit_id, quantite: Number(quantite), reference, note, user_id: session.id });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/stock/sortie", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { produit_id, quantite, reference, note } = req.body;
    if (!produit_id || !quantite || quantite <= 0) {
      return res.status(400).json({ error: "produit_id et quantite (> 0) requis." });
    }
    await createStockSortie({ produit_id, quantite: Number(quantite), reference, note, user_id: session.id });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/stock/ajustement", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { produit_id, quantite, motif } = req.body;
    if (!produit_id || quantite === undefined || quantite === null) {
      return res.status(400).json({ error: "produit_id et quantite requis." });
    }
    if (!motif?.trim()) {
      return res.status(400).json({ error: "Un motif est requis pour un ajustement." });
    }
    await createStockAjustement({ produit_id, quantite: Number(quantite), motif, user_id: session.id });
    emitAdminEvent("stock");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
