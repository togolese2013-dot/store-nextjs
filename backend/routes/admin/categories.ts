import express from "express";
import { getSession } from "../../lib/auth";
import {
  listAdminCategories, createCategory, updateCategory, deleteCategory,
  listAdminMarques, createMarque, updateMarque, deleteMarque,
  listEntrepots, createEntrepot, updateEntrepot, deleteEntrepot,
} from "@/lib/admin-db";

const router = express.Router();

// ── Categories ────────────────────────────────────────────────────────────
router.get("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const categories = await listAdminCategories();
  res.json({ success: true, data: categories });
});

router.post("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) return res.status(403).json({ error: "Droits insuffisants." });
  const { nom, description = "" } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createCategory(nom.trim(), description.trim());
  res.json({ success: true, id });
});

router.patch("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await updateCategory(Number(req.params.id), req.body);
  res.json({ success: true });
});

router.delete("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteCategory(Number(req.params.id));
  res.json({ success: true });
});

// ── Marques ───────────────────────────────────────────────────────────────
router.get("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const marques = await listAdminMarques();
  res.json({ success: true, data: marques });
});

router.post("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, description = "" } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createMarque({ nom: nom.trim(), description: description.trim() });
  res.json({ success: true, id });
});

router.patch("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await updateMarque(Number(req.params.id), req.body);
  res.json({ success: true });
});

router.delete("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteMarque(Number(req.params.id));
  res.json({ success: true });
});

// ── Entrepots ─────────────────────────────────────────────────────────────
router.get("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const entrepots = await listEntrepots();
    res.json({ entrepots });
  } catch { res.json({ entrepots: [] }); }
});

router.post("/api/admin/entrepots", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  try {
    const id = await createEntrepot(req.body);
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/entrepots/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await updateEntrepot(Number(req.params.id), req.body);
  res.json({ ok: true });
});

router.delete("/api/admin/entrepots/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteEntrepot(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
