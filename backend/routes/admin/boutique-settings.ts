import express from "express";
import { z } from "zod";
import { getSession } from "../../lib/auth";
import { getSettings, setSettings } from "@/lib/admin-db";

const router = express.Router();
const PREFIX = "boutique_";

router.get("/api/admin/boutique/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const all = await getSettings(session.shop_id ?? 1);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(PREFIX)) {
      const section = k.slice(PREFIX.length);
      try { result[section] = JSON.parse(v); } catch { result[section] = {}; }
    }
  }
  res.json(result);
});

const SaveSchema = z.object({
  section: z.string().min(1).max(50).regex(/^[a-z_]+$/),
  state: z.record(z.unknown()),
});

router.post("/api/admin/boutique/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides." });

  const { section, state } = parsed.data;
  await setSettings(
    { [`${PREFIX}${section}`]: JSON.stringify(state) },
    session.shop_id ?? 1,
  );
  res.json({ ok: true });
});

export default router;
