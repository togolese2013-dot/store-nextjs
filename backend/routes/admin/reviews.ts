import express from "express";
import { getSession } from "../../lib/auth";
import { approveReview, deleteReview } from "@/lib/admin-db";

const router = express.Router();

router.post("/api/admin/reviews", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  const { id, approved, _delete } = req.body;
  if (!id) return res.status(400).json({ error: "id requis" });

  try {
    if (_delete) {
      await deleteReview(Number(id));
    } else {
      await approveReview(Number(id), Boolean(approved));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
