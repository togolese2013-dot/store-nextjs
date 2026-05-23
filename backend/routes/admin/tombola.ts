import express from "express";
import { getSession } from "../../lib/auth";
import { sendWaText } from "../../lib/whatsapp";
import {
  listTombolaSessions,
  getTombolaSession,
  createTombolaSession,
  updateTombolaSession,
  deleteTombolaSession,
  getTombolaParticipants,
  spinTombola,
  markTombolaNotified,
} from "@/lib/admin-db";

const router = express.Router();

// GET /api/admin/tombola
router.get("/api/admin/tombola", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  try {
    const sessions = await listTombolaSessions();
    res.json({ data: sessions });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/tombola — create or update
router.post("/api/admin/tombola", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  const { id, nom, min_montant, min_participants, prize_description, statut } = req.body;
  if (!nom) return res.status(400).json({ error: "nom requis" });
  try {
    if (id) {
      await updateTombolaSession(Number(id), {
        nom,
        min_montant:      Number(min_montant),
        min_participants: Number(min_participants),
        prize_description: prize_description ?? null,
        statut,
      });
      res.json({ ok: true });
    } else {
      const newId = await createTombolaSession({
        nom,
        min_montant:      Number(min_montant) || 50000,
        min_participants: Number(min_participants) || 10,
        prize_description: prize_description ?? null,
      });
      res.json({ ok: true, id: newId });
    }
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/tombola/:id/participants
router.get("/api/admin/tombola/:id/participants", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola) return res.status(404).json({ error: "Tombola introuvable" });
    const participants = await getTombolaParticipants(tombola.min_montant);
    res.json({
      data:  participants,
      ready: participants.length >= tombola.min_participants,
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/tombola/:id/spin — lock the winner
router.post("/api/admin/tombola/:id/spin", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  const { winner_facture_id } = req.body;
  if (!winner_facture_id) return res.status(400).json({ error: "winner_facture_id requis" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola) return res.status(404).json({ error: "Tombola introuvable" });
    if (tombola.statut === "termine") return res.status(400).json({ error: "Tombola déjà terminée" });
    await spinTombola(Number(req.params.id), Number(winner_facture_id));
    const updated = await getTombolaSession(Number(req.params.id));
    res.json({ ok: true, winner: updated });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Erreur serveur" });
  }
});

// POST /api/admin/tombola/:id/notify — WhatsApp au gagnant
router.post("/api/admin/tombola/:id/notify", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  try {
    const tombola = await getTombolaSession(Number(req.params.id));
    if (!tombola)               return res.status(404).json({ error: "Tombola introuvable" });
    if (!tombola.winner_tel)    return res.status(400).json({ error: "Pas de téléphone gagnant" });
    if (!tombola.winner_nom)    return res.status(400).json({ error: "Pas de nom gagnant" });
    const prize = tombola.prize_description ?? "votre lot";
    await sendWaText({
      to:   tombola.winner_tel,
      body: `🎉 Félicitations ${tombola.winner_nom} ! Vous avez gagné la tombola Togolese Shop et remportez ${prize} ! Contactez-nous pour récupérer votre lot. 📞 +22890527912`,
    });
    await markTombolaNotified(Number(req.params.id));
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Erreur envoi WhatsApp" });
  }
});

// DELETE /api/admin/tombola/:id — uniquement statut draft
router.delete("/api/admin/tombola/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non authentifié" });
  try {
    await deleteTombolaSession(Number(req.params.id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
