import express from "express";
import { getSession } from "../../lib/auth";
import { getSettings, setSettings } from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const settings = await getSettings(session.shop_id ?? 1);
  res.json(settings);
});

router.post("/api/admin/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  await setSettings(req.body, session.shop_id ?? 1);
  res.json({ ok: true });
});

export default router;
