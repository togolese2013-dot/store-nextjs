import express from "express";
import { getSession } from "../../lib/auth";
import { getShopById, archiveShop, selfDeleteShop } from "@/lib/shops";
import { resetBoutiqueDemoData } from "@/lib/admin-db";
import { logActivity } from "../../lib/activity-log";

const router = express.Router();

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// POST /api/admin/shop/reset-demo-data — wipes ventes/stock/clients boutique for this shop.
// Requires typing the exact shop name as a confirmation safeguard (irreversible action).
router.post("/api/admin/shop/reset-demo-data", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Droits insuffisants." });
  }
  const shopId = session.shop_id ?? 1;
  if (shopId === 1) return res.status(403).json({ error: "Action indisponible pour cette boutique." });

  const shop = await getShopById(shopId);
  if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

  const confirmNom = String(req.body.confirm_nom ?? "");
  if (normalize(confirmNom) !== normalize(shop.nom)) {
    return res.status(400).json({ error: "Le nom saisi ne correspond pas au nom de la boutique." });
  }

  try {
    await resetBoutiqueDemoData(shopId);
    logActivity({
      shopId, username: session.nom ?? session.username ?? "Admin",
      actionType: "boutique_reinitialisee", entity: "shop", entityId: shopId,
      label: `Données Boutique réinitialisées (ventes, stock, clients)`, workspace: "Boutique",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// POST /api/admin/shop/archive — hides the shop and blocks admin access until reactivated
// (owner can reactivate anytime from /admin/billing by selecting a plan).
router.post("/api/admin/shop/archive", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Droits insuffisants." });
  }
  const shopId = session.shop_id ?? 1;
  if (shopId === 1) return res.status(403).json({ error: "Action indisponible pour cette boutique." });

  const shop = await getShopById(shopId);
  if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

  const confirmNom = String(req.body.confirm_nom ?? "");
  if (normalize(confirmNom) !== normalize(shop.nom)) {
    return res.status(400).json({ error: "Le nom saisi ne correspond pas au nom de la boutique." });
  }

  try {
    await archiveShop(shopId);
    logActivity({
      shopId, username: session.nom ?? session.username ?? "Admin",
      actionType: "boutique_archivee", entity: "shop", entityId: shopId,
      label: `Boutique archivée par le propriétaire`, workspace: "Boutique",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// POST /api/admin/shop/delete — soft-delete only (no data erased). Blocks admin access via
// the actif kill switch; only a super-admin can restore (unlike /archive, which is self-service).
router.post("/api/admin/shop/delete", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) {
    return res.status(403).json({ error: "Droits insuffisants." });
  }
  const shopId = session.shop_id ?? 1;
  if (shopId === 1) return res.status(403).json({ error: "Action indisponible pour cette boutique." });

  const shop = await getShopById(shopId);
  if (!shop) return res.status(404).json({ error: "Boutique introuvable." });

  const confirmNom = String(req.body.confirm_nom ?? "");
  if (normalize(confirmNom) !== normalize(shop.nom)) {
    return res.status(400).json({ error: "Le nom saisi ne correspond pas au nom de la boutique." });
  }

  try {
    await selfDeleteShop(shopId);
    logActivity({
      shopId, username: session.nom ?? session.username ?? "Admin",
      actionType: "boutique_supprimee", entity: "shop", entityId: shopId,
      label: `Boutique supprimée par le propriétaire (récupérable par le support)`, workspace: "Boutique",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
