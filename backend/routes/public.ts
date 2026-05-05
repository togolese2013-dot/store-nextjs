import express from "express";
import { getProducts, getProductsByIds, getProductCount, getCategories, checkReviewsTable, db } from "@/lib/db";
import {
  subscribeNewsletter, addFidelitePoints, listReviews, createReview, getSettings,
} from "@/lib/admin-db";

const router = express.Router();

async function loadBestsellerProducts(limit: number) {
  const pool = db as import("mysql2/promise").Pool;

  // Step 1: boutique sales via mouvements table (no JSON_TABLE — always works)
  const salesMap = new Map<number, number>();
  try {
    const [mouvsRows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      `SELECT produit_id, SUM(quantite) AS total_sold
       FROM boutique_mouvements
       WHERE type = 'sortie'
         AND motif IN ('Vente', 'Commande site livrée')
       GROUP BY produit_id
       ORDER BY total_sold DESC
       LIMIT 50`
    );
    console.log(`[BS] step1 boutique_mouvements: ${mouvsRows.length} produits`, mouvsRows.map(r => `id=${r.produit_id} qty=${r.total_sold}`));
    for (const r of mouvsRows) {
      salesMap.set(r.produit_id as number, Number(r.total_sold));
    }
  } catch (e) { console.error("[BS] step1 error:", e); }

  // Step 2: online order sales via JSON_TABLE (MySQL 8+ only, graceful skip)
  try {
    const [orderRows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      `SELECT p.id AS produit_id, SUM(jt.qty) AS total_sold
       FROM orders o,
       JSON_TABLE(
         o.items, '$[*]'
         COLUMNS (
           reference VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PATH '$.reference',
           qty       INT          PATH '$.qty'
         )
       ) AS jt
       JOIN produits p ON p.reference = jt.reference
       WHERE o.status NOT IN ('cancelled','annule','annulée')
         AND jt.reference IS NOT NULL
         AND jt.reference <> ''
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 50`
    );
    console.log(`[BS] step2 orders JSON_TABLE: ${orderRows.length} produits`, orderRows.map(r => `id=${r.produit_id} qty=${r.total_sold}`));
    for (const r of orderRows) {
      const pid = r.produit_id as number;
      salesMap.set(pid, (salesMap.get(pid) ?? 0) + Number(r.total_sold));
    }
  } catch (e) { console.error("[BS] step2 JSON_TABLE error:", e); }

  console.log(`[BS] salesMap final: ${salesMap.size} produits —`, [...salesMap.entries()].sort((a,b) => b[1]-a[1]).slice(0,10).map(([id,qty]) => `id=${id}:${qty}`).join(", "));

  // Step 3: fetch and rank products by total sales
  let products: import("mysql2/promise").RowDataPacket[] = [];
  if (salesMap.size > 0) {
    const ranked = [...salesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
    const ids = ranked.map(([id]) => id);
    const placeholders = ids.map(() => "?").join(",");

    const [prodRows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      `SELECT p.*, c.nom AS categorie_nom
       FROM produits p
       LEFT JOIN categories c ON c.id = p.categorie_id
       WHERE p.id IN (${placeholders})
         AND p.actif = 1`,
      ids
    );

    prodRows.sort((a, b) => (salesMap.get(b.id as number) ?? 0) - (salesMap.get(a.id as number) ?? 0));

    const poolSize = Math.min(prodRows.length, Math.max(limit + 8, 16));
    const topPool = prodRows.slice(0, poolSize);
    for (let i = topPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topPool[i], topPool[j]] = [topPool[j], topPool[i]];
    }
    products = topPool.slice(0, limit);
  }

  return products;
}

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
    const bestOnly       = req.query.best    === "true";
    const inStock        = req.query.inStock === "true";
    const minPrice       = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice       = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const limit          = req.query.limit  ? Number(req.query.limit)  : 60;
    const offset         = req.query.offset ? Number(req.query.offset) : 0;

    if (bestOnly) {
      const products = await loadBestsellerProducts(limit);
      return res.json({ success: true, data: products, total: products.length });
    }

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
    await checkReviewsTable(); // ensures note→rating migration ran before INSERT
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

// ── Bestsellers ───────────────────────────────────────────────────────────────
router.get("/api/products/bestsellers", async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit ?? 8)));
    const products = await loadBestsellerProducts(limit);
    res.json({ success: true, data: products });
  } catch (err) {
    // Graceful fallback on JSON_TABLE error (older MySQL)
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Order tracking (public — no auth) ────────────────────────────────────────
router.get("/api/orders/track", async (req, res) => {
  try {
    const q = ((req.query.q as string) ?? "").trim();
    if (!q || q.length < 3) {
      return res.status(400).json({ error: "Veuillez saisir au moins 3 caractères." });
    }

    const pool = db as import("mysql2/promise").Pool;

    // Search by phone OR reference (case-insensitive)
    const [rows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, zone_livraison, delivery_fee,
              subtotal, total, status, statut_paiement, payment_mode,
              items, created_at
       FROM orders
       WHERE telephone = ? OR reference = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [q, q]
    );

    if (!rows.length) {
      return res.json({ success: true, data: [] });
    }

    // Fetch payment plan tranches for plan_paiement orders
    const orderIds = rows.map(r => r.id as number);
    const plansMap: Record<number, { montant_tranche: number; tranches: { numero: number; montant: number; statut: string; date_echeance: string }[] }> = {};
    if (orderIds.length > 0) {
      try {
        const placeholders = orderIds.map(() => "?").join(",");
        const [planRows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
          `SELECT pp.order_id, pp.montant_tranche, pt.numero, pt.montant, pt.statut, pt.date_echeance
           FROM payment_plans pp
           JOIN payment_tranches pt ON pt.plan_id = pp.id
           WHERE pp.order_id IN (${placeholders})
           ORDER BY pp.order_id, pt.numero`,
          orderIds
        );
        for (const pr of planRows) {
          const oid = pr.order_id as number;
          if (!plansMap[oid]) plansMap[oid] = { montant_tranche: pr.montant_tranche, tranches: [] };
          plansMap[oid].tranches.push({
            numero:        pr.numero,
            montant:       pr.montant,
            statut:        pr.statut,
            date_echeance: pr.date_echeance,
          });
        }
      } catch { /* payment_tranches table may not exist yet */ }
    }

    const data = rows.map((r) => {
      let itemCount = 0;
      let itemNames: string[] = [];
      try {
        const parsed = typeof r.items === "string" ? JSON.parse(r.items) : r.items;
        if (Array.isArray(parsed)) {
          itemCount = parsed.reduce((s: number, i: { qty?: number }) => s + (i.qty ?? 1), 0);
          itemNames = parsed.slice(0, 3).map((i: { nom?: string }) => i.nom ?? "");
        }
      } catch { /* ignore */ }

      return {
        id:              r.id,
        reference:       r.reference,
        nom:             r.nom,
        zone_livraison:  r.zone_livraison,
        total:           r.total,
        status:          r.status,
        statut_paiement: r.statut_paiement ?? null,
        payment_mode:    r.payment_mode    ?? null,
        created_at:      r.created_at,
        item_count:      itemCount,
        item_names:      itemNames,
        tranches:        plansMap[r.id as number]?.tranches ?? null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
