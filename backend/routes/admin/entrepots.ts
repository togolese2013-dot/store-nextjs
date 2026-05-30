import express from "express";
import { getSession } from "../../lib/auth";
import { hasPageAccess } from "@/lib/admin-permissions";
import { ensureEntrepotsTable, listEntrepots, upsertEntrepot, deleteEntrepot } from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const entrepots = await listEntrepots(session.shop_id ?? 1);
    res.json({ entrepots });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.post("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  const { id, nom, telephone, adresse, notes, actif } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom obligatoire." });
  try {
    const newId = await upsertEntrepot({ id: id ? Number(id) : undefined, nom: nom.trim(), telephone: telephone || null, adresse: adresse || null, notes: notes || null, actif: actif !== false }, session.shop_id ?? 1);
    res.json({ ok: true, id: newId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/entrepots/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role) &&
      !hasPageAccess(session.role, session.permissions, "magasin", "entrepots")) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    await deleteEntrepot(Number(req.params.id), session.shop_id ?? 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export { ensureEntrepotsTable };
export default router;
