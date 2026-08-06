import express from "express";
import { db } from "@/lib/db";
import { getSession } from "../../lib/auth";
import { hasPageAccess } from "@/lib/admin-permissions";
import { emitAdminEvent } from "../../lib/admin-events";
import { sendBoutiqueVenteNotif } from "../../lib/whatsapp";
import { logActivity } from "../../lib/activity-log";
import {
  listFactures, createVenteWithStock, getVentesStats, getFacturesPeriodCounts,
  updateFactureStatut, updateFacture, deleteFacture, getFactureById,
  listDevis, createDevis, listLivraisons,
  getFinanceStats, getStockBoutiqueStats, getStockBoutiqueList,
} from "@/lib/admin-db";

const router = express.Router();

// ── Factures ──────────────────────────────────────────────────────────────
router.get("/api/admin/ventes/factures", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const search       = (req.query.q as string)             || undefined;
    const statut       = (req.query.statut as string)        || undefined;
    const dateFrom     = (req.query.date_from as string)      || undefined;
    const dateTo       = (req.query.date_to as string)        || undefined;
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset)  || 0);
    const shopId = session.shop_id ?? 1;
    const [{ items, total }, ventesStats, financeStats, stockStats, stockAlertes, periodCounts] = await Promise.all([
      listFactures({ search, statut, dateFrom, dateTo, limit, offset, shopId }),
      getVentesStats(shopId),
      getFinanceStats(shopId).catch(() => null),
      getStockBoutiqueStats(shopId).catch(() => null),
      getStockBoutiqueList({ filter: "faible", limit: 5, shopId }).catch(() => ({ items: [], total: 0 })),
      getFacturesPeriodCounts(shopId).catch(() => ({ today: 0, week: 0, month: 0, all: 0 })),
    ]);
    const stats = {
      ...ventesStats,
      total_recettes: financeStats?.total_recettes ?? 0,
      total_depenses: financeStats?.total_depenses ?? 0,
      solde_net:      financeStats?.solde_net      ?? 0,
      stock_produits: stockStats?.total_produits   ?? 0,
      stock_epuises:  stockStats?.epuises          ?? 0,
      stock_alertes:  stockAlertes.items.map(i => ({ nom: i.nom, quantite: i.quantite, seuil: i.seuil_alerte })),
    };
    res.json({ items, total, stats, period_counts: periodCounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    if (msg.includes("doesn't exist") || msg.includes("ER_NO_SUCH_TABLE")) {
      return res.status(503).json({ error: "migration_needed" });
    }
    res.status(500).json({ error: msg });
  }
});

