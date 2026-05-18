import express from "express";
import bcrypt from "bcryptjs";
import { getSession } from "../../lib/auth";
import {
  createLivreurInscription,
  listLivreurInscriptions,
  getLivreurInscriptionById,
  updateLivreurInscriptionStatut,
  createUtilisateur,
  ensureLivreurInscriptionsTable,
} from "@/lib/admin-db";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";

const router = express.Router();

async function requireAdmin(req: express.Request, res: express.Response) {
  const session = await getSession(req);
  if (!session) { res.status(401).json({ error: "Non autorisé." }); return null; }
  if (!["admin", "super_admin"].includes(session.role)) {
    res.status(403).json({ error: "Accès réservé aux admins." });
    return null;
  }
  return session;
}

// ── Public: submit inscription ────────────────────────────────────────────────
router.post("/api/livreur/inscription", async (req, res) => {
  try {
    await ensureLivreurInscriptionsTable();
    const { nom, telephone, numero_plaque, password } = req.body as Record<string, string>;
    if (!nom?.trim() || !telephone?.trim() || !password) {
      return res.status(400).json({ error: "Nom, téléphone et mot de passe requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    // Check if telephone already registered (pending or approved)
    const pool = db as mysql.Pool;
    const [existing] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id, statut FROM livreur_inscriptions WHERE telephone = ? LIMIT 1",
      [telephone.trim()]
    );
    if ((existing as mysql.RowDataPacket[]).length > 0) {
      const prev = (existing as mysql.RowDataPacket[])[0];
      if (prev.statut === "en_attente") {
        return res.status(409).json({ error: "Une demande avec ce numéro est déjà en attente de validation." });
      }
      if (prev.statut === "approuve") {
        return res.status(409).json({ error: "Ce numéro est déjà enregistré comme livreur." });
      }
      // rejected: allow re-apply
    }

    // Check if telephone already a utilisateur
    const [existingUser] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM utilisateurs WHERE telephone = ? AND actif = 1 LIMIT 1",
      [telephone.trim()]
    );
    if ((existingUser as mysql.RowDataPacket[]).length > 0) {
      return res.status(409).json({ error: "Ce numéro est déjà associé à un compte actif." });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = await createLivreurInscription({
      nom:           nom.trim(),
      telephone:     telephone.trim(),
      numero_plaque: numero_plaque?.trim() || undefined,
      password_hash: hash,
    });

    res.status(201).json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// ── Admin: list inscriptions ──────────────────────────────────────────────────
router.get("/api/admin/livreur-inscriptions", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const statut = typeof req.query.statut === "string" ? req.query.statut : undefined;
    const items = await listLivreurInscriptions(statut);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// ── Admin: approve ────────────────────────────────────────────────────────────
router.post("/api/admin/livreur-inscriptions/:id/approve", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const id = Number(req.params.id);
    const inscription = await getLivreurInscriptionById(id);
    if (!inscription) return res.status(404).json({ error: "Demande introuvable." });
    if (inscription.statut !== "en_attente") {
      return res.status(409).json({ error: "Cette demande a déjà été traitée." });
    }

    const note = String(req.body.note ?? "").trim() || null;

    // Create utilisateur account — username = telephone (lowercase)
    const username = inscription.telephone.toLowerCase().replace(/\s+/g, "");
    await createUtilisateur({
      nom:           inscription.nom,
      username,
      telephone:     inscription.telephone,
      numero_plaque: inscription.numero_plaque ?? undefined,
      poste:         "Livreur",
      motDePasse:    inscription.password_hash, // already hashed
      mustChangePassword: false,
    });

    await updateLivreurInscriptionStatut(id, "approuve", note ?? undefined);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

// ── Admin: reject ─────────────────────────────────────────────────────────────
router.post("/api/admin/livreur-inscriptions/:id/reject", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;
  try {
    const id = Number(req.params.id);
    const inscription = await getLivreurInscriptionById(id);
    if (!inscription) return res.status(404).json({ error: "Demande introuvable." });
    if (inscription.statut !== "en_attente") {
      return res.status(409).json({ error: "Cette demande a déjà été traitée." });
    }
    const note = String(req.body.note ?? "").trim() || null;
    await updateLivreurInscriptionStatut(id, "rejete", note ?? undefined);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
