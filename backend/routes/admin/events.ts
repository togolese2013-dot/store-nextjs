import express from "express";
import { getSession } from "../../lib/auth";
import { adminEmitter } from "../../lib/admin-events";

const router = express.Router();

function sseSetup(res: express.Response) {
  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache, no-transform");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

const HEARTBEAT_MS  = 75_000;        // 75 s keepalive
const AUTO_CLOSE_MS = 5 * 60_000;    // server closes after 5 min → client reconnects

// Unified SSE endpoint — replaces /api/admin/events + /api/admin/orders/sse
router.get("/api/admin/sse", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).end("Non autorisé");

  sseSetup(res);
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  const handler = (event: Record<string, unknown>) => {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* client gone */ }
  };

  adminEmitter.on("admin", handler);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch {
      cleanup();
    }
  }, HEARTBEAT_MS);

  // Auto-close: signal client to reconnect cleanly, then end the response
  const autoClose = setTimeout(() => {
    try { res.write(`data: ${JSON.stringify({ type: "reconnect" })}\n\n`); } catch { /* already gone */ }
    cleanup();
    res.end();
  }, AUTO_CLOSE_MS);

  function cleanup() {
    clearInterval(heartbeat);
    clearTimeout(autoClose);
    adminEmitter.off("admin", handler);
  }

  req.on("close", () => {
    cleanup();
    res.end();
  });
});

// Legacy aliases — redirect old endpoints so existing clients reconnect cleanly
router.get("/api/admin/events",      async (req, res) => res.redirect(307, "/api/admin/sse"));
router.get("/api/admin/orders/sse",  async (req, res) => res.redirect(307, "/api/admin/sse"));

export default router;
