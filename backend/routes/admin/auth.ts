import express from "express";
import bcrypt from "bcryptjs";
import {
  getAdminByUsername, getAdminByEmail,
  updateAdminLastLogin, createAdminUser,
  getUtilisateurByUsername,
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

    // Fallback: check utilisateurs (operational team) by username
    if (!user) {
      const teamMember = await getUtilisateurByUsername(slug);
      if (teamMember) {
        const validTeam = await bcrypt.compare(password, teamMember.mot_de_passe);
        if (!validTeam) return res.status(401).json({ error: "Identifiants incorrects." });

        let permissions: AdminPermissions | null = null;
        if (teamMember.permissions) {
          try { permissions = JSON.parse(teamMember.permissions) as AdminPermissions; } catch { /* ignore */ }
        }

        const token = await signToken({
          id:          teamMember.id,
          username:    teamMember.username ?? slug,
          email:       teamMember.email,
          nom:         teamMember.nom,
          role:        "staff",
          permissions,
        });
        setAuthCookie(res, token);
        return res.json({ ok: true, nom: teamMember.nom, role: "staff" });
      }
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

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

// Temporary bootstrap endpoint — creates kent account if missing
// Protected by a static secret header; remove after first successful login
router.post("/api/admin/auth/bootstrap-kent", async (req, res) => {
  if (req.headers["x-bootstrap-secret"] !== "togolese-bootstrap-2025") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const pool = db as import("mysql2/promise").Pool;
    const KENT_HASH = "$2b$12$4ivze.K3jg8LW7j9RRuzReeqjR2xtXscmGkTbh7rceBFQMI7tcef.";

    const [rows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      "SELECT id, username, role FROM admin_users WHERE username = 'kent' LIMIT 1"
    );

    if ((rows as import("mysql2/promise").RowDataPacket[]).length) {
      await pool.execute(
        "UPDATE admin_users SET password_hash = ?, role = 'super_admin', actif = 1 WHERE username = 'kent'",
        [KENT_HASH]
      );
      return res.json({ ok: true, action: "updated", user: rows[0] });
    }

    const uniqueEmail = `kent.${Date.now()}@admin.local`;
    await pool.execute(
      "INSERT INTO admin_users (nom, username, email, poste, password_hash, role, actif) VALUES ('Kent','kent',?,'Administrateur',?,?,1)",
      [uniqueEmail, KENT_HASH, "super_admin"]
    );
    const [newRow] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      "SELECT id, username, role FROM admin_users WHERE username = 'kent' LIMIT 1"
    );
    return res.json({ ok: true, action: "created", user: (newRow as import("mysql2/promise").RowDataPacket[])[0] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
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
