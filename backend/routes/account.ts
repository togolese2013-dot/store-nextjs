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
    if (!telephone) return res.json({ orders: [] });

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, total, subtotal, delivery_fee,
              status, items, adresse, zone_livraison, created_at
       FROM orders WHERE telephone = ? ORDER BY created_at DESC`,
      [telephone]
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
    return res.json({ order, events });
  } catch (err) {
    console.error("[account/orders/:ref]", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
