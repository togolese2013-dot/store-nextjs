import express from "express";
import bcrypt from "bcryptjs";
import { getAdminByEmail, updateAdminLastLogin, createAdminUser } from "@/lib/admin-db";
import { db } from "@/lib/db";
import { signToken, getSession, setAuthCookie, clearAuthCookie } from "../../lib/auth";
import type mysql from "mysql2/promise";

const router = express.Router();

router.post("/api/admin/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    let user = await getAdminByEmail(email.trim().toLowerCase());

    if (!user) {
      const [rows] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM admin_users"
      );
      if (Number(rows[0]?.cnt) === 0) {
        const hash = await bcrypt.hash(password, 12);
        await createAdminUser({ nom: "Admin", email: email.trim().toLowerCase(), password_hash: hash, role: "super_admin" });
        user = await getAdminByEmail(email.trim().toLowerCase());
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const token = await signToken({ id: user.id, email: user.email, nom: user.nom, role: user.role });
    await updateAdminLastLogin(user.id);
    setAuthCookie(res, token);
    return res.json({ ok: true, nom: user.nom, role: user.role });
  } catch (err) {
    console.error("[admin login]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

router.post("/api/admin/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/api/admin/auth/me", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });
  res.json({ ok: true, ...session });
});

export default router;
