import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listLivraisonsAdmin, createManualLivraison, updateLivraisonAdmin, deleteLivraison,
  listLivreurs, createLivreur, updateLivreur, deleteLivreur, getLivraisonsStats,
} from "@/lib/admin-db";

const router = express.Router();

// ── Livraisons ─────────────────────────────────────────────────────────────
router.get("/api/admin/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const search = (req.query.q as string)      || undefined;
  const statut = (req.query.statut as string) || undefined;
  const limit  = Math.min(100, Number(req.query.limit) || 50);
  const offset = Math.max(0, Number(req.query.offset)  || 0);
  const [{ items, total }, stats] = await Promise.all([
    listLivraisonsAdmin({ search, statut, limit, offset }),
    getLivraisonsStats(),
  ]);
  res.json({ items, total, stats });
});

router.post("/api/admin/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { client_nom, client_tel, adresse, contact_livraison, lien_localisation, note } = req.body;
    if (!client_nom?.trim()) return res.status(400).json({ error: "Nom du client requis." });
    const id = await createManualLivraison({ client_nom, client_tel, adresse, contact_livraison, lien_localisation, note });
    emitAdminEvent("livraison");
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/livraisons/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateLivraisonAdmin(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/livraisons/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteLivraison(Number(req.params.id));
  res.json({ ok: true });
});

// ── Livreurs ───────────────────────────────────────────────────────────────
router.get("/api/admin/livreurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const livreurs = await listLivreurs();
  res.json({ items: livreurs });
});

router.post("/api/admin/livreurs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { nom, telephone, numero_plaque } = req.body;
    if (!nom?.trim()) return res.status(400).json({ error: "nom requis." });
    const livreur = await createLivreur({ nom: nom.trim(), telephone, numero_plaque: numero_plaque?.trim() || undefined });
    res.json({ ok: true, livreur });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/livreurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateLivreur(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/livreurs/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteLivreur(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
