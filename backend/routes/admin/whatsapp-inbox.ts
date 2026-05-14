import express from "express";
import mysql from "mysql2/promise";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/admin-db";
import { sendWaText, sendWaImage, sendWaAudio, uploadWaMedia } from "../../lib/whatsapp";
import { emitAdminEvent } from "../../lib/admin-events";

const router = express.Router();

const WA_GRAPH = "https://graph.facebook.com/v18.0";

/* ── Migration colonnes media ─────────────────────────────────────────── */
export async function ensureWaMessagesCols() {
  const alters = [
    "ALTER TABLE wa_messages ADD COLUMN media_id    VARCHAR(100) NULL",
    "ALTER TABLE wa_messages ADD COLUMN media_type  VARCHAR(30)  NOT NULL DEFAULT 'text'",
    "ALTER TABLE wa_messages ADD COLUMN mime_type   VARCHAR(100) NULL",
    "ALTER TABLE wa_messages ADD COLUMN notre_numero VARCHAR(30) NULL",
  ];
  for (const sql of alters) {
    try { await db.execute(sql); } catch { /* already exists */ }
  }
}

/* ── GET /api/admin/whatsapp/webhook — vérification Meta ──────────────── */
router.get("/api/admin/whatsapp/webhook", async (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const savedToken = await getSetting("wa_webhook_verify_token").catch(() => null);
  const expected   = savedToken || process.env.WA_VERIFY_TOKEN || "";
  if (mode === "subscribe" && token === expected && expected) {
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});

/* ── POST /api/admin/whatsapp/webhook — réception messages entrants ───── */
router.post("/api/admin/whatsapp/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return;
    const contactName: string | null = value.contacts?.[0]?.profile?.name ?? null;
    const notreNumero: string | null = (value.metadata as Record<string,unknown>)?.display_phone_number
      ? String((value.metadata as Record<string,unknown>).display_phone_number)
      : null;

    for (const msg of value.messages as Record<string, unknown>[]) {
      const from  = String(msg.from ?? "");
      const waId  = String(msg.id   ?? "");
      const type  = String(msg.type ?? "text");
      if (!from) continue;

      let body     = "";
      let mediaId: string | null = null;
      let mimeType: string | null = null;

      if (type === "text") {
        body = String((msg.text as Record<string, unknown>)?.body ?? "");
        if (!body) continue;
      } else if (type === "image") {
        const img = msg.image as Record<string, unknown>;
        body     = String(img?.caption ?? "[Image]");
        mediaId  = String(img?.id      ?? "");
        mimeType = String(img?.mime_type ?? "image/jpeg");
      } else if (type === "audio") {
        const aud = msg.audio as Record<string, unknown>;
        body     = "[Message vocal]";
        mediaId  = String(aud?.id       ?? "");
        mimeType = String(aud?.mime_type ?? "audio/ogg");
      } else if (type === "document") {
        const doc = msg.document as Record<string, unknown>;
        body     = String(doc?.filename ?? "[Document]");
        mediaId  = String(doc?.id       ?? "");
        mimeType = String(doc?.mime_type ?? "application/octet-stream");
      } else {
        continue;
      }

      await db.execute(
        `INSERT IGNORE INTO wa_messages
           (telephone, direction, body, wa_message_id, contact_name, media_id, media_type, mime_type, notre_numero)
         VALUES (?, 'inbound', ?, ?, ?, ?, ?, ?, ?)`,
        [from, body, waId, contactName, mediaId || null, type, mimeType || null, notreNumero],
      );
      emitAdminEvent("message", { from, body, nom: contactName ?? from });
    }
  } catch (err) {
    console.error("[webhook/whatsapp/inbound]", err);
  }
});

