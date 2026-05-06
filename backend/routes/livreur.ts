import express from "express";
import { getSession } from "../lib/auth";
import { getUtilisateurById, addOrderEvent, createFinanceEntry } from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

async function requireLivreur(req: express.Request, res: express.Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Non autorisé." }); return null; }

  // Livreur from utilisateurs (role staff + poste Livreur)
  if (session.role === "staff") {
    const member = await getUtilisateurById(Number(session.id));
    if (!member || member.poste !== "Livreur") {
      res.status(403).json({ error: "Accès réservé aux livreurs." });
      return null;
    }
    return { session, member: { id: member.id, nom: member.nom } };
  }

  // Livreur from admin_users (role livreur)
  if (session.role === "livreur") {
    const { getAdminById } = await import("@/lib/admin-db");
    const admin = await getAdminById(Number(session.id));
    if (!admin || admin.poste !== "Livreur") {
      res.status(403).json({ error: "Accès réservé aux livreurs." });
      return null;
    }
    return { session, member: { id: admin.id, nom: admin.nom } };
  }

  res.status(403).json({ error: "Accès réservé aux livreurs." });
  return null;
}

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/api/livreur/profile", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  try {
    const member = await getUtilisateurById(ctx.member.id);
    if (member) {
      res.json({ nom: member.nom, telephone: member.telephone, numero_plaque: member.numero_plaque, poste: member.poste });
    } else {
      const { getAdminById } = await import("@/lib/admin-db");
      const admin = await getAdminById(ctx.member.id);
      res.json({ nom: admin?.nom ?? ctx.member.nom, telephone: admin?.telephone ?? null, numero_plaque: null, poste: "Livreur" });
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get("/api/livreur/stats", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool = db as mysql.Pool;
  const id   = ctx.member.id;
  try {
    // Count delivered: orders + livraisons_ventes
    const [[todayOrders]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND DATE(updated_at) = CURDATE()`, [id]
    );
    const [[todayLiv]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre' AND DATE(livree_le) = CURDATE()`, [id]
    );
    const [[weekOrders]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]
    );
    const [[weekLiv]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre' AND livree_le >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]
    );
    const [[totalOrders]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre'`, [id]
    );
    const [[totalLiv]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'livre'`, [id]
    );
    const [[enCoursOrders]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ? AND livraison_statut = 'en_cours'`, [id]
    );
    const [[enCoursLiv]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ? AND statut = 'acceptee'`, [id]
    );
    const [[totalAssignedOrders]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM orders WHERE livreur_id = ?`, [id]
    );
    const [[totalAssignedLiv]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM livraisons_ventes WHERE livreur_id = ?`, [id]
    );

    // Gains today (delivery_fee from orders)
    const [[gainTodayRow]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND DATE(updated_at) = CURDATE()`, [id]
    );
    const [[gainWeekRow]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`, [id]
    );
    const [[gainTotalRow]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(SUM(delivery_fee),0) AS gain FROM orders WHERE livreur_id = ? AND livraison_statut = 'livre'`, [id]
    );

    const today   = Number(todayOrders?.cnt   ?? 0) + Number(todayLiv?.cnt   ?? 0);
    const week    = Number(weekOrders?.cnt    ?? 0) + Number(weekLiv?.cnt    ?? 0);
    const total   = Number(totalOrders?.cnt   ?? 0) + Number(totalLiv?.cnt   ?? 0);
    const enCours = Number(enCoursOrders?.cnt ?? 0) + Number(enCoursLiv?.cnt ?? 0);
    const assigned = Number(totalAssignedOrders?.cnt ?? 0) + Number(totalAssignedLiv?.cnt ?? 0);
    const tauxReussite = assigned > 0 ? Math.round((total / assigned) * 100) : 0;

    res.json({
      today, week, total, enCours, tauxReussite,
      gainToday: Number(gainTodayRow?.gain ?? 0),
      gainWeek:  Number(gainWeekRow?.gain  ?? 0),
      gainTotal: Number(gainTotalRow?.gain  ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Commandes disponibles (orders + livraisons_ventes) ────────────────────────
router.get("/api/livreur/orders/available", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool = db as mysql.Pool;
  try {
    const [orderRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, lien_localisation, 'order' AS source
       FROM orders
       WHERE status = 'confirmed' AND livreur_id IS NULL
       ORDER BY created_at ASC`
    );
    const [livRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.lien_localisation, 'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.statut = 'en_attente' AND lv.livreur_id IS NULL
       ORDER BY lv.created_at ASC`
    );
    const data = [...orderRows, ...livRows].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    res.json({ success: true, data });
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
    const [orderRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, lien_localisation, 'order' AS source
       FROM orders
       WHERE livreur_id = ? AND livraison_statut = 'en_cours'
       ORDER BY created_at ASC`,
      [ctx.member.id]
    );
    const [livRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.lien_localisation, 'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.livreur_id = ? AND lv.statut = 'acceptee'
       ORDER BY lv.created_at ASC`,
      [ctx.member.id]
    );
    const data = [...orderRows, ...livRows].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    res.json({ success: true, data });
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
    const [orderRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee, total,
              created_at, livraison_statut, livraison_note, 'order' AS source
       FROM orders
       WHERE livreur_id = ? AND livraison_statut IN ('livre', 'echec')
       ORDER BY created_at DESC LIMIT ?`,
      [ctx.member.id, limit]
    );
    const [livRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT lv.id, lv.reference, lv.client_nom AS nom, lv.client_tel AS telephone,
              lv.adresse, '' AS zone_livraison, 0 AS delivery_fee,
              COALESCE(f.total, 0) AS total,
              lv.created_at, lv.statut AS livraison_statut, lv.note AS livraison_note,
              'livraison' AS source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.livreur_id = ? AND lv.statut IN ('livre', 'echoue')
       ORDER BY lv.created_at DESC LIMIT ?`,
      [ctx.member.id, limit]
    );
    const data = [...orderRows, ...livRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Accepter une livraison ────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/accept", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool    = db as mysql.Pool;
  const entityId = Number(req.params.id);
  const src      = req.query.src as string;

  try {
    if (src === "livraison") {
      const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, statut, livreur_id FROM livraisons_ventes WHERE id = ? LIMIT 1", [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (row.statut !== "en_attente" || row.livreur_id != null) {
        return res.status(409).json({ error: "Cette livraison n'est plus disponible." });
      }
      await pool.execute(
        "UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ? WHERE id = ?",
        [ctx.member.id, ctx.member.nom, entityId]
      );
    } else {
      const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, status, livreur_id FROM orders WHERE id = ? LIMIT 1", [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (order.status !== "confirmed" || order.livreur_id != null) {
        return res.status(409).json({ error: "Cette livraison n'est plus disponible." });
      }
      await pool.execute(
        "UPDATE orders SET livreur_id = ?, livraison_statut = 'en_cours', status = 'shipped' WHERE id = ?",
        [ctx.member.id, entityId]
      );
      await addOrderEvent(entityId, "shipped", `Pris en charge par ${ctx.member.nom}`, ctx.member.nom);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Confirmer la livraison ────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/deliver", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool     = db as mysql.Pool;
  const entityId = Number(req.params.id);
  const src      = req.query.src as string;

  try {
    if (src === "livraison") {
      const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT lv.id, lv.livreur_id, lv.facture_id, f.total, f.mode_paiement, f.statut_paiement FROM livraisons_ventes lv LEFT JOIN factures f ON f.id = lv.facture_id WHERE lv.id = ? LIMIT 1",
        [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (Number(row.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
      }
      await pool.execute(
        "UPDATE livraisons_ventes SET statut = 'livre', livree_le = NOW() WHERE id = ?",
        [entityId]
      );
      // Mark facture as paid then record in caisse — non-blocking to not fail the delivery
      if (row.facture_id && row.statut_paiement !== "paye_total") {
        try {
          await pool.execute(
            `UPDATE factures SET statut = 'paye', statut_paiement = 'paye_total'
             WHERE id = ? AND statut != 'annule'`,
            [row.facture_id]
          );
          const montant = Number(row.total ?? 0);
          if (montant > 0) {
            await createFinanceEntry({
              type:          "vente",
              montant,
              mode_paiement: row.mode_paiement || "especes",
              description:   `Livraison confirmée — facture #${row.facture_id}`,
              date_entree:   new Date().toISOString().slice(0, 10),
            });
          }
        } catch (e) {
          console.error("[livreur] finance entry failed:", e);
        }
      }
    } else {
      const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1", [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (Number(order.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
      }
      await pool.execute(
        "UPDATE orders SET livraison_statut = 'livre', status = 'delivered', updated_at = NOW() WHERE id = ?",
        [entityId]
      );
      await addOrderEvent(entityId, "delivered", `Livré par ${ctx.member.nom}`, ctx.member.nom);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Colis non livré ───────────────────────────────────────────────────────────
router.patch("/api/livreur/orders/:id/fail", async (req, res) => {
  const ctx = await requireLivreur(req, res);
  if (!ctx) return;
  const pool     = db as mysql.Pool;
  const entityId = Number(req.params.id);
  const src      = req.query.src as string;
  const note     = String(req.body.note ?? "").trim() || "Tentative de livraison échouée";

  try {
    if (src === "livraison") {
      const [[row]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, livreur_id FROM livraisons_ventes WHERE id = ? LIMIT 1", [entityId]
      );
      if (!row) return res.status(404).json({ error: "Livraison introuvable." });
      if (Number(row.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
      }
      // Return to en_attente so another livreur can take it
      await pool.execute(
        "UPDATE livraisons_ventes SET statut = 'en_attente', livreur_id = NULL, livreur = NULL, note = ? WHERE id = ?",
        [note, entityId]
      );
    } else {
      const [[order]] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, livreur_id FROM orders WHERE id = ? LIMIT 1", [entityId]
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      if (Number(order.livreur_id) !== ctx.member.id) {
        return res.status(403).json({ error: "Cette livraison ne vous est pas assignée." });
      }
      await pool.execute(
        "UPDATE orders SET livraison_statut = 'echec', livraison_note = ?, status = 'confirmed', livreur_id = NULL WHERE id = ?",
        [note, entityId]
      );
      await addOrderEvent(entityId, "confirmed", `Tentative échouée par ${ctx.member.nom} — ${note}`, ctx.member.nom);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
