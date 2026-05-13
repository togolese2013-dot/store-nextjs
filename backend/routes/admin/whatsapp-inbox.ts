import express from "express";
import mysql from "mysql2/promise";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import { sendWaText } from "../../lib/whatsapp";
import { emitAdminEvent } from "../../lib/admin-events";

const router = express.Router();

/* ── GET /api/admin/whatsapp/threads ──────────────────────────────────── */
router.get("/api/admin/whatsapp/threads", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  try {
    // Get last message per conversation + unread count
    const [rows] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT
        m.telephone,
        m.contact_name,
        m.body          AS dernier_message,
        m.direction     AS dernier_direction,
        m.created_at    AS last_at,
        t.total_messages,
        t.unread
      FROM wa_messages m
      INNER JOIN (
        SELECT
          telephone,
          MAX(id)                                                       AS last_id,
          COUNT(*)                                                      AS total_messages,
          SUM(CASE WHEN direction = 'inbound' AND lu = 0 THEN 1 ELSE 0 END) AS unread
        FROM wa_messages
        GROUP BY telephone
      ) t ON t.telephone = m.telephone AND t.last_id = m.id
      ORDER BY last_at DESC
      LIMIT 200
    `);
    res.json({ threads: rows });
  } catch (err) {
    console.error("[whatsapp/threads]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ── GET /api/admin/whatsapp/threads/:phone ───────────────────────────── */
router.get("/api/admin/whatsapp/threads/:phone", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  const { phone } = req.params;
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, direction, body, sent_by, contact_name, lu, created_at
       FROM wa_messages
       WHERE telephone = ?
       ORDER BY created_at ASC
       LIMIT 500`,
      [phone],
    );
    res.json({ messages: rows });

    // Mark inbound messages as read
    await db.execute(
      "UPDATE wa_messages SET lu = 1 WHERE telephone = ? AND direction = 'inbound' AND lu = 0",
      [phone],
    ).catch(() => {});
  } catch (err) {
    console.error("[whatsapp/thread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ── POST /api/admin/whatsapp/threads/:phone/send ─────────────────────── */
router.post("/api/admin/whatsapp/threads/:phone/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  const { phone }    = req.params;
  const { body }     = req.body as { body?: string };
  if (!body?.trim()) return res.status(400).json({ error: "Message vide" });

  const result = await sendWaText({ to: phone, body: body.trim() });
  if (!result.success) {
    return res.status(502).json({ error: result.error ?? "Erreur envoi WA" });
  }

  try {
    await db.execute(
      `INSERT INTO wa_messages (telephone, direction, body, sent_by)
       VALUES (?, 'outbound', ?, ?)`,
      [phone, body.trim(), session.nom ?? session.username ?? "admin"],
    );
    emitAdminEvent("message", { type_action: "sent", to: phone });
  } catch (err) {
    console.error("[whatsapp/send insert]", err);
  }

  res.json({ ok: true });
});

/* ── DELETE /api/admin/whatsapp/threads/:phone ────────────────────────── */
router.delete("/api/admin/whatsapp/threads/:phone", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  const { phone } = req.params;
  try {
    await db.execute("DELETE FROM wa_messages WHERE telephone = ?", [phone]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[whatsapp/delete thread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
