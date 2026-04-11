import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

interface NewOrder {
  id:         number;
  reference:  string;
  nom:        string;
  total:      number;
  created_at: string;
}

async function getNewOrders(since: string): Promise<NewOrder[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT id, reference, nom, total, created_at
     FROM orders
     WHERE created_at > ?
     ORDER BY created_at ASC
     LIMIT 10`,
    [since]
  );
  return rows as NewOrder[];
}

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  // Use provided timestamp or default to now
  let since = sinceParam ?? new Date().toISOString().slice(0, 19).replace("T", " ");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Close after 25s so Netlify serverless functions don't timeout.
      // EventSource reconnects automatically — the ?since param keeps no orders missed.
      const timeout = setTimeout(() => {
        try { controller.close(); } catch { /* already closed */ }
      }, 25_000);

      const interval = setInterval(async () => {
        try {
          const orders = await getNewOrders(since);

          if (orders.length > 0) {
            for (const order of orders) {
              const payload = JSON.stringify({
                id:         order.id,
                reference:  order.reference,
                nom:        order.nom,
                total:      order.total,
                created_at: order.created_at,
              });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
            // Advance since to last received order
            since = orders[orders.length - 1].created_at;
          } else {
            // Keepalive heartbeat
            controller.enqueue(encoder.encode(`event: heartbeat\ndata: ok\n\n`));
          }
        } catch {
          // DB error — send heartbeat to keep connection alive
          try {
            controller.enqueue(encoder.encode(`event: heartbeat\ndata: ok\n\n`));
          } catch { /* stream closed */ }
        }
      }, 3000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(timeout);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
