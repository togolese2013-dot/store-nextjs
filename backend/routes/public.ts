import express from "express";
import { getProducts, getProductsByIds, getCategories, db } from "@/lib/db";
import {
  subscribeNewsletter, addFidelitePoints, listReviews, createReview, getSettings,
} from "@/lib/admin-db";

const router = express.Router();

// ── Health ────────────────────────────────────────────────────────────────
router.get("/api/health", async (_req, res) => {
  let dbStatus = "untested";
  let tables: string[] = [];
  try {
    const [rows] = await (db as import("mysql2/promise").Pool).execute<import("mysql2/promise").RowDataPacket[]>(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    tables    = rows.map((r) => r.TABLE_NAME as string);
    dbStatus  = "connected";
  } catch (e) {
    dbStatus = `error: ${e instanceof Error ? e.message : String(e)}`;
  }
  res.json({ status: "ok", db_status: dbStatus, tables });
});

// ── Products ──────────────────────────────────────────────────────────────
router.get("/api/products", async (req, res) => {
  try {
    const idsParam = req.query.ids as string;
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0).slice(0, 50);
      if (!ids.length) return res.json({ success: true, data: [] });
      const products = await getProductsByIds(ids);
      return res.json({ success: true, data: products });
    }
    const products = await getProducts({
      categoryId:     req.query.category  ? Number(req.query.category) : undefined,
      search:         (req.query.q as string)         || undefined,
      referenceExact: (req.query.reference as string) || undefined,
      promoOnly:      req.query.promo === "true",
      newOnly:        req.query.new   === "true",
      limit:          req.query.limit  ? Number(req.query.limit)  : 60,
      offset:         req.query.offset ? Number(req.query.offset) : 0,
    });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// ── Categories ────────────────────────────────────────────────────────────
router.get("/api/categories", async (_req, res) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// ── Newsletter ────────────────────────────────────────────────────────────
router.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: "Email requis." });
    await subscribeNewsletter(email.trim().toLowerCase());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Avis clients ──────────────────────────────────────────────────────────
router.get("/api/reviews", async (req, res) => {
  try {
    const produit_id = req.query.produit_id ? Number(req.query.produit_id) : undefined;
    const reviews    = await listReviews({ produit_id });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/reviews", async (req, res) => {
  try {
    const { produit_id, nom, note, commentaire } = req.body;
    if (!produit_id || !nom || !note) return res.status(400).json({ error: "Champs requis." });
    await createReview({ produit_id: Number(produit_id), nom, note: Number(note), commentaire });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/settings/public", async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
