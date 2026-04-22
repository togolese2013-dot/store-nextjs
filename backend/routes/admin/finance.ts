import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listFinanceEntries, getFinanceStats, createFinanceEntry,
  updateFinanceEntry, deleteFinanceEntry,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const type   = (req.query.type as string) || undefined;
    const search = (req.query.q as string)    || undefined;
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0,   Number(req.query.offset) || 0);
    const [{ items, total }, stats] = await Promise.all([
      listFinanceEntries({ type, search, limit, offset }),
      getFinanceStats(),
    ]);
    res.json({ items, total, stats });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { type, mode_paiement, categorie, description, montant, date_entree } = req.body;
    if (!type || !montant || !date_entree) {
      return res.status(400).json({ error: "type, montant et date_entree sont requis." });
    }
    const id = await createFinanceEntry({ type, mode_paiement, categorie, description, montant: Number(montant), date_entree });
    emitAdminEvent("finance");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateFinanceEntry(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await deleteFinanceEntry(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
