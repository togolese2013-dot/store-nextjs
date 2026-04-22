import express from "express";
import { getLivreurByCode, getLivraisonsForLivreur, accepterLivraison } from "@/lib/admin-db";

const router = express.Router();

router.get("/api/livreur/:code/courses", async (req, res) => {
  try {
    const livreur = await getLivreurByCode(req.params.code);
    if (!livreur) return res.status(404).json({ error: "Code livreur invalide." });
    const livraisons = await getLivraisonsForLivreur(livreur.id);
    res.json({ livreur, livraisons });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/livreur/:code/accepter", async (req, res) => {
  try {
    const livreur = await getLivreurByCode(req.params.code);
    if (!livreur) return res.status(404).json({ error: "Code livreur invalide." });
    if (livreur.statut === "indisponible") {
      return res.status(403).json({ error: "Vous êtes marqué indisponible." });
    }
    const { livraison_id, montant_livraison } = req.body;
    if (!livraison_id) return res.status(400).json({ error: "livraison_id requis." });
    const accepted = await accepterLivraison(
      Number(livraison_id),
      livreur.id,
      montant_livraison ? Number(montant_livraison) : undefined
    );
    if (!accepted) return res.status(409).json({ error: "Cette livraison a déjà été prise." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
