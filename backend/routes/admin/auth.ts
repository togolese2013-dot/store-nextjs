import express from "express";
import bcrypt from "bcryptjs";
import {
  getAdminByUsername, getAdminByEmail,
  updateAdminLastLogin, createAdminUser,
} from "@/lib/admin-db";
import { db } from "@/lib/db";
import { signToken, getSession, setAuthCookie, clearAuthCookie } from "../../lib/auth";
import type { AdminPermissions } from "@/lib/admin-permissions";
import type mysql from "mysql2/promise";

const router = express.Router();

router.post("/api/admin/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
    }

    const slug = (username as string).trim().toLowerCase();

    // Try username first, then email fallback for existing accounts
    let user = await getAdminByUsername(slug)
      ?? await getAdminByEmail(slug);

    if (!user) {
      // Bootstrap: create the first super_admin if table is empty
      const [rows] = await (db as import("mysql2/promise").Pool).execute<mysql.RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM admin_users"
      );
      if (Number(rows[0]?.cnt) === 0) {
        const hash = await bcrypt.hash(password, 12);
        await createAdminUser({
          nom:           "Admin",
          username:      slug,
          email:         null,
          password_hash: hash,
          role:          "super_admin",
        });
        user = await getAdminByUsername(slug);
      }
    }

    if (!user) return res.status(401).json({ error: "Identifiants incorrects." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Identifiants incorrects." });

    let permissions: AdminPermissions | null = null;
    if (user.permissions) {
      try { permissions = JSON.parse(user.permissions) as AdminPermissions; } catch { /* ignore */ }
    }

    const token = await signToken({
      id:          user.id,
      username:    user.username,
      email:       user.email,
      nom:         user.nom,
      role:        user.role,
      permissions,
    });
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
