import express from "express";
import { getSession } from "../../lib/auth";
import { emitAdminEvent } from "../../lib/admin-events";
import {
  listFinanceEntries, getFinanceStats, createFinanceEntry,
  updateFinanceEntry, deleteFinanceEntry,
} from "@/lib/admin-db";
import { db } from "@/lib/db";

const router = express.Router();

router.get("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const type   = (req.query.type as string) || undefined;
    const search = (req.query.q as string)    || undefined;
    const limit  = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0,   Number(req.query.offset) || 0);
    const [{ items, total }, stats] = await Promise.all([
      listFinanceEntries({ type, search, limit, offset }),
      getFinanceStats(),
    ]);
    res.json({ items, total, stats });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const { type, mode_paiement, compte_destination, categorie, description, montant, date_entree } = req.body;
    if (!type || !montant || !date_entree) {
      return res.status(400).json({ error: "type, montant et date_entree sont requis." });
    }
    if (type === "transfert" && !compte_destination) {
      return res.status(400).json({ error: "compte_destination requis pour un transfert." });
    }
    const admin_id  = typeof session.id === "number" ? session.id : undefined;
    const admin_nom = typeof session.nom === "string" ? session.nom : undefined;
    const id = await createFinanceEntry({ type, mode_paiement, compte_destination, categorie, description, montant: Number(montant), date_entree, admin_id, admin_nom });
    emitAdminEvent("finance");
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await updateFinanceEntry(Number(req.params.id), req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/finance/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await deleteFinanceEntry(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

/* ── Migration one-shot : récupère les finance_entries Mix by Yas manquantes */
export async function recoverMixByYasEntries() {
  try {
    const [rows] = await db.execute<import("mysql2/promise").RowDataPacket[]>(`
      SELECT fp.montant, fp.created_at, f.reference, f.client_nom
      FROM facture_paiements fp
      JOIN factures f ON f.id = fp.facture_id
      WHERE fp.mode_paiement = 'mix_by_yas'
        AND NOT EXISTS (
          SELECT 1 FROM finance_entries fe
          WHERE fe.description LIKE CONCAT('%', CONVERT(f.reference USING utf8mb4) COLLATE utf8mb4_unicode_ci, '%')
            AND fe.mode_paiement = 'mix_by_yas'
        )
    `);
    for (const row of rows) {
      await createFinanceEntry({
        type:          "vente",
        mode_paiement: "mix_by_yas",
        categorie:     "Vente boutique",
        description:   `Paiement ${row.reference} – ${row.client_nom}`,
        montant:       Number(row.montant),
        date_entree:   new Date(row.created_at).toISOString().slice(0, 10),
      });
    }
    console.log(`[finance] recoverMixByYas: ${rows.length} entrée(s) trouvée(s) et récupérée(s).`);
  } catch (err) {
    console.error("[finance/recoverMixByYas]", err);
  }
}

router.delete("/api/admin/finance", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    await db.execute("TRUNCATE TABLE finance_entries");
    emitAdminEvent("finance");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
