import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur,
  listAchats, countAchats, getAchatStats, createAchat, getAchatById, updateAchat,
} from "@/lib/admin-db";

const router = express.Router();

// ── Fournisseurs ──────────────────────────────────────────────────────────
router.get("/api/admin/fournisseurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const fournisseurs = await listFournisseurs();
  res.json({ fournisseurs });
});

router.post("/api/admin/fournisseurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { nom, contact, telephone, email, adresse, note } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: "Le nom est obligatoire." });
    const id = await createFournisseur({ nom, contact, telephone, email, adresse, note });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.patch("/api/admin/fournisseurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateFournisseur(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/fournisseurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteFournisseur(Number(req.params.id));
  res.json({ ok: true });
});

// ── Achats ────────────────────────────────────────────────────────────────
router.get("/api/admin/achats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const page   = Math.max(1, Number(req.query.page) || 1);
  const limit  = 20;
  const offset = (page - 1) * limit;
  const [achats, total, stats] = await Promise.all([listAchats(limit, offset), countAchats(), getAchatStats()]);
  res.json({ achats, total, stats, page, limit });
});

router.post("/api/admin/achats", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { fournisseur_id, reference, date_achat, statut, note, transport, items } = req.body;
    if (!date_achat)    return res.status(400).json({ error: "La date est obligatoire." });
    if (!items?.length) return res.status(400).json({ error: "Au moins un article est requis." });
    const id = await createAchat({ fournisseur_id: fournisseur_id ?? null, reference: reference || undefined, date_achat, statut: statut ?? "en_attente", note: note ?? null, transport: transport ?? null, items });
    emitAdminEvent("achat");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.get("/api/admin/achats/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const achat = await getAchatById(Number(req.params.id));
  if (!achat) return res.status(404).json({ error: "Achat introuvable." });
  res.json({ achat });
});

router.patch("/api/admin/achats/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateAchat(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
