import express from "express";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type mysql from "mysql2/promise";
import { getOrderEvents } from "@/lib/admin-db";
import {
  signClientToken, getClientSession,
  setClientCookie, clearClientCookie,
  type ClientPayload,
} from "../lib/client-auth";

const router = express.Router();

/* ─── Ensure client_users table exists ─── */
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await (db as import("mysql2/promise").Pool).execute(`
    CREATE TABLE IF NOT EXISTS client_users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      nom          VARCHAR(255) NOT NULL,
      email        VARCHAR(255) UNIQUE NULL,
      telephone    VARCHAR(50)  UNIQUE NULL,
      password_hash VARCHAR(255) NULL,
      photo_url    TEXT NULL,
      google_id    VARCHAR(255) UNIQUE NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}

/* ─── Helpers ─── */
function isEmail(s: string) { return s.includes("@"); }

async function findUser(identifier: string): Promise<mysql.RowDataPacket | null> {
  const pool = db as import("mysql2/promise").Pool;
  const field = isEmail(identifier) ? "email" : "telephone";
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM client_users WHERE ${field} = ? LIMIT 1`,
    [identifier.trim().toLowerCase()]
  );
  return rows[0] ?? null;
}

function toPayload(row: mysql.RowDataPacket): ClientPayload {
  return {
    id:        row.id,
    nom:       row.nom,
    email:     row.email    ?? null,
    telephone: row.telephone ?? null,
    photo_url: row.photo_url ?? null,
  };
}

