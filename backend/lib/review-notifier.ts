/**
 * review-notifier.ts
 * Runs hourly: sends a WhatsApp review request 48h after order delivery.
 * Adds columns delivered_at + review_wa_sent to orders if missing.
 */

import { db } from "@/lib/db";
import { sendWaText } from "./whatsapp";
import type mysql from "mysql2/promise";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togolese.tg";
const DELAY_HOURS = 48;

// ─── Migration ────────────────────────────────────────────────────────────────

export async function ensureReviewNotifierCols(): Promise<void> {
  for (const ddl of [
    "ALTER TABLE orders ADD COLUMN delivered_at   TIMESTAMP NULL    AFTER status",
    "ALTER TABLE orders ADD COLUMN review_wa_sent TINYINT(1) NOT NULL DEFAULT 0",
  ]) {
    try {
      await db.execute(ddl);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code !== "ER_DUP_FIELDNAME") {
        console.warn("[review-notifier] migration warn:", (e as Error).message);
      }
    }
  }
  console.log("[review-notifier] columns OK");
}

// ─── Main job ─────────────────────────────────────────────────────────────────

export async function runReviewNotifier(): Promise<void> {
  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, client_tel, items
       FROM orders
       WHERE status = 'delivered'
         AND delivered_at IS NOT NULL
         AND delivered_at <= NOW() - INTERVAL ${DELAY_HOURS} HOUR
         AND review_wa_sent = 0
         AND client_tel IS NOT NULL
         AND client_tel != ''
       LIMIT 50`
    );

    if (rows.length === 0) return;
    console.log(`[review-notifier] ${rows.length} order(s) to notify`);

    for (const row of rows) {
      const nom       = String(row.nom || "Client");
      const ref       = String(row.reference);
      const tel       = String(row.client_tel);
      const trackUrl  = `${SITE_URL}/suivi-commande?ref=${encodeURIComponent(ref)}`;

      // Parse items to get first product slug for a direct review link
      let reviewUrl = trackUrl;
      try {
        const items = typeof row.items === "string" ? JSON.parse(row.items) : row.items;
        if (Array.isArray(items) && items.length > 0) {
          const firstSlug = items[0].slug ?? items[0].reference;
          if (firstSlug) reviewUrl = `${SITE_URL}/products/${firstSlug}#reviews`;
        }
      } catch {
        // keep trackUrl as fallback
      }

      const body =
        `👋 Bonjour ${nom} !\n\n` +
        `Votre commande *${ref}* a bien été livrée. Nous espérons qu'elle vous a plu ! 😊\n\n` +
        `⭐ Donnez votre avis sur votre achat :\n${reviewUrl}\n\n` +
        `Merci pour votre confiance — Togolese Shop 🛍️`;

      try {
        await sendWaText({ to: tel, body });
        await db.execute(
          "UPDATE orders SET review_wa_sent = 1 WHERE id = ?",
          [row.id]
        );
        console.log(`[review-notifier] sent to ${tel} for ${ref}`);
      } catch (e) {
        console.error(`[review-notifier] failed for ${ref}:`, (e as Error).message);
        // Don't mark as sent — will retry next hour
      }
    }
  } catch (e) {
    console.error("[review-notifier] job error:", (e as Error).message);
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export function startReviewNotifier(): void {
  const INTERVAL_MS = 60 * 60 * 1000; // every hour

  ensureReviewNotifierCols()
    .then(() => {
      // Run once at startup (catches any missed during downtime)
      runReviewNotifier();
      // Then every hour
      setInterval(runReviewNotifier, INTERVAL_MS);
      console.log("[review-notifier] scheduler started (interval: 1h)");
    })
    .catch(e => console.error("[review-notifier] startup error:", e));
}
