import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listTransferRequests, createTransferRequest, getTransferRequestById,
  resolveTransferRequest, createStockSortie,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/transfer-requests", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const status = req.query.status as "pending" | "approved" | "rejected" | undefined;
    const requests = await listTransferRequests(session.shop_id ?? 1, status);
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.post("/api/admin/transfer-requests", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { produit_id, produit_nom, reference_sku, quantite, note } = req.body;
  if (!produit_id || !produit_nom?.trim() || !quantite || Number(quantite) <= 0) {
    return res.status(400).json({ error: "produit_id, produit_nom et quantite (> 0) requis." });
  }
  try {
    const shopId = session.shop_id ?? 1;
    const id = await createTransferRequest({
      shop_id:       shopId,
      produit_id:    Number(produit_id),
      produit_nom:   produit_nom.trim(),
      reference_sku: reference_sku ?? null,
      quantite:      Number(quantite),
      note:          note ?? null,
      requested_by:  session.nom ?? session.username ?? "Boutique",
    });
    emitAdminEvent("transfer_request");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.post("/api/admin/transfer-requests/:id/approve", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const shopId = session.shop_id ?? 1;
    const reqRow = await getTransferRequestById(Number(req.params.id), shopId);
    if (!reqRow) return res.status(404).json({ error: "Demande introuvable." });
    if (reqRow.status !== "pending") return res.status(400).json({ error: "Demande déjà traitée." });

    await createStockSortie({
      produit_id: reqRow.produit_id,
      quantite:   reqRow.quantite,
      reference:  reqRow.reference_sku ?? undefined,
      note:       `Transfert demande #${reqRow.id}${reqRow.note ? " — " + reqRow.note : ""}`,
      user_id:    session.id,
    });
    await resolveTransferRequest(reqRow.id, shopId, "approved");
    emitAdminEvent("stock");
    emitAdminEvent("stock_transfer");
    emitAdminEvent("transfer_request");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

router.post("/api/admin/transfer-requests/:id/reject", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const shopId = session.shop_id ?? 1;
    const reqRow = await getTransferRequestById(Number(req.params.id), shopId);
    if (!reqRow) return res.status(404).json({ error: "Demande introuvable." });
    if (reqRow.status !== "pending") return res.status(400).json({ error: "Demande déjà traitée." });

    await resolveTransferRequest(reqRow.id, shopId, "rejected");
    emitAdminEvent("transfer_request");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
