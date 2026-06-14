import express from "express";
import { getSession } from "../../lib/auth";
import {
  listAdminCategories, createCategory, updateCategory, deleteCategory,
  listAdminMarques, createMarque, updateMarque, deleteMarque,
} from "@/lib/admin-db";

const router = express.Router();

// ── Categories ────────────────────────────────────────────────────────────
router.get("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const categories = await listAdminCategories(session.shop_id ?? 1);
  res.json({ success: true, data: categories });
});

router.post("/api/admin/categories", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (!["super_admin", "admin"].includes(session.role)) return res.status(403).json({ error: "Droits insuffisants." });
  const { nom, description = "", color } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createCategory(nom.trim(), description.trim(), session.shop_id ?? 1, color ?? null);
  res.json({ success: true, id });
});

router.patch("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, description = "", color } = req.body;
  await updateCategory(Number(req.params.id), nom?.trim() ?? "", description?.trim() ?? "", session.shop_id ?? 1, color ?? undefined);
  res.json({ success: true });
});

router.delete("/api/admin/categories/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteCategory(Number(req.params.id), session.shop_id ?? 1);
  res.json({ success: true });
});

// ── Marques ───────────────────────────────────────────────────────────────
router.get("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const marques = await listAdminMarques(session.shop_id ?? 1);
  res.json({ success: true, data: marques });
});

router.post("/api/admin/marques", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  const { nom, description = "" } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: "Nom requis." });
  const id = await createMarque({ nom: nom.trim(), description: description.trim() }, session.shop_id ?? 1);
  res.json({ success: true, id });
});

router.patch("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await updateMarque(Number(req.params.id), req.body, session.shop_id ?? 1);
  res.json({ success: true });
});

router.delete("/api/admin/marques/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  await deleteMarque(Number(req.params.id), session.shop_id ?? 1);
  res.json({ success: true });
});

export default router;