/* ── GET /api/admin/whatsapp/threads ──────────────────────────────────── */
router.get("/api/admin/whatsapp/threads", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT
        m.telephone,
        m.contact_name,
        m.body           AS dernier_message,
        m.direction      AS dernier_direction,
        m.media_type     AS dernier_type,
        m.created_at     AS last_at,
        m.notre_numero,
        t.total_messages,
        t.unread
      FROM wa_messages m
      INNER JOIN (
        SELECT
          telephone,
          MAX(id)                                                            AS last_id,
          COUNT(*)                                                           AS total_messages,
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
      `SELECT id, direction, body, sent_by, contact_name, lu, media_id, media_type, mime_type, created_at
       FROM wa_messages
       WHERE telephone = ?
       ORDER BY created_at ASC
       LIMIT 500`,
      [phone],
    );
    res.json({ messages: rows });
    await db.execute(
      "UPDATE wa_messages SET lu = 1 WHERE telephone = ? AND direction = 'inbound' AND lu = 0",
      [phone],
    ).catch(() => {});
  } catch (err) {
    console.error("[whatsapp/thread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ── GET /api/admin/whatsapp/media/:mediaId — proxy Meta ─────────────── */
router.get("/api/admin/whatsapp/media/:mediaId", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end();
  try {
    const token = await getSetting("wa_access_token");
    if (!token) return res.status(503).end();

    // 1. Obtenir l'URL de téléchargement
    const infoRes = await fetch(`${WA_GRAPH}/${req.params.mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!infoRes.ok) return res.status(404).end();
    const { url } = await infoRes.json() as { url?: string };
    if (!url) return res.status(404).end();

    // 2. Streamer le contenu au client
    const mediaRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!mediaRes.ok) return res.status(404).end();

    const ct = mediaRes.headers.get("content-type") ?? "application/octet-stream";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "private, max-age=3600");
    const buf = await mediaRes.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error("[whatsapp/media]", err);
    res.status(500).end();
  }
});

/* ── POST /api/admin/whatsapp/threads/:phone/send ─────────────────────── */
router.post("/api/admin/whatsapp/threads/:phone/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  const { phone } = req.params;
  const { body }  = req.body as { body?: string };
  if (!body?.trim()) return res.status(400).json({ error: "Message vide" });

  const result = await sendWaText({ to: phone, body: body.trim() });
  if (!result.success) return res.status(502).json({ error: result.error });

  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_type)
     VALUES (?, 'outbound', ?, ?, 'text')`,
    [phone, body.trim(), session.nom ?? session.username ?? "admin"],
  ).catch(() => {});
  emitAdminEvent("message", { type_action: "sent", to: phone });
  res.json({ ok: true });
});

/* ── POST /api/admin/whatsapp/threads/:phone/send-image ───────────────── */
router.post("/api/admin/whatsapp/threads/:phone/send-image", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  const { phone } = req.params;

  // Raw buffer — client envoie Content-Type: image/*
  const chunks: Buffer[] = [];
  req.on("data", (c: Buffer) => chunks.push(c));
  await new Promise(r => req.on("end", r));
  const buffer   = Buffer.concat(chunks);
  const mimeType = (req.headers["content-type"] ?? "image/jpeg").split(";")[0];
  const caption  = String(req.headers["x-caption"] ?? "");

  if (buffer.length === 0) return res.status(400).json({ error: "Fichier vide" });
  if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ error: "Image > 5 Mo" });

  const up = await uploadWaMedia(buffer, mimeType, `image.${mimeType.split("/")[1] ?? "jpg"}`);
  if (!up.success || !up.mediaId) return res.status(502).json({ error: up.error });

  const send = await sendWaImage({ to: phone, mediaId: up.mediaId, caption });
  if (!send.success) return res.status(502).json({ error: send.error });

  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_id, media_type, mime_type)
     VALUES (?, 'outbound', ?, ?, ?, 'image', ?)`,
    [phone, caption || "[Image]", session.nom ?? "admin", up.mediaId, mimeType],
  ).catch(() => {});
  res.json({ ok: true });
});

/* ── POST /api/admin/whatsapp/threads/:phone/send-audio ───────────────── */
router.post("/api/admin/whatsapp/threads/:phone/send-audio", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé" });
  const { phone } = req.params;

  const chunks: Buffer[] = [];
  req.on("data", (c: Buffer) => chunks.push(c));
  await new Promise(r => req.on("end", r));
  const buffer   = Buffer.concat(chunks);
  const mimeType = (req.headers["content-type"] ?? "audio/ogg").split(";")[0];

  if (buffer.length === 0) return res.status(400).json({ error: "Audio vide" });
  if (buffer.length > 16 * 1024 * 1024) return res.status(413).json({ error: "Audio > 16 Mo" });

  const up = await uploadWaMedia(buffer, mimeType, `voice.${mimeType.split("/")[1] ?? "ogg"}`);
  if (!up.success || !up.mediaId) return res.status(502).json({ error: up.error });

  const send = await sendWaAudio({ to: phone, mediaId: up.mediaId });
  if (!send.success) return res.status(502).json({ error: send.error });

  await db.execute(
    `INSERT INTO wa_messages (telephone, direction, body, sent_by, media_id, media_type, mime_type)
     VALUES (?, 'outbound', '[Message vocal]', ?, ?, 'audio', ?)`,
    [phone, session.nom ?? "admin", up.mediaId, mimeType],
  ).catch(() => {});
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
