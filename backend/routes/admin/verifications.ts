import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

/* GET /api/admin/verifications */
router.get("/api/admin/verifications", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    const pool = db as mysql.Pool;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT av.id, av.user_id, av.id_card_url, av.selfie_url,
              av.statut, av.note_admin, av.created_at,
              cu.nom, cu.email, cu.telephone
       FROM account_verifications av
       JOIN client_users cu ON cu.id = av.user_id
       ORDER BY FIELD(av.statut, 'en_attente', 'rejete', 'verifie'), av.created_at DESC`
    );
    return res.json({ verifications: rows });
  } catch (err) {
    console.error("[admin/verifications GET]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* PATCH /api/admin/verifications/:id */
router.patch("/api/admin/verifications/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    const pool = db as mysql.Pool;
    const id = Number(req.params.id);
    const { statut, note_admin } = req.body as { statut: string; note_admin?: string };

    if (!["verifie", "rejete"].includes(statut)) {
      return res.status(400).json({ error: "Statut invalide." });
    }

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT user_id FROM account_verifications WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Vérification introuvable." });
    const userId = rows[0].user_id as number;

    await pool.execute(
      "UPDATE account_verifications SET statut = ?, note_admin = ? WHERE id = ?",
      [statut, note_admin ?? null, id]
    );
    await pool.execute(
      "UPDATE client_users SET verifie = ? WHERE id = ?",
      [statut === "verifie" ? 1 : 0, userId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("[admin/verifications PATCH]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
