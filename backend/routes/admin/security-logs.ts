import express from "express";
import { getSession } from "../../lib/auth";
import { getSecurityLogs } from "../../lib/security-log";

const router = express.Router();

router.get("/api/admin/security-logs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Accès réservé aux administrateurs." });
  }

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await getSecurityLogs(limit);
  res.json({ logs });
});

export default router;
