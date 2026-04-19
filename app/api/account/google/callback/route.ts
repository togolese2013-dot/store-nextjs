import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { signClientToken, CLIENT_COOKIE } from "@/lib/client-auth";

type ClientRow = RowDataPacket & {
  id:        number;
  nom:       string;
  email:     string | null;
  telephone: string | null;
  photo_url: string | null;
  google_id: string | null;
};

async function ensureColumns() {
  for (const sql of [
    "ALTER TABLE clients ADD COLUMN password VARCHAR(255)",
    "ALTER TABLE clients ADD COLUMN photo_url VARCHAR(512)",
    "ALTER TABLE clients ADD COLUMN google_id VARCHAR(255)",
  ]) {
    try { await db.execute(sql); } catch { /* already exists */ }
  }
  // telephone was originally NOT NULL — allow NULL for Google-only accounts
  try {
    await db.execute("ALTER TABLE clients MODIFY COLUMN telephone VARCHAR(20) NULL");
  } catch { /* already nullable */ }
}

interface GoogleUser {
  sub:            string;
  email:          string;
  name:           string;
  picture?:       string;
  email_verified: boolean;
}

export async function GET(req: NextRequest) {
  // Strip trailing slash to avoid double-slash in redirect_uri
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const code    = req.nextUrl.searchParams.get("code");
  const error   = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    console.error("[google-callback] OAuth error from Google:", error ?? "no code");
    return NextResponse.redirect(`${siteUrl}/?auth=error`);
  }

  try {
    await ensureColumns();

    // Exchange code for access token
    const redirectUri = `${siteUrl}/api/account/google/callback`;
    const tokenRes    = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      console.error("[google-callback] Token exchange failed:", tokenData.error, tokenData.error_description);
      console.error("[google-callback] redirect_uri used:", redirectUri);
      return NextResponse.redirect(`${siteUrl}/?auth=error`);
    }

    // Get Google user info
    const userRes    = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json() as GoogleUser;

    if (!googleUser.email) {
      console.error("[google-callback] No email in Google user info:", googleUser);
      return NextResponse.redirect(`${siteUrl}/?auth=error`);
    }

    // 1. Find by google_id
    let [rows] = await db.execute<ClientRow[]>(
      "SELECT * FROM clients WHERE google_id = ? LIMIT 1",
      [googleUser.sub]
    );
    let client = rows[0] ?? null;

    if (!client) {
      // 2. Find by email — link Google account
      [rows] = await db.execute<ClientRow[]>(
        "SELECT * FROM clients WHERE email = ? LIMIT 1",
        [googleUser.email.toLowerCase()]
      );
      client = rows[0] ?? null;

      if (client) {
        await db.execute(
          "UPDATE clients SET google_id = ?, photo_url = COALESCE(photo_url, ?) WHERE id = ?",
          [googleUser.sub, googleUser.picture ?? null, client.id]
        );
        client.google_id = googleUser.sub;
        client.photo_url = client.photo_url ?? googleUser.picture ?? null;
      } else {
        // 3. Create new client
        const [result] = await db.execute<ResultSetHeader>(
          "INSERT INTO clients (nom, email, google_id, photo_url, statut) VALUES (?, ?, ?, ?, 'normal')",
          [
            googleUser.name || googleUser.email,
            googleUser.email.toLowerCase(),
            googleUser.sub,
            googleUser.picture ?? null,
          ]
        );
        client = {
          id:        result.insertId,
          nom:       googleUser.name || googleUser.email,
          email:     googleUser.email.toLowerCase(),
          telephone: null,
          google_id: googleUser.sub,
          photo_url: googleUser.picture ?? null,
        } as ClientRow;
      }
    }

    const session = {
      id:        client.id,
      nom:       client.nom ?? "",
      email:     client.email ?? null,
      telephone: client.telephone ?? null,
      photo_url: client.photo_url ?? null,
    };

    const token = await signClientToken(session);
    const res   = NextResponse.redirect(`${siteUrl}/account`);
    res.cookies.set(CLIENT_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30,
      path:     "/",
    });
    return res;
  } catch (err) {
    console.error("[google-callback] Unexpected error:", err);
    return NextResponse.redirect(`${siteUrl}/?auth=error`);
  }
}
