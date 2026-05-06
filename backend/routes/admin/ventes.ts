import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listFactures, createVenteWithStock, getVentesStats,
  updateFactureStatut, updateFacture, deleteFacture, getFactureById,
  listDevis, createDevis, listLivraisons,
  getFinanceStats, getStockBoutiqueStats,
} from "@/lib/admin-db";

const router = express.Router();

// ── Factures ──────────────────────────────────────────────────────────────
router.get("/api/admin/ventes/factures", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const search = (req.query.q as string)      || undefined;
    const statut = (req.query.statut as string) || undefined;
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset)  || 0);
    const [{ items, total }, ventesStats, financeStats, stockStats] = await Promise.all([
      listFactures({ search, statut, limit, offset }),
      getVentesStats(),
      getFinanceStats().catch(() => null),
      getStockBoutiqueStats().catch(() => null),
    ]);
    const stats = {
      ...ventesStats,
      total_recettes: financeStats?.total_recettes ?? 0,
      total_depenses: financeStats?.total_depenses ?? 0,
      solde_net:      financeStats?.solde_net      ?? 0,
      stock_produits: stockStats?.total_produits   ?? 0,
      stock_epuises:  stockStats?.epuises          ?? 0,
    };
    res.json({ items, total, stats });
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
  try {
    const body = req.body;
    if (!body.client_nom || !body.items?.length) {
      return res.status(400).json({ error: "client_nom et items sont requis." });
    }
    const id = await createVenteWithStock({ ...body, admin_id: session.id });
    emitAdminEvent("vente");
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
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
  try {
    const { statut, statut_paiement, mode_paiement, montant_acompte, montant_paiement } = req.body;
    if (statut && !statut_paiement && !mode_paiement && montant_acompte === undefined) {
      await updateFactureStatut(Number(req.params.id), statut);
    } else {
      await updateFacture(Number(req.params.id), {
        statut, statut_paiement, mode_paiement, montant_acompte,
        montant_paiement: montant_paiement ? Number(montant_paiement) : undefined,
        admin_id: session.id,
      });
    }
    emitAdminEvent("vente");
    res.json({ ok: true, vendeur: session.nom });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/ventes/factures/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteFacture(Number(req.params.id));
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
    const { items, total } = await listDevis({ search, statut, limit, offset });
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
    const id = await createDevis({ ...body, admin_id: session.id });
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
    const { items, total } = await listLivraisons({ limit, offset });
    res.json({ items, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
