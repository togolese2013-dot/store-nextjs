import express from "express";
import { getSession } from "../../lib/auth";
import { db as pool } from "@/lib/db";
import { sendWaText } from "../../lib/whatsapp";

const router = express.Router();

// Preview — count recipients
router.get("/api/admin/whatsapp-campagne/preview", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const audience = (req.query.audience as string) ?? "tous";

  let where = "telephone IS NOT NULL AND telephone != ''";
  if (audience === "debiteurs") where += " AND solde < 0";
  else if (audience === "ville" && req.query.ville) {
    where += ` AND localisation LIKE ${pool.escape(`%${req.query.ville}%`)}`;
  }

  try {
    const [[row]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS cnt FROM boutique_clients WHERE ${where}`
    );
    res.json({ count: Number(row?.cnt ?? 0) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Send campaign
router.post("/api/admin/whatsapp-campagne/send", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const { message, audience, ville } = req.body as {
    message:  string;
    audience: string;
    ville?:   string;
  };

  if (!message?.trim()) return res.status(400).json({ error: "Message requis." });

  let where = "telephone IS NOT NULL AND telephone != ''";
  if (audience === "debiteurs") where += " AND solde < 0";
  else if (audience === "ville" && ville) {
    where += ` AND localisation LIKE ${pool.escape(`%${ville}%`)}`;
  }

  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT id, nom, telephone FROM boutique_clients WHERE ${where} ORDER BY id ASC`
    );

    let sent = 0;
    let failed = 0;

    for (const client of rows) {
      await new Promise(r => setTimeout(r, 600)); // 600ms delay — avoid Meta ban
      const result = await sendWaText({ to: String(client.telephone), body: message });
      if (result.success) sent++;
      else failed++;
    }

    res.json({ success: true, sent, failed, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
