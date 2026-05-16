import express from "express";
import { getSession } from "../../lib/auth";
import { db as pool } from "@/lib/db";

const router = express.Router();

router.get("/api/admin/dashboard", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [[ordersToday]] = await pool.execute<any[]>(`
      SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS ca
      FROM orders
      WHERE DATE(created_at) = ? AND status != 'cancelled'
    `, [today]);

    const [[ordersPending]] = await pool.execute<any[]>(`
      SELECT COUNT(*) AS cnt FROM orders WHERE status = 'pending'
    `);

    const [[ventesToday]] = await pool.execute<any[]>(`
      SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS ca
      FROM factures
      WHERE DATE(created_at) = ? AND statut != 'annule' AND (source IS NULL OR source != 'site_order')
    `, [today]);

    const [[clientsToday]] = await pool.execute<any[]>(`
      SELECT COUNT(*) AS cnt FROM boutique_clients WHERE DATE(created_at) = ?
    `, [today]).catch(() => [[{ cnt: 0 }]]);

    const [lowStock] = await pool.execute<any[]>(`
      SELECT COUNT(*) AS cnt FROM products WHERE stock <= 3 AND stock >= 0 AND actif = 1
    `).catch(() => [[{ cnt: 0 }]]);

    const [[ordersWeek]] = await pool.execute<any[]>(`
      SELECT COALESCE(SUM(total), 0) AS ca
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status != 'cancelled'
    `);

    res.json({
      orders_today:    Number(ordersToday?.cnt   ?? 0),
      ca_today:        Number(ordersToday?.ca    ?? 0),
      orders_pending:  Number(ordersPending?.cnt ?? 0),
      ventes_today:    Number(ventesToday?.cnt   ?? 0),
      ca_ventes_today: Number(ventesToday?.ca    ?? 0),
      clients_today:   Number(clientsToday?.cnt  ?? 0),
      low_stock:       Number((lowStock as any[])[0]?.cnt ?? 0),
      ca_week:         Number(ordersWeek?.ca     ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
