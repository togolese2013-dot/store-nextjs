import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

// ── Shared helper — appel Claude ──────────────────────────────────────────────
async function callClaude(apiKey: string, system: string, user: string, maxTokens = 1024): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: maxTokens,
      system, messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  const data = await res.json() as any;
  return data.content?.[0]?.text ?? "";
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean) as T;
  } catch { return fallback; }
}

function apiKey(): string | null { return process.env.ANTHROPIC_API_KEY ?? null; }

// ── POST /api/admin/ai/suggestions ───────────────────────────────────────────
router.post("/api/admin/ai/suggestions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const key = apiKey();
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const shopId = session.shop_id ?? 1;
  const pool   = db as mysql.Pool;

  try {
    const [[stats]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(CASE WHEN p.stock_magasin <= 5 AND p.entrepot_id IS NULL THEN 1 END)  AS stock_bas,
        COUNT(CASE WHEN p.description IS NULL OR p.description = ''    THEN 1 END)  AS sans_description,
        COUNT(CASE WHEN p.categorie_id IS NULL                         THEN 1 END)  AS sans_categorie,
        COUNT(CASE WHEN p.prix_entrepot IS NOT NULL AND p.prix_entrepot > 0
                        AND p.prix_unitaire > 0
                        AND ((p.prix_unitaire - p.prix_entrepot) / p.prix_unitaire) < 0.30 THEN 1 END) AS marge_faible,
        COUNT(CASE WHEN (p.image_url IS NULL OR p.image_url = '')      THEN 1 END)  AS sans_image,
        COUNT(*)                                                                      AS total
      FROM produits p WHERE p.actif = 1 AND p.shop_id = ?
    `, [shopId]);

    const [prodsStockBas] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT nom, stock_magasin FROM produits
      WHERE actif = 1 AND shop_id = ? AND stock_magasin <= 5 AND entrepot_id IS NULL
      ORDER BY stock_magasin ASC LIMIT 5
    `, [shopId]);

    const [[ventes]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS nb, COALESCE(SUM(total), 0) AS ca
      FROM factures WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [shopId]).catch(() => [[{ nb: 0, ca: 0 }]] as any);

    const context = {
      total_produits:    Number(stats.total),
      stock_bas:         Number(stats.stock_bas),
      sans_description:  Number(stats.sans_description),
      sans_categorie:    Number(stats.sans_categorie),
      marge_faible:      Number(stats.marge_faible),
      sans_image:        Number(stats.sans_image),
      produits_critiques: prodsStockBas.map((p: any) => ({ nom: p.nom, stock: Number(p.stock_magasin) })),
      ventes_7j:  Number(ventes.nb),
      ca_7j_fcfa: Number(ventes.ca),
    };

    const text = await callClaude(key,
      `Tu es l'assistant IA d'une boutique africaine. Génère exactement 4 suggestions d'actions prioritaires.
Réponds UNIQUEMENT avec un tableau JSON valide.
Format : { "ic": string, "tone": string, "t": string, "d": string, "cta": string }
ic : alert | box | folder | sparkles | adj | bell | store
tone : "danger" (urgent), "accent" (important), "ok" (opportunité)
t : titre ≤ 60 chars · d : description ≤ 120 chars · cta : bouton ≤ 28 chars
Langue : français, ton professionnel.`,
      `Données : ${JSON.stringify(context)}`
    );

    const suggestions = parseJson(text, []);
    res.json({ suggestions, context });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/ai/classify-products ─────────────────────────────────────
router.post("/api/admin/ai/classify-products", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const key = apiKey();
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const shopId = session.shop_id ?? 1;
  const pool   = db as mysql.Pool;

  try {
    const [uncat] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT id, nom, reference FROM produits
      WHERE shop_id = ? AND actif = 1 AND categorie_id IS NULL LIMIT 60
    `, [shopId]);

    if (!uncat.length) return res.json({ classified: 0, message: "Aucun produit sans catégorie." });

    const [cats] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT id, nom FROM categories WHERE shop_id = ?
    `, [shopId]).catch(() => [[]] as any);

    if (!Array.isArray(cats) || !cats.length) {
      return res.json({ classified: 0, message: "Aucune catégorie disponible. Créez-en d'abord." });
    }

    const text = await callClaude(key,
      `Tu es un assistant e-commerce. Classe des produits dans les catégories existantes.
Réponds UNIQUEMENT avec un tableau JSON : [{ "produit_id": number, "categorie_id": number }]
Assigne la catégorie la plus appropriée à chaque produit. Omets les produits sans correspondance claire.`,
      `Produits : ${JSON.stringify(uncat)}\nCatégories : ${JSON.stringify(cats)}`,
      2048
    );

    const assignments = parseJson<Array<{ produit_id: number; categorie_id: number }>>(text, []);
    let classified = 0;
    for (const a of assignments) {
      if (!a.produit_id || !a.categorie_id) continue;
      await pool.execute(
        "UPDATE produits SET categorie_id = ? WHERE id = ? AND shop_id = ?",
        [a.categorie_id, a.produit_id, shopId]
      );
      classified++;
    }

    res.json({ classified, total: uncat.length, assignments });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/ai/stock-forecast ────────────────────────────────────────
router.post("/api/admin/ai/stock-forecast", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const key = apiKey();
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const shopId = session.shop_id ?? 1;
  const pool   = db as mysql.Pool;

  try {
    // Produits avec stock bas + vélocité via boutique_mouvements (sorties 30j)
    const [products] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT p.id, p.nom, p.stock_magasin, p.reference, p.prix_unitaire,
        COALESCE(mv.sorties_30j, 0) AS ventes_30j
      FROM produits p
      LEFT JOIN (
        SELECT produit_id, SUM(quantite) AS sorties_30j
        FROM boutique_mouvements
        WHERE type = 'sortie' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY produit_id
      ) mv ON mv.produit_id = p.id
      WHERE p.shop_id = ? AND p.actif = 1 AND p.entrepot_id IS NULL
        AND (p.stock_magasin <= 30 OR COALESCE(mv.sorties_30j, 0) >= 3)
      ORDER BY p.stock_magasin ASC, ventes_30j DESC
      LIMIT 25
    `, [shopId]).catch(() => [[]] as any);

    if (!Array.isArray(products) || !products.length) {
      return res.json({ forecasts: [], message: "Stock suffisant — aucun produit à risque détecté." });
    }

    const text = await callClaude(key,
      `Tu analyses les stocks d'une boutique africaine et prédis les ruptures.
Réponds UNIQUEMENT avec un tableau JSON :
[{ "produit_id": number, "nom": string, "stock": number, "ventes_30j": number,
   "jours_restants": number|null, "urgence": "critique"|"attention"|"ok",
   "recommandation": string, "qte_a_commander": number }]
jours_restants = stock / (ventes_30j/30), null si ventes_30j = 0.
urgence: critique < 7j, attention < 20j, ok > 20j ou sans vélocité.
recommandation : ≤ 80 chars français.
qte_a_commander : stock pour couvrir 45 jours.`,
      `Produits : ${JSON.stringify(products.map((p: any) => ({ id: p.id, nom: p.nom, stock: Number(p.stock_magasin), ventes_30j: Number(p.ventes_30j) })))}`
    );

    const forecasts = parseJson(text, []);
    res.json({ forecasts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/ai/query — chatbot palette ───────────────────────────────
router.post("/api/admin/ai/query", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const key = apiKey();
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const { question } = req.body as { question?: string };
  if (!question?.trim()) return res.status(400).json({ error: "Question requise." });

  const shopId = session.shop_id ?? 1;
  const pool   = db as mysql.Pool;

  try {
    const [[ctx]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM produits         WHERE shop_id = ? AND actif = 1)                                AS total_produits,
        (SELECT COUNT(*) FROM factures         WHERE shop_id = ? AND DATE(created_at) = CURDATE())             AS ventes_aujourd_hui,
        (SELECT COALESCE(SUM(total),0) FROM factures WHERE shop_id = ? AND DATE(created_at) = CURDATE())       AS ca_aujourd_hui,
        (SELECT COUNT(*) FROM factures         WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS ventes_7j,
        (SELECT COALESCE(SUM(total),0) FROM factures WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS ca_7j,
        (SELECT COUNT(*) FROM factures         WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS ventes_30j,
        (SELECT COALESCE(SUM(total),0) FROM factures WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS ca_30j,
        (SELECT COUNT(*) FROM orders           WHERE shop_id = ? AND status = 'pending')                       AS commandes_en_attente,
        (SELECT COUNT(*) FROM produits         WHERE shop_id = ? AND actif = 1 AND stock_magasin <= 5 AND entrepot_id IS NULL) AS stock_critique,
        (SELECT COUNT(*) FROM boutique_clients WHERE shop_id = ?)                                              AS total_clients
    `, [shopId,shopId,shopId,shopId,shopId,shopId,shopId,shopId,shopId,shopId]);

    const text = await callClaude(key,
      `Tu es l'assistant IA d'une boutique africaine. Réponds en français, concis et direct (2-4 phrases max).
Mets les chiffres clés en avant. Base-toi uniquement sur les données fournies.
Si la question est hors contexte boutique, dis-le poliment.`,
      `Données boutique : ${JSON.stringify(ctx)}\nQuestion : ${question}`,
      300
    );

    res.json({ answer: text || "Je n'ai pas pu répondre à cette question.", question });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── POST /api/admin/ai/weekly-report ─────────────────────────────────────────
router.post("/api/admin/ai/weekly-report", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const key = apiKey();
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const shopId = session.shop_id ?? 1;
  try {
    const { report, waSent } = await generateWeeklyReport(shopId, key);
    res.json({ ok: true, report, waSent });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Internal — génère rapport + envoie WA ────────────────────────────────────
export async function generateWeeklyReport(shopId: number, key: string): Promise<{ report: string; waSent: boolean }> {
  const pool = db as mysql.Pool;

  const [[stats]] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT COUNT(*) AS nb_ventes, COALESCE(SUM(total), 0) AS ca,
           COALESCE(AVG(total), 0) AS panier_moyen
    FROM factures WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `, [shopId]);

  const [[newClients]] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT COUNT(*) AS cnt FROM boutique_clients
    WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `, [shopId]).catch(() => [[{ cnt: 0 }]] as any);

  const [[stockBas]] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT COUNT(*) AS cnt FROM produits
    WHERE shop_id = ? AND actif = 1 AND stock_magasin <= 5 AND entrepot_id IS NULL
  `, [shopId]);

  const [[prevWeek]] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT COALESCE(SUM(total), 0) AS ca_prev
    FROM factures WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
  `, [shopId]);

  const context = {
    nb_ventes:       Number(stats.nb_ventes),
    ca_fcfa:         Number(stats.ca),
    panier_moyen:    Math.round(Number(stats.panier_moyen)),
    ca_semaine_prec: Number(prevWeek.ca_prev),
    evolution_pct:   prevWeek.ca_prev > 0 ? Math.round(((Number(stats.ca) - Number(prevWeek.ca_prev)) / Number(prevWeek.ca_prev)) * 100) : null,
    stock_critique:  Number(stockBas.cnt),
    nouveaux_clients: Number(newClients.cnt),
  };

  const report = await callClaude(key,
    `Tu rédiges des rapports hebdomadaires pour des gérants de boutiques en Afrique francophone.
Format : message WhatsApp, 150-200 mots max, français simple, emojis appropriés.
Structure : titre semaine → chiffres clés → points d'attention → 1 action recommandée.
Sois direct, encourageant et concis.`,
    `Données de la semaine : ${JSON.stringify(context)}`,
    512
  );

  // Send WA to admin
  let waSent = false;
  try {
    const [admins] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT telephone FROM admin_users
      WHERE shop_id = ? AND role IN ('super_admin','admin') AND telephone IS NOT NULL AND telephone != ''
      LIMIT 1
    `, [shopId]);
    const phone = admins[0]?.telephone as string | undefined;
    if (phone) {
      const { sendWaText } = await import("../../lib/whatsapp");
      await sendWaText({ to: phone, body: report });
      waSent = true;
    }
  } catch (e) {
    console.error("[weekly-report] WA send error:", e);
  }

  return { report, waSent };
}

// ── Cron — tous les lundis 08h pour toutes les boutiques actives ──────────────
export async function runWeeklyReportsForAllShops() {
  const key = apiKey();
  if (!key) { console.error("[weekly-report] ANTHROPIC_API_KEY manquant"); return; }
  const pool = db as mysql.Pool;
  try {
    const [shops] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM shops WHERE actif = 1 AND subscription_status IN ('active','trial')`
    );
    for (const shop of shops) {
      try {
        const { waSent } = await generateWeeklyReport(Number(shop.id), key);
        console.log(`[weekly-report] shop ${shop.id} — WA sent: ${waSent}`);
      } catch (e) {
        console.error(`[weekly-report] shop ${shop.id} error:`, e);
      }
    }
  } catch (e) {
    console.error("[weekly-report] cron error:", e);
  }
}

export default router;
