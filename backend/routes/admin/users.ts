import express from "express";
import bcrypt from "bcryptjs";
import { getSession } from "../../lib/auth";
import {
  listAdminUsers, createAdminUser, updateAdminUser, updateAdminPassword,
} from "@/lib/admin-db";

const router = express.Router();

router.get("/api/admin/users", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (session.role !== "super_admin") return res.status(403).json({ error: "Accès refusé." });
  const users = await listAdminUsers();
  res.json({ users });
});

router.post("/api/admin/users", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (session.role !== "super_admin") return res.status(403).json({ error: "Accès refusé." });
  try {
    const { nom, email, password, role } = req.body;
    if (!nom || !email || !password) return res.status(400).json({ error: "Champs manquants." });
    const hash = await bcrypt.hash(password, 12);
    await createAdminUser({ nom, email: email.toLowerCase(), password_hash: hash, role: role || "staff" });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/users/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  if (session.role !== "super_admin" && session.id !== Number(req.params.id)) {
    return res.status(403).json({ error: "Accès refusé." });
  }
  try {
    const { password, ...rest } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await updateAdminPassword(Number(req.params.id), hash);
    }
    if (Object.keys(rest).length) {
      await updateAdminUser(Number(req.params.id), rest);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  res.json({ permissions: [] });
});

router.patch("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  res.json({ ok: true });
});

export default router;
