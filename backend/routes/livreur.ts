import express from "express";
import { getSession } from "../lib/auth";
import { getUtilisateurById, addOrderEvent } from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

async function requireLivreur(req: express.Request, res: express.Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Non autorisé." }); return null; }
  const member = await getUtilisateurById(Number(session.id));
  if (!member || member.poste !== "Livreur") {
    res.status(403).json({ error: "Accès réservé aux livreurs." });
    return null;
  }
  return { session, member };
}

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get("/api/livreur/stats", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool = db as mysql.Pool;
  const id   = ctx.member.id;
  try {
    const [[today]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND DATE(created_at) = CURDATE()`, [id]
    );
    const [[week]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]
    );
    const [[total]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre'`, [id]
    );
    const [[enCours]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'en_cours'`, [id]
    );
    const [[totalAssigned]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ?`, [id]
    );
    const tauxReussite = Number(totalAssigned[0]?.cnt) > 0
      ? Math.round((Number(total[0]?.cnt) / Number(totalAssigned[0]?.cnt)) * 100)
      : 0;
    res.json({
      today:        Number(today[0]?.cnt    ?? 0),
      week:         Number(week[0]?.cnt     ?? 0),
      total:        Number(total[0]?.cnt    ?? 0),
      enCours:      Number(enCours[0]?.cnt  ?? 0),
      tauxReussite,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Commandes disponibles ─────────────────────────────────────────────────────
router.get("/api/livreur/orders/available", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool = db as mysql.Pool;
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total, created_at, lien_localisation
       FROM orders
       WHERE status = 'confirmed' AND livreur_id IS NULL
       ORDER BY created_at ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Mes livraisons en cours ───────────────────────────────────────────────────
router.get("/api/livreur/orders/mine", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool = db as mysql.Pool;
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total, created_at, lien_localisation
       FROM orders
       WHERE livreur_id = ? AND livraison_statut = 'en_cours'
       ORDER BY created_at ASC`,
      [ctx.member.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Historique ────────────────────────────────────────────────────────────────
router.get("/api/livreur/orders/history", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool  = db as mysql.Pool;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, livraison_statut, livraison_note
       FROM orders
       WHERE livreur_id = ? AND livraison_statut IN ('livre', 'echec')
       ORDER BY created_at DESC
       LIMIT ?`,
      [ctx.member.id, limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Accepter une livraison ────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/accept", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool    = db as mysql.Pool;
  const orderId = Number(req.params.id);
  try {
    const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, status, livreur_id FROM orders WHERE id = ? LIMIT 1", [orderId]
    );
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (order.status !== "confirmed" || order.livreur_id != null) {
      return res.status(409).json({ error: "Cette livraison n'est plus disponible." });
    }
    await pool.execute(
      "UPDATE orders SET livreur_id = ?, livraison_statut = 'en_cours', status = 'shipped' WHERE id = ?",
      [ctx.member.id, orderId]
    );
    await addOrderEvent(orderId, "shipped", `Pris en charge par ${ctx.member.nom}`, ctx.member.nom);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Confirmer la livraison ────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/deliver", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool    = db as mysql.Pool;
  const orderId = Number(req.params.id);
  try {
    const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1", [orderId]
    );
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (Number(order.livreur_id) !== ctx.member.id) {
      return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
    }
    await pool.execute(
      "UPDATE orders SET livraison_statut = 'livre', status = 'delivered' WHERE id = ?",
      [orderId]
    );
    await addOrderEvent(orderId, "delivered", `Livré par ${ctx.member.nom}`, ctx.member.nom);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Colis non livré ───────────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/fail", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool    = db as mysql.Pool;
  const orderId = Number(req.params.id);
  const note    = String(req.body.note ?? "").trim() || "Tentative de livraison échouée";
  try {
    const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1", [orderId]
    );
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (Number(order.livreur_id) !== ctx.member.id) {
      return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
    }
    await pool.execute(
      "UPDATE orders SET livraison_statut = 'echec', livraison_note = ?, status = 'confirmed', livreur_id = NULL WHERE id = ?",
      [note, orderId]
    );
    await addOrderEvent(orderId, "confirmed", `Tentative échouée par ${ctx.member.nom} — ${note}`, ctx.member.nom);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
