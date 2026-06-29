import express from "express";
import { getSession } from "../../lib/auth";
import { getActivityLogs } from "../../lib/activity-log";

const router = express.Router();

router.get("/api/admin/activity-logs", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin", "manager"].includes(session.role)) {
    return res.status(403).json({ error: "Accès refusé." });
  }

  const shopId    = session.role === "super_admin" && req.query.shop_id
    ? Number(req.query.shop_id)
    : (session.shop_id ?? 1);

  const limit     = Math.min(Number(req.query.limit)  || 50, 500);
  const offset    = Math.max(Number(req.query.offset) || 0, 0);
  const workspace  = (req.query.workspace  as string) || undefined;
  const actionType = (req.query.action     as string) || undefined;
  const username   = (req.query.member     as string) || undefined;
  const dateFrom   = (req.query.date_from  as string) || undefined;
  const dateTo     = (req.query.date_to    as string) || undefined;

  try {
    const result = await getActivityLogs(shopId, { limit, offset, workspace, actionType, username, dateFrom, dateTo });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur" });
  }
});

export default router;