/* ──────────────────────────────────────────────
   POST /api/account/register
────────────────────────────────────────────── */
router.post("/api/account/register", async (req, res) => {
  try {
    await ensureTable();
    const { nom, identifier, password } = req.body as Record<string, string>;

    if (!nom?.trim() || !identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Nom, identifiant et mot de passe requis." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const existing = await findUser(identifier);
    if (existing) {
      return res.status(409).json({ error: "Ce compte existe déjà. Connectez-vous." });
    }

    const hash  = await bcrypt.hash(password.trim(), 12);
    const field = isEmail(identifier) ? "email" : "telephone";
    const pool  = db as import("mysql2/promise").Pool;

    const [result] = await pool.execute<mysql.OkPacket>(
      `INSERT INTO client_users (nom, ${field}, password_hash) VALUES (?, ?, ?)`,
      [nom.trim(), identifier.trim().toLowerCase(), hash]
    );

    const user: ClientPayload = {
      id:        result.insertId,
      nom:       nom.trim(),
      email:     field === "email"      ? identifier.trim().toLowerCase() : null,
      telephone: field === "telephone"  ? identifier.trim().toLowerCase() : null,
      photo_url: null,
    };

    const token = await signClientToken(user);
    setClientCookie(res, token);
    return res.json({ user });
  } catch (err) {
    console.error("[account/register]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   POST /api/account/login
────────────────────────────────────────────── */
router.post("/api/account/login", async (req, res) => {
  try {
    await ensureTable();
    const { identifier, password } = req.body as Record<string, string>;

    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis." });
    }

    const user = await findUser(identifier);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const ok = await bcrypt.compare(password.trim(), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    const payload = toPayload(user);
    const token   = await signClientToken(payload);
    setClientCookie(res, token);
    return res.json({ user: payload });
  } catch (err) {
    console.error("[account/login]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   GET /api/account/me
────────────────────────────────────────────── */
router.get("/api/account/me", async (req, res) => {
  try {
    await ensureTable();
    const session = await getClientSession(req);
    if (!session) return res.json({ user: null });

    /* Refresh from DB to get latest data */
    const pool = db as import("mysql2/promise").Pool;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    if (!rows[0]) return res.json({ user: null });

    return res.json({ user: toPayload(rows[0]) });
  } catch (err) {
    console.error("[account/me]", err);
    return res.json({ user: null });
  }
});

/* ──────────────────────────────────────────────
   POST /api/account/logout
────────────────────────────────────────────── */
router.post("/api/account/logout", (_req, res) => {
  clearClientCookie(res);
  return res.json({ ok: true });
});

/* ──────────────────────────────────────────────
   GET /api/account/google  — OAuth initiation
────────────────────────────────────────────── */
router.get("/api/account/google", (_req, res) => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(503).json({ error: "Google OAuth non configuré." });
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "online",
    prompt:        "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

/* ──────────────────────────────────────────────
   GET /api/account/google/callback
────────────────────────────────────────────── */
router.get("/api/account/google/callback", async (req, res) => {
  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003";

  try {
    await ensureTable();
    const code = req.query.code as string | undefined;
    if (!code) return res.redirect(`${siteUrl}/?auth_error=no_code`);

    const clientId     = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI!;

    /* Exchange auth code for tokens */
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      console.error("[google/callback] token exchange failed:", tokenData);
      return res.redirect(`${siteUrl}/?auth_error=token_failed`);
    }

    /* Get Google user info */
    const infoRes  = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = await infoRes.json() as {
      id: string; email: string; name: string; picture?: string;
    };

    if (!info.id || !info.email) {
      return res.redirect(`${siteUrl}/?auth_error=no_profile`);
    }

    const pool = db as import("mysql2/promise").Pool;

    /* Find existing user by google_id or email */
    const [byGoogle] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM client_users WHERE google_id = ? LIMIT 1", [info.id]
    );
    let dbUser = byGoogle[0];

    if (!dbUser) {
      const [byEmail] = await pool.execute<mysql.RowDataPacket[]>(
        "SELECT * FROM client_users WHERE email = ? LIMIT 1",
        [info.email.toLowerCase()]
      );
      if (byEmail[0]) {
        /* Link Google ID to existing email account */
        await pool.execute(
          "UPDATE client_users SET google_id = ?, photo_url = COALESCE(photo_url, ?) WHERE id = ?",
          [info.id, info.picture ?? null, byEmail[0].id]
        );
        dbUser = { ...byEmail[0], google_id: info.id };
      } else {
        /* Create new account */
        const [result] = await pool.execute<mysql.OkPacket>(
          "INSERT INTO client_users (nom, email, google_id, photo_url) VALUES (?, ?, ?, ?)",
          [info.name, info.email.toLowerCase(), info.id, info.picture ?? null]
        );
        dbUser = {
          id:        result.insertId,
          nom:       info.name,
          email:     info.email.toLowerCase(),
          telephone: null,
          photo_url: info.picture ?? null,
          google_id: info.id,
        };
      }
    }

    const payload = toPayload(dbUser);
    const token   = await signClientToken(payload);
    setClientCookie(res, token);
    return res.redirect(`${siteUrl}/account`);
  } catch (err) {
    console.error("[google/callback]", err);
    const siteUrl2 = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003";
    return res.redirect(`${siteUrl2}/?auth_error=server`);
  }
});

/* ──────────────────────────────────────────────
   GET /api/account/orders  — commandes du client connecté
────────────────────────────────────────────── */
router.get("/api/account/orders", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connecté." });

    const pool = db as import("mysql2/promise").Pool;
    const [userRows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT telephone FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    const telephone = userRows[0]?.telephone as string | null;

    // Ensure client_user_id column exists
    try {
      await pool.execute("ALTER TABLE orders ADD COLUMN client_user_id INT NULL");
    } catch (e: any) { if (e?.code !== "ER_DUP_FIELDNAME") throw e; }

    const conditions: string[] = ["client_user_id = ?"];
    const params: (string | number)[] = [session.id];
    if (telephone) {
      conditions.push("telephone = ?");
      params.push(telephone);
    }

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, total, subtotal, delivery_fee,
              status, items, adresse, zone_livraison, created_at
       FROM orders WHERE ${conditions.join(" OR ")} ORDER BY created_at DESC`,
      params
    );
    return res.json({ orders: rows });
  } catch (err) {
    console.error("[account/orders]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   GET /api/account/orders/:ref  — détail d'une commande
────────────────────────────────────────────── */
router.get("/api/account/orders/:ref", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connecté." });

    const pool = db as import("mysql2/promise").Pool;
    const [userRows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT telephone FROM client_users WHERE id = ? LIMIT 1",
      [session.id]
    );
    const telephone = userRows[0]?.telephone as string | null;

    const [orderRows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM orders WHERE reference = ? LIMIT 1",
      [req.params.ref]
    );
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: "Commande introuvable." });

    if (telephone && order.telephone !== telephone) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const events = await getOrderEvents(order.id as number);

    // Attach payment plan if exists
    let paymentPlan = null;
    try {
      const { getPaymentPlanByOrderId } = await import("@/lib/admin-db");
      paymentPlan = await getPaymentPlanByOrderId(order.id as number);
    } catch { /* no plan */ }

    return res.json({ order, events, paymentPlan });
  } catch (err) {
    console.error("[account/orders/:ref]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ─── Verification table setup ─── */
let verifTableReady = false;
async function ensureVerifTable() {
  if (verifTableReady) return;
  const pool = db as import("mysql2/promise").Pool;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS account_verifications (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      id_card_url TEXT NOT NULL,
      selfie_url  TEXT NOT NULL,
      statut      ENUM('en_attente','verifie','rejete') DEFAULT 'en_attente',
      note_admin  TEXT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await pool.execute("ALTER TABLE client_users ADD COLUMN verifie TINYINT NOT NULL DEFAULT 0");
  } catch { /* column already exists */ }
  verifTableReady = true;
}

/* ──────────────────────────────────────────────
   GET /api/account/verification
────────────────────────────────────────────── */
router.get("/api/account/verification", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connecté." });
    await ensureVerifTable();
    const pool = db as import("mysql2/promise").Pool;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT statut, note_admin FROM account_verifications WHERE user_id = ? LIMIT 1",
      [session.id]
    );
    if (!rows[0]) return res.json({ statut: null });
    return res.json({ statut: rows[0].statut as string, note_admin: rows[0].note_admin ?? null });
  } catch (err) {
    console.error("[account/verification GET]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   POST /api/account/verification
────────────────────────────────────────────── */
router.post("/api/account/verification", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non connecté." });
    await ensureVerifTable();

    const { id_card, selfie } = req.body as {
      id_card?: { data: string; type: string };
      selfie?:  { data: string; type: string };
    };
    if (!id_card?.data || !selfie?.data) {
      return res.status(400).json({ error: "Les deux photos sont requises." });
    }

    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    async function uploadImg(b64: string): Promise<string> {
      const buffer = Buffer.from(b64.replace(/^data:[^;]+;base64,/, ""), "base64");
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "togolese-shop/verifications", resource_type: "image" },
          (err, result) => (err || !result ? reject(err) : resolve(result.secure_url))
        );
        stream.end(buffer);
      });
    }

    const [idCardUrl, selfieUrl] = await Promise.all([
      uploadImg(id_card.data),
      uploadImg(selfie.data),
    ]);

    const pool = db as import("mysql2/promise").Pool;
    await pool.execute(
      `INSERT INTO account_verifications (user_id, id_card_url, selfie_url, statut)
       VALUES (?, ?, ?, 'en_attente')
       ON DUPLICATE KEY UPDATE
         id_card_url = VALUES(id_card_url),
         selfie_url  = VALUES(selfie_url),
         statut      = 'en_attente',
         note_admin  = NULL`,
      [session.id, idCardUrl, selfieUrl]
    );

    return res.json({ ok: true, statut: "en_attente" });
  } catch (err) {
    console.error("[account/verification POST]", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi des documents." });
  }
});

/* ──────────────────────────────────────────────
   client_addresses — auto-create table
────────────────────────────────────────────── */
let addressTableReady = false;
async function ensureAddressTable() {
  if (addressTableReady) return;
  await (db as import("mysql2/promise").Pool).execute(`
    CREATE TABLE IF NOT EXISTS client_addresses (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      client_user_id  INT NOT NULL,
      nom             VARCHAR(255) NOT NULL,
      telephone       VARCHAR(50)  NOT NULL,
      adresse         VARCHAR(500) NOT NULL,
      zone_livraison  VARCHAR(255) NOT NULL,
      is_default      TINYINT(1) DEFAULT 0,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (client_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  addressTableReady = true;
}

/* ──────────────────────────────────────────────
   GET /api/account/addresses
────────────────────────────────────────────── */
router.get("/api/account/addresses", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    await ensureAddressTable();
    const pool = db as import("mysql2/promise").Pool;
    const [rows] = await pool.execute<import("mysql2/promise").RowDataPacket[]>(
      "SELECT * FROM client_addresses WHERE client_user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 20",
      [session.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   POST /api/account/addresses
────────────────────────────────────────────── */
router.post("/api/account/addresses", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    await ensureAddressTable();

    const { nom, telephone, adresse, zone_livraison, is_default } = req.body;
    if (!nom?.trim() || !telephone?.trim() || !adresse?.trim() || !zone_livraison?.trim()) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const pool = db as import("mysql2/promise").Pool;

    // If this is set as default, unset all others
    if (is_default) {
      await pool.execute(
        "UPDATE client_addresses SET is_default = 0 WHERE client_user_id = ?",
        [session.id]
      );
    }

    const [result] = await pool.execute<import("mysql2/promise").OkPacket>(
      `INSERT INTO client_addresses (client_user_id, nom, telephone, adresse, zone_livraison, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.id, nom.trim(), telephone.trim(), adresse.trim(), zone_livraison.trim(), is_default ? 1 : 0]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

/* ──────────────────────────────────────────────
   DELETE /api/account/addresses/:id
────────────────────────────────────────────── */
router.delete("/api/account/addresses/:id", async (req, res) => {
  try {
    const session = await getClientSession(req);
    if (!session) return res.status(401).json({ error: "Non autorisé." });
    const pool = db as import("mysql2/promise").Pool;
    await pool.execute(
      "DELETE FROM client_addresses WHERE id = ? AND client_user_id = ?",
      [Number(req.params.id), session.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erreur serveur." });
  }
});

export default router;
