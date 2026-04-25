import express from "express";
import { getProducts, getProductsByIds, getProductCount, getCategories, checkReviewsTable, db } from "@/lib/db";
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
    const categoryId     = req.query.category  ? Number(req.query.category) : undefined;
    const search         = (req.query.q as string)         || undefined;
    const referenceExact = (req.query.reference as string) || undefined;
    const promoOnly      = req.query.promo   === "true";
    const newOnly        = req.query.new     === "true";
    const inStock        = req.query.inStock === "true";
    const minPrice       = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice       = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const limit          = req.query.limit  ? Number(req.query.limit)  : 60;
    const offset         = req.query.offset ? Number(req.query.offset) : 0;

    const [products, total] = await Promise.all([
      getProducts({ categoryId, search, referenceExact, promoOnly, newOnly, inStock, minPrice, maxPrice, limit, offset }),
      referenceExact
        ? Promise.resolve(1)
        : getProductCount({ categoryId, search, promoOnly, newOnly, inStock, minPrice, maxPrice }),
    ]);
    res.json({ success: true, data: products, total });
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
// ── Bulk ratings (avg + count per product ID) ─────────────────────────────
router.get("/api/reviews/ratings", async (req, res) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) return res.json({ ratings: {} });
    const ids = idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0).slice(0, 100);
    if (!ids.length) return res.json({ ratings: {} });

    const hasReviews = await checkReviewsTable();
    if (!hasReviews) return res.json({ ratings: {} });

    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await db.execute<import("mysql2").RowDataPacket[]>(
      `SELECT product_id,
              ROUND(AVG(rating), 1) AS avg_rating,
              COUNT(*)              AS review_count
       FROM reviews
       WHERE product_id IN (${placeholders}) AND approved = 1
       GROUP BY product_id`,
      ids
    );

    const ratings: Record<string, { avg: number; count: number }> = {};
    for (const r of rows) {
      ratings[String(r.product_id)] = {
        avg:   Number(r.avg_rating),
        count: Number(r.review_count),
      };
    }
    res.json({ ratings });
  } catch {
    // Always return empty — never crash product listings
    res.json({ ratings: {} });
  }
});

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
