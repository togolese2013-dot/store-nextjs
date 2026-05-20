import express from "express";
import { getSession } from "../../lib/auth";

const router = express.Router();

const N8N_WEBHOOK    = "https://n8n.togolese.fr/webhook/facebook-publisher";
const AD_ACCOUNT_ID  = "act_976291178146381";
const PAGE_ID        = "1110500725482756";
const FB_API_VERSION = "v21.0";
const FB_API_BASE    = `https://graph.facebook.com/${FB_API_VERSION}`;

async function fbPost(path: string, body: Record<string, unknown>, token: string) {
  const url = `${FB_API_BASE}/${path}`;
  const res  = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ...body, access_token: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data?.error?.message || `Meta API error on ${path}: HTTP ${res.status}`);
  }
  return data as { id: string };
}

async function boostPost(postId: string, budgetPerDay: number, days: number): Promise<string> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new Error("META_ADS_TOKEN non configuré.");

  const now     = Math.floor(Date.now() / 1000);
  const endTime = now + days * 86400;

  const campaign = await fbPost(`${AD_ACCOUNT_ID}/campaigns`, {
    name:                  `Boost — ${postId}`,
    objective:             "OUTCOME_ENGAGEMENT",
    status:                "ACTIVE",
    special_ad_categories: [],
  }, token);

  const adset = await fbPost(`${AD_ACCOUNT_ID}/adsets`, {
    name:              "Acheteurs Togo — Mobile",
    campaign_id:       campaign.id,
    daily_budget:      budgetPerDay,
    billing_event:     "IMPRESSIONS",
    optimization_goal: "REACH",
    targeting: {
      geo_locations: {
        countries:      ["TG"],
        location_types: ["home", "recent"],
      },
      age_min:             22,
      age_max:             50,
      locales:             [7],       // French speakers
      device_platforms:    ["mobile"],
      publisher_platforms: ["facebook"],
      facebook_positions:  ["feed"],
      behaviors: [
        { id: 6071631541183, name: "Online shoppers" },
      ],
    },
    start_time: now,
    end_time:   endTime,
    status:     "ACTIVE",
  }, token);

  const creative = await fbPost(`${AD_ACCOUNT_ID}/adcreatives`, {
    name:             `Creative — ${postId}`,
    object_story_id:  `${PAGE_ID}_${postId}`,
  }, token);

  const ad = await fbPost(`${AD_ACCOUNT_ID}/ads`, {
    name:     "Boost Togo",
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status:   "ACTIVE",
  }, token);

  return ad.id;
}

router.post("/api/admin/social/publish", async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });

    const { type, products, boost, boostBudget, boostDays } = req.body;
    if (!type || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Payload invalide." });
    }

    const n8nRes = await fetch(N8N_WEBHOOK, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ type, products }),
    });

    const data = await n8nRes.json().catch(() => ({}));

    if (!n8nRes.ok) {
      return res.status(502).json({ error: data?.error || `n8n a retourné HTTP ${n8nRes.status}` });
    }

    // Boost if requested and post_id available
    let boostAdId: string | null = null;
    let boostError: string | null = null;

    if (boost === true) {
      // n8n returns the full post id as data.id (format: PAGE_ID_POST_ID or just the numeric part)
      const rawPostId = data?.post_id || data?.id || "";
      // Extract the numeric post id (after the underscore if composite)
      const postId = String(rawPostId).includes("_")
        ? String(rawPostId).split("_").pop()!
        : String(rawPostId);

      if (postId) {
        const budget = Number(boostBudget) > 0 ? Number(boostBudget) : 2000;
        const days   = Number(boostDays)   > 0 ? Number(boostDays)   : 3;
        boostAdId = await boostPost(postId, budget, days).catch(err => {
          boostError = err instanceof Error ? err.message : "Erreur boost.";
          return null;
        });
      } else {
        boostError = "post_id introuvable dans la réponse n8n — boost impossible.";
      }
    }

    res.json({ ok: true, ...data, boostAdId, boostError });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
