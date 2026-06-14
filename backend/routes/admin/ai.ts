import express from "express";
import { getSession } from "../../lib/auth";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

// ── POST /api/admin/ai/suggestions ────────────────────────────────────────────
router.post("/api/admin/ai/suggestions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY manquant." });

  const shopId = session.shop_id ?? 1;
  const pool   = db as mysql.Pool;

  try {
    // ── Context DB ────────────────────────────────────────────
    const [[stats]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(CASE WHEN p.stock_magasin <= 5 AND p.entrepot_id IS NULL THEN 1 END)                                   AS stock_bas,
        COUNT(CASE WHEN p.description IS NULL OR p.description = ''    THEN 1 END)                                   AS sans_description,
        COUNT(CASE WHEN p.categorie_id IS NULL                         THEN 1 END)                                   AS sans_categorie,
        COUNT(CASE WHEN p.prix_entrepot IS NOT NULL AND p.prix_entrepot > 0
                        AND p.prix_unitaire > 0
                        AND ((p.prix_unitaire - p.prix_entrepot) / p.prix_unitaire) < 0.30 THEN 1 END)               AS marge_faible,
        COUNT(CASE WHEN (p.image_url IS NULL OR p.image_url = '')      THEN 1 END)                                   AS sans_image,
        COUNT(*)                                                                                                       AS total
      FROM produits p
      WHERE p.actif = 1 AND p.shop_id = ?
    `, [shopId]);

    const [prodsStockBas] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT nom, stock_magasin FROM produits
      WHERE actif = 1 AND shop_id = ? AND stock_magasin <= 5 AND entrepot_id IS NULL
      ORDER BY stock_magasin ASC LIMIT 5
    `, [shopId]);

    const [[ventes]] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS nb, COALESCE(SUM(total), 0) AS ca
      FROM factures
      WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [shopId]).catch(() => [[{ nb: 0, ca: 0 }]] as any);

    const context = {
      total_produits:    Number(stats.total),
      stock_bas:         Number(stats.stock_bas),
      sans_description:  Number(stats.sans_description),
      sans_categorie:    Number(stats.sans_categorie),
      marge_faible:      Number(stats.marge_faible),
      sans_image:        Number(stats.sans_image),
      produits_critiques: prodsStockBas.map((p: any) => ({ nom: p.nom, stock: Number(p.stock_magasin) })),
      ventes_7j:         Number(ventes.nb),
      ca_7j_fcfa:        Number(ventes.ca),
    };

    // ── Appel Claude ─────────────────────────────────────────
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `Tu es l'assistant IA d'une application de gestion de boutique africaine.
Génère exactement 4 suggestions d'actions prioritaires basées sur les données fournies.
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte ni markdown autour.
Format de chaque élément :
{ "ic": string, "tone": string, "t": string, "d": string, "cta": string }
Règles :
- ic : une valeur parmi exactement : alert, box, folder, sparkles, adj, bell, store
- tone : "danger" (urgent/critique), "accent" (important), "ok" (opportunité/positif)
- t : titre court ≤ 60 caractères
- d : description actionnable ≤ 120 caractères
- cta : texte du bouton ≤ 28 caractères
Priorité : stock critique > marge faible > données manquantes > optimisations.
Langue : français, ton professionnel et concis.`,
        messages: [{
          role:    "user",
          content: `Données de la boutique : ${JSON.stringify(context)}`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(500).json({ error: `Claude API error: ${claudeRes.status} — ${err.slice(0, 200)}` });
    }

    const claudeData = await claudeRes.json() as any;
    const text = claudeData.content?.[0]?.text ?? "[]";

    let suggestions;
    try {
      // Strip possible markdown fences
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions  = JSON.parse(clean);
      if (!Array.isArray(suggestions)) throw new Error("not array");
    } catch {
      suggestions = [];
    }

    res.json({ suggestions, context });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
