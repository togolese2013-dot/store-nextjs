import express from "express";
import { getSession } from "../../lib/auth";
import { getDeliveryZones, upsertDeliveryZone, deleteDeliveryZone } from "@/lib/admin-db";
import { db } from "@/lib/db";

const router = express.Router();

async function ensureDeliveryZonesTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nom        VARCHAR(100) NOT NULL,
      fee        INT UNSIGNED NOT NULL DEFAULT 0,
      actif      TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      prix_libre TINYINT(1)   NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try { await db.execute("ALTER TABLE delivery_zones ADD COLUMN prix_libre TINYINT(1) NOT NULL DEFAULT 0"); }
  catch (e: any) { if (e?.code !== "ER_DUP_FIELDNAME") throw e; }
}
ensureDeliveryZonesTable().catch(console.error);

// GET /api/admin/delivery-zones
router.get("/api/admin/delivery-zones", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    const zones = await getDeliveryZones();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// POST /api/admin/delivery-zones — upsert or delete
router.post("/api/admin/delivery-zones", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const body = req.body;

    if (body._delete && body.id) {
      await deleteDeliveryZone(Number(body.id));
      return res.json({ ok: true, deleted: true });
    }

    if (!body.nom?.trim()) {
      return res.status(400).json({ error: "Nom de zone requis." });
    }

    await upsertDeliveryZone({
      id:         body.id ? Number(body.id) : undefined,
      nom:        String(body.nom).trim(),
      fee:        Number(body.fee ?? 0),
      actif:      body.actif !== false && body.actif !== 0,
      sort_order: Number(body.sort_order ?? 0),
      prix_libre: Boolean(body.prix_libre),
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// DELETE /api/admin/delivery-zones/:id
router.delete("/api/admin/delivery-zones/:id", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    if (!["super_admin", "admin"].includes(session.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    await deleteDeliveryZone(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
