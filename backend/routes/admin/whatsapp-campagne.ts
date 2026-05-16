import express from "express";
import { getSession } from "../../lib/auth";
import { db as pool } from "@/lib/db";
import { sendWaText, sendWaImage, uploadWaMedia } from "../../lib/whatsapp";

const router = express.Router();

// Ensure full international format for Togo numbers (228XXXXXXXX)
function formatTgPhone(num: string): string {
  const digits = num.replace(/[\s+\-()]/g, "");
  if (digits.startsWith("228")) return digits;
  if (digits.startsWith("0")) return `228${digits.slice(1)}`;
  return `228${digits}`;
}

// Preview — count recipients
router.get("/api/admin/whatsapp-campagne/preview", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const clientIds = (req.query.ids as string) ?? "";

  try {
    let count = 0;
    if (clientIds) {
      const ids = clientIds.split(",").map(Number).filter(Boolean);
      if (ids.length === 0) return res.json({ count: 0 });
      const placeholders = ids.map(() => "?").join(",");
      const [[row]] = await pool.execute<any[]>(
        `SELECT COUNT(*) AS cnt FROM boutique_clients WHERE id IN (${placeholders}) AND telephone IS NOT NULL AND telephone != ''`,
        ids
      );
      count = Number(row?.cnt ?? 0);
    } else {
      const [[row]] = await pool.execute<any[]>(
        `SELECT COUNT(*) AS cnt FROM boutique_clients WHERE telephone IS NOT NULL AND telephone != ''`
      );
      count = Number(row?.cnt ?? 0);
    }
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Send campaign
router.post("/api/admin/whatsapp-campagne/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const { message, client_ids, image_url } = req.body as {
    message:     string;
    client_ids?: number[];
    image_url?:  string;
  };

  if (!message?.trim()) return res.status(400).json({ error: "Message requis." });

  try {
    let rows: any[];
    if (client_ids && client_ids.length > 0) {
      const placeholders = client_ids.map(() => "?").join(",");
      [rows] = await pool.execute<any[]>(
        `SELECT id, nom, telephone FROM boutique_clients WHERE id IN (${placeholders}) AND telephone IS NOT NULL AND telephone != '' ORDER BY id ASC`,
        client_ids
      );
    } else {
      [rows] = await pool.execute<any[]>(
        `SELECT id, nom, telephone FROM boutique_clients WHERE telephone IS NOT NULL AND telephone != '' ORDER BY id ASC`
      );
    }

    // Upload image once for all recipients
    let mediaId: string | null = null;
    if (image_url?.trim()) {
      const imgRes = await fetch(image_url).catch(() => null);
      if (imgRes?.ok) {
        const buffer   = Buffer.from(await imgRes.arrayBuffer());
        const mime     = imgRes.headers.get("content-type") ?? "image/jpeg";
        const filename = image_url.split("/").pop()?.split("?")[0] ?? "product.jpg";
        const upload   = await uploadWaMedia(buffer, mime, filename);
        if (upload.success && upload.mediaId) mediaId = upload.mediaId;
      }
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const client of rows) {
      await new Promise(r => setTimeout(r, 600));
      const to = formatTgPhone(String(client.telephone));
      const result = mediaId
        ? await sendWaImage({ to, mediaId, caption: message })
        : await sendWaText({ to, body: message });
      if (result.success) sent++;
      else {
        failed++;
        if (result.error && !errors.includes(result.error)) errors.push(result.error);
      }
    }

    res.json({ success: true, sent, failed, total: rows.length, errors });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
