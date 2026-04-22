import express from "express";
import { getSession } from "../../lib/auth";
import { adminEmitter } from "../../lib/admin-events";

const router = express.Router();

router.get("/api/admin/events", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end("Non autorisé");

  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache, no-transform");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  const handler = (event: { type: string; ts: number }) => {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* client disconnected */ }
  };

  adminEmitter.on("admin", handler);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); adminEmitter.off("admin", handler); }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    adminEmitter.off("admin", handler);
    res.end();
  });
});

export default router;
