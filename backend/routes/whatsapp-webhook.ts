import express from "express";
import { db } from "@/lib/db";
import { emitAdminEvent } from "../lib/admin-events";

const router = express.Router();

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN ?? "togolese_webhook";

export async function ensureWaMessagesTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wa_messages (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        telephone     VARCHAR(30)  NOT NULL,
        direction     ENUM('inbound','outbound') NOT NULL,
        body          TEXT         NOT NULL,
        wa_message_id VARCHAR(100) NULL,
        contact_name  VARCHAR(100) NULL,
        lu            TINYINT(1)   NOT NULL DEFAULT 0,
        sent_by       VARCHAR(100) NULL,
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_telephone  (telephone),
        INDEX idx_created_at (created_at)
      )
    `);
  } catch (err) {
    console.error("[ensureWaMessagesTable]", err);
  }
}

/* ── Vérification webhook Meta ─────────────────────────────────────────── */
router.get("/api/webhooks/whatsapp", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});

/* ── Réception messages entrants ───────────────────────────────────────── */
router.post("/api/webhooks/whatsapp", async (req, res) => {
  res.sendStatus(200); // acknowledge immediately — Meta retries if not 200 fast

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.length) return;

    const contactName: string | null =
      value.contacts?.[0]?.profile?.name ?? null;

    for (const msg of value.messages as Record<string, unknown>[]) {
      if (msg.type !== "text") continue;
      const from  = String(msg.from ?? "");
      const body  = String((msg.text as Record<string, unknown>)?.body ?? "");
      const waId  = String(msg.id ?? "");
      if (!from || !body) continue;

      await db.execute(
        `INSERT INTO wa_messages (telephone, direction, body, wa_message_id, contact_name)
         VALUES (?, 'inbound', ?, ?, ?)`,
        [from, body, waId, contactName],
      );

      emitAdminEvent("message", {
        from,
        body,
        nom: contactName ?? from,
      });
    }
  } catch (err) {
    console.error("[webhook/whatsapp]", err);
  }
});

export default router;
