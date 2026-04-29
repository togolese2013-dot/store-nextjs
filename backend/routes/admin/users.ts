import express from "express";
import bcrypt from "bcryptjs";
import { getSession } from "../../lib/auth";
import {
  listAdminUsers, createAdminUser, updateAdminUser,
  updateAdminPassword, deleteAdminUser, getAdminByUsername, getAdminById,
  listUtilisateurs, createUtilisateur, updateUtilisateur, deleteUtilisateur,
  getUtilisateurById, listPermissions,
} from "@/lib/admin-db";

const router = express.Router();

// ── Helper: super_admin only ──────────────────────────────────────────────────
// Falls back to a DB role check in case the JWT was issued by older code
// that stored a different role field name or value.

async function requireSuperAdmin(req: express.Request, res: express.Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Non autorisé." }); return null; }

  if (session.role !== "super_admin") {
    // JWT role may be stale — verify against DB
    try {
      const dbUser = await getAdminById(session.id);
      if (!dbUser || dbUser.role !== "super_admin") {
        res.status(403).json({ error: "Accès réservé au super admin." });
        return null;
      }
    } catch {
      res.status(403).json({ error: "Accès réservé au super admin." });
      return null;
    }
  }

  return session;
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ACCOUNTS — /api/admin/users  (table admin_users)
// ═════════════════════════════════════════════════════════════════════════════

router.get("/api/admin/users", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const users = await listAdminUsers();
  res.json({ users });
});

router.post("/api/admin/users", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { nom, username, email, telephone, poste, password, role } = req.body as Record<string, string>;
    if (!nom || !username || !password) {
      return res.status(400).json({ error: "Nom, nom d'utilisateur et mot de passe requis." });
    }

    // Check username uniqueness
    const existing = await getAdminByUsername(username.trim().toLowerCase());
    if (existing) return res.status(409).json({ error: "Ce nom d'utilisateur est déjà utilisé." });

    const hash = await bcrypt.hash(password, 12);
    await createAdminUser({
      nom,
      username:             username.trim().toLowerCase(),
      email:                email || null,
      telephone:            telephone || null,
      poste:                poste || "staff",
      password_hash:        hash,
      role:                 role === "super_admin" ? "super_admin" : poste === "Livreur" ? "livreur" : "admin",
      must_change_password: true,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/users/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  const targetId = Number(req.params.id);
  const isSelf   = session.id === targetId;
  const isSuperAdmin = session.role === "super_admin";

  if (!isSuperAdmin && !isSelf) return res.status(403).json({ error: "Accès refusé." });

  try {
    const { password, permissions, ...rest } = req.body as Record<string, unknown>;

    if (password) {
      const hash = await bcrypt.hash(String(password), 12);
      await updateAdminPassword(targetId, hash);
    }

    // Non-super_admin can only change their own password
    if (isSuperAdmin) {
      const updateData: Parameters<typeof updateAdminUser>[1] = {};
      if (rest.nom       !== undefined) updateData.nom       = String(rest.nom);
      if (rest.username  !== undefined) updateData.username  = String(rest.username).trim().toLowerCase();
      if (rest.email     !== undefined) updateData.email     = rest.email ? String(rest.email) : null;
      if (rest.telephone !== undefined) updateData.telephone = rest.telephone ? String(rest.telephone) : null;
      if (rest.poste     !== undefined) updateData.poste     = String(rest.poste);
      if (rest.role      !== undefined) updateData.role      = String(rest.role);
      if (rest.actif     !== undefined) updateData.actif     = Boolean(rest.actif);
      if (permissions    !== undefined) updateData.permissions = permissions ? JSON.stringify(permissions) : null;

      if (Object.keys(updateData).length) await updateAdminUser(targetId, updateData);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/users/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;

  const targetId = Number(req.params.id);
  if (targetId === session.id) return res.status(400).json({ error: "Impossible de se supprimer soi-même." });

  try {
    await deleteAdminUser(targetId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// Permissions routes for admin_users
router.get("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const { listAdminUsers: list } = await import("@/lib/admin-db");
  const users = await list();
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  let perms = null;
  if (user.permissions) { try { perms = JSON.parse(user.permissions); } catch { /* ignore */ } }
  res.json({ permissions: perms });
});

router.put("/api/admin/users/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { permissions } = req.body as { permissions: unknown };
    await updateAdminUser(Number(req.params.id), {
      permissions: permissions ? JSON.stringify(permissions) : null,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TEAM MEMBERS — /api/admin/team  (table utilisateurs)
// ═════════════════════════════════════════════════════════════════════════════

router.get("/api/admin/team", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const [utilisateurs, permissions] = await Promise.all([listUtilisateurs(), listPermissions()]);
  res.json({ utilisateurs, permissions });
});

router.post("/api/admin/team", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { nom, poste, email, telephone, username, motDePasse } = req.body as Record<string, string>;
    if (!nom || !poste || !motDePasse) return res.status(400).json({ error: "Champs manquants." });
    const hash = await bcrypt.hash(motDePasse, 12);
    const id = await createUtilisateur({ nom, poste, email, telephone, username: username?.trim().toLowerCase() || undefined, motDePasse: hash, mustChangePassword: true });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.patch("/api/admin/team/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { motDePasse, ...rest } = req.body as Record<string, unknown>;
    const data: Parameters<typeof updateUtilisateur>[1] = {};
    if (rest.nom       !== undefined) data.nom       = String(rest.nom);
    if (rest.username  !== undefined) data.username  = rest.username ? String(rest.username).trim().toLowerCase() : undefined;
    if (rest.email     !== undefined) data.email     = rest.email ? String(rest.email) : undefined;
    if (rest.telephone !== undefined) data.telephone = rest.telephone ? String(rest.telephone) : undefined;
    if (rest.poste     !== undefined) data.poste     = String(rest.poste);
    if (rest.actif     !== undefined) data.actif     = Number(rest.actif);
    if (motDePasse)                   data.motDePasse = await bcrypt.hash(String(motDePasse), 12);
    await updateUtilisateur(Number(req.params.id), data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.delete("/api/admin/team/:id", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    await deleteUtilisateur(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

router.get("/api/admin/team/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  const user = await getUtilisateurById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Introuvable." });
  let perms = null;
  if (user.permissions) { try { perms = JSON.parse(user.permissions); } catch { /* ignore */ } }
  res.json({ permissions: perms });
});

router.put("/api/admin/team/:id/permissions", async (req, res) => {
  const session = await requireSuperAdmin(req, res);
  if (!session) return;
  try {
    const { permissions } = req.body as { permissions: unknown };
    await updateUtilisateur(Number(req.params.id), {
      permissions: permissions ? JSON.stringify(permissions) : null,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
