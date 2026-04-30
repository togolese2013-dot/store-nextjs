import express from "express";
import { getSession } from "../../lib/auth";
import { getSetting, saveIncomingMessage, listWaMessages } from "@/lib/admin-db";
import { sendWaText } from "../../lib/whatsapp";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();
const pool   = db as import("mysql2/promise").Pool;

/* ── Migration — créée au démarrage du backend ───────────────────────────── */
export async function ensureWhatsappMessagesTable() {
  // Create table with minimal required columns if it doesn't exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      from_number   VARCHAR(30)  NOT NULL,
      content       TEXT         NOT NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Add missing columns individually (safe to run on existing table)
  // NOTE: old table had 'body' instead of 'content', and 'wa_id' instead of 'wa_message_id'
  const alterations: [string, string][] = [
    ["wa_message_id", "ALTER TABLE whatsapp_messages ADD COLUMN wa_message_id VARCHAR(255) NOT NULL DEFAULT ''"],
    ["to_number",     "ALTER TABLE whatsapp_messages ADD COLUMN to_number VARCHAR(30) NOT NULL DEFAULT ''"],
    ["contact_name",  "ALTER TABLE whatsapp_messages ADD COLUMN contact_name VARCHAR(100) NOT NULL DEFAULT ''"],
    ["direction",     "ALTER TABLE whatsapp_messages ADD COLUMN direction ENUM('in','out') NOT NULL DEFAULT 'in'"],
    ["type",          "ALTER TABLE whatsapp_messages ADD COLUMN type VARCHAR(30) NOT NULL DEFAULT 'text'"],
    ["content",       "ALTER TABLE whatsapp_messages ADD COLUMN content TEXT NOT NULL DEFAULT ''"],
    ["media_url",     "ALTER TABLE whatsapp_messages ADD COLUMN media_url VARCHAR(500) NULL"],
    ["status",        "ALTER TABLE whatsapp_messages ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'received'"],
    ["read_at",       "ALTER TABLE whatsapp_messages ADD COLUMN read_at DATETIME NULL"],
  ];

  const [cols] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_messages'"
  );
  const existing = new Set((cols as any[]).map((c: any) => c.COLUMN_NAME));

  for (const [col, sql] of alterations) {
    if (!existing.has(col)) {
      await pool.execute(sql).catch((e: any) => console.warn(`[WA migration] ${col}:`, e.message));
    }
  }

  // Add unique index on wa_message_id if not present
  const [idxRows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_messages' AND INDEX_NAME = 'uq_wa_msg'"
  );
  if (!(idxRows as any[]).length) {
    await pool.execute(
      "ALTER TABLE whatsapp_messages ADD UNIQUE KEY uq_wa_msg (wa_message_id(191))"
    ).catch((e: any) => console.warn("[WA migration] uq_wa_msg:", e.message));
  }
}

/* ── GET /api/admin/whatsapp/ping — table diagnostic + force migration ───── */
router.get("/api/admin/whatsapp/ping", async (_req, res) => {
  try {
    // Force migration on every ping call (idempotent)
    await ensureWhatsappMessagesTable();

    const [cols] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_messages'"
    );
    const columns = (cols as any[]).map((c: any) => c.COLUMN_NAME);
    const [rows]  = await pool.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) as total FROM whatsapp_messages");
    const [last]  = await pool.execute<mysql.RowDataPacket[]>("SELECT * FROM whatsapp_messages ORDER BY id DESC LIMIT 3");
    return res.json({ ok: true, columns, total: (rows as any)[0].total, last });
  } catch (e: any) {
    return res.json({ ok: false, error: e.message });
  }
});

/* ── GET /api/admin/whatsapp/webhook — Meta verification ─────────────────── */
router.get("/api/admin/whatsapp/webhook", async (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = await getSetting("wa_webhook_verify_token").catch(() => null);

  if (mode === "subscribe" && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Vérification échouée" });
});

/* ── POST /api/admin/whatsapp/webhook — receive incoming messages ─────────── */
router.post("/api/admin/whatsapp/webhook", async (req, res) => {
  res.status(200).json({ status: "ok" }); // always 200 to Meta

  try {
    const entry   = req.body?.entry?.[0];
    const value   = entry?.changes?.[0]?.value;
    if (!value?.messages) return;

    const phoneNumberId = value.metadata?.phone_number_id ?? "";

    for (const msg of value.messages as any[]) {
      const from    = String(msg.from ?? "");
      const waId    = String(msg.id   ?? `in_${Date.now()}`);
      const type    = String(msg.type ?? "text");
      const contact = (value.contacts as any[])?.find((c: any) => c.wa_id === from);
      const name    = contact?.profile?.name ?? from;

      let content = "";
      if      (type === "text")     content = msg.text?.body ?? "";
      else if (type === "image")    content = msg.image?.caption   ?? "[Image]";
      else if (type === "video")    content = msg.video?.caption   ?? "[Vidéo]";
      else if (type === "audio")    content = "[Audio]";
      else if (type === "document") content = msg.document?.filename ?? "[Document]";
      else                          content = `[${type}]`;

      await saveIncomingMessage({
        wa_message_id: waId,
        from_number:   from,
        to_number:     phoneNumberId,
        contact_name:  name,
        direction:     "in",
        type,
        content,
        media_url:     msg.image?.id ?? msg.video?.id ?? msg.audio?.id ?? "",
        status:        "received",
      }).catch(console.error);
    }
  } catch (e) {
    console.error("[WA webhook]", e);
  }
});

/* ── GET /api/admin/whatsapp/messages — list messages (polling + diagnostic) ─ */
router.get("/api/admin/whatsapp/messages", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const messages = await listWaMessages(200);
    return res.json({ messages });
  } catch (e) {
    console.error("[WA messages GET]", e);
    return res.status(500).json({ error: "Erreur base de données" });
  }
});

/* ── POST /api/admin/whatsapp/send — manual send (broadcast + replies) ────── */
router.post("/api/admin/whatsapp/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const { to, message, numbers } = req.body;

  // Broadcast mode
  if (Array.isArray(numbers) && numbers.length > 0) {
    if (!message) return res.status(400).json({ error: "message requis" });

    const results = await Promise.allSettled(
      numbers.map((num: string) => sendWaText({ to: num, body: message }))
    );

    const succeeded = results.filter(r => r.status === "fulfilled" && (r as any).value?.success).length;
    const failed    = results.length - succeeded;

    return res.json({ success: true, succeeded, failed, total: numbers.length });
  }

  // Single message
  if (!to || !message) {
    return res.status(400).json({ error: "to et message requis" });
  }

  const result = await sendWaText({ to, body: message });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Save outgoing message for history
  const myPhoneId = await getSetting("wa_phone_number_id").catch(() => "");
  await saveIncomingMessage({
    wa_message_id: `out_${Date.now()}_${to.replace(/\D/g, "")}`,
    from_number:   myPhoneId,
    to_number:     to.replace(/[\s+\-()]/g, ""),
    contact_name:  to,
    direction:     "out",
    type:          "text",
    content:       message,
    status:        "sent",
  }).catch(console.error);

  return res.json({ success: true });
});

export default router;