router.post("/api/admin/ventes/factures", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "boutique", "create_vente")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const body = req.body;
    if (!body.client_nom || !body.items?.length) {
      return res.status(400).json({ error: "client_nom et items sont requis." });
    }

    // Plan limit: ventes/jour + ventes/mois (skip super_admin and shop #1)
    const shopId = session.shop_id ?? 1;
    if (shopId !== 1 && session.role !== "super_admin") {
      const { getPlanLimits } = await import("@/lib/plan-configs");
      const { getShopById }   = await import("@/lib/shops");
      const shop   = await getShopById(shopId).catch(() => null);
      const limits = await getPlanLimits(shop?.plan ?? "basic");
      if (limits.max_ventes_jour > 0 || limits.max_ventes_mois > 0) {
        const [[counts]] = await (db as import("mysql2/promise").Pool).execute<import("mysql2/promise").RowDataPacket[]>(
          `SELECT
             SUM(DATE(created_at)=CURDATE()) AS today,
             SUM(YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())) AS mois
           FROM factures WHERE shop_id = ?`, [shopId]
        );
        if (limits.max_ventes_jour > 0 && Number(counts?.today ?? 0) >= limits.max_ventes_jour) {
          return res.status(403).json({ error: `Limite atteinte : ${limits.max_ventes_jour} ventes par jour maximum sur votre plan ${shop?.plan}.`, plan_limit: true });
        }
        if (limits.max_ventes_mois > 0 && Number(counts?.mois ?? 0) >= limits.max_ventes_mois) {
          return res.status(403).json({ error: `Limite atteinte : ${limits.max_ventes_mois} ventes par mois maximum sur votre plan ${shop?.plan}.`, plan_limit: true });
        }
      }
    }

    const { id, reference } = await createVenteWithStock({ ...body, admin_id: session.id, shop_id: shopId });
    emitAdminEvent("vente");
    logActivity({ shopId, username: session.nom ?? session.username ?? "Admin", actionType: "vente_créée", entity: "vente", entityId: id, label: `Vente ${reference} — ${body.client_nom} (${Number(body.total ?? 0).toLocaleString("fr")} FCFA)`, workspace: "Boutique" });
    if (body.client_tel) {
      const rawItems = typeof body.items === "string" ? JSON.parse(body.items) : body.items ?? [];
      sendBoutiqueVenteNotif({
        telephone:       body.client_tel,
        nom:             body.client_nom,
        reference,
        total:           Number(body.total ?? 0),
        montant_acompte: body.montant_acompte ? Number(body.montant_acompte) : null,
        statut_paiement: body.statut_paiement ?? null,
        items:           rawItems.map((i: { nom?: string; qty?: number; total?: number }) => ({
          nom:   i.nom ?? "Produit",
          qty:   i.qty ?? 1,
          total: i.total ?? 0,
        })),
        shopId,
      }).catch(console.error);
    }
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/ventes/factures/export", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const search = (req.query.q as string)      || undefined;
    const statut = (req.query.statut as string) || undefined;
    const shopId = session.shop_id ?? 1;
    const { items } = await listFactures({ search, statut, limit: 5000, offset: 0, shopId });

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const MODES: Record<string, string> = {
      especes: "Espèces", moov_money: "Moov Money", tmoney: "TMoney",
      virement_bancaire: "Virement bancaire", mix_by_yas: "Mix by Yas",
    };
    const headers = ["Référence", "Client", "Téléphone", "Total", "Mode paiement", "Statut", "Vendeur", "Date"];
    const rows = items.map(f => [
      f.reference, f.client_nom, f.client_tel ?? "", Number(f.total),
      f.mode_paiement ? (MODES[f.mode_paiement] ?? f.mode_paiement) : "",
      f.statut, f.vendeur ?? "", String(f.created_at).slice(0, 10),
    ].map(escape).join(","));

    const csv = [headers.map(escape).join(","), ...rows].join("\r\n");
    const filename = `ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("﻿" + csv);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.get("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const facture = await getFactureById(Number(req.params.id));
  if (!facture) return res.status(404).json({ error: "Introuvable." });
  res.json(facture);
});

router.patch("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const isPayment = req.body?.montant_paiement !== undefined;
  const requiredPerm = isPayment ? "add_paiement" : "edit_vente";
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "boutique", requiredPerm)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const { statut, statut_paiement, mode_paiement, montant_acompte, montant_paiement } = req.body;
    if (statut && !statut_paiement && !mode_paiement && montant_acompte === undefined) {
      await updateFactureStatut(Number(req.params.id), statut);
    } else {
      await updateFacture(Number(req.params.id), {
        statut, statut_paiement, mode_paiement, montant_acompte,
        montant_paiement: montant_paiement ? Number(montant_paiement) : undefined,
        admin_id: session.id,
        shop_id:  session.shop_id ?? 1,
      });
    }
    emitAdminEvent("vente");
    const isPayment = req.body?.montant_paiement !== undefined;
    logActivity({ shopId: session.shop_id ?? 1, username: session.nom ?? session.username ?? "Admin", actionType: isPayment ? "paiement_ajouté" : "vente_modifiée", entity: "vente", entityId: Number(req.params.id), label: isPayment ? `Paiement enregistré sur vente #${req.params.id}` : `Vente #${req.params.id} modifiée`, workspace: "Boutique" });
    res.json({ ok: true, vendeur: session.nom });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "boutique", "delete_vente")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const facId = Number(req.params.id);
  await deleteFacture(facId);
  logActivity({ shopId: session.shop_id ?? 1, username: session.nom ?? session.username ?? "Admin", actionType: "vente_supprimée", entity: "vente", entityId: facId, label: `Vente #${facId} supprimée`, workspace: "Boutique" });
  res.json({ ok: true });
});

// ── Devis ─────────────────────────────────────────────────────────────────
router.get("/api/admin/ventes/devis", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const search = (req.query.q as string)      || undefined;
    const statut = (req.query.statut as string) || undefined;
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset)  || 0);
    const { items, total } = await listDevis({ search, statut, limit, offset, shopId: session.shop_id ?? 1 });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/ventes/devis", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const body = req.body;
    if (!body.client_nom || !body.items?.length) {
      return res.status(400).json({ error: "client_nom et items sont requis." });
    }
    const id = await createDevis({ ...body, admin_id: session.id, shop_id: session.shop_id ?? 1 });
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ── Livraisons ventes ─────────────────────────────────────────────────────
router.get("/api/admin/ventes/livraisons", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset)  || 0);
    const { items, total } = await listLivraisons({ limit, offset, shopId: session.shop_id ?? 1 });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
