import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signClientToken, CLIENT_COOKIE } from "@/lib/client-auth";

async function ensureColumns() {
  for (const sql of [
    "ALTER TABLE clients ADD COLUMN password VARCHAR(255)",
    "ALTER TABLE clients ADD COLUMN photo_url VARCHAR(512)",
    "ALTER TABLE clients ADD COLUMN google_id VARCHAR(255)",
  ]) {
    try { await db.execute(sql); } catch { /* column already exists */ }
  }
}

interface GoogleUser {
  sub:            string;
  email:          string;
  name:           string;
  picture?:       string;
  email_verified: boolean;
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const code    = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/?auth=error`);
  }

  try {
    await ensureColumns();

    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${siteUrl}/api/account/google/callback`,
        grant_type:    "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${siteUrl}/?auth=error`);
    }

    // Get Google user info
    const userRes  = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json() as GoogleUser;

    if (!googleUser.email) {
      return NextResponse.redirect(`${siteUrl}/?auth=error`);
    }

    // 1. Find by google_id
    let [rows] = await db.execute(
      "SELECT * FROM clients WHERE google_id = ? LIMIT 1",
      [googleUser.sub]
    );
    let client = (rows as Record<string, unknown>[])[0];

    if (!client) {
      // 2. Find by email — link Google account
      [rows] = await db.execute(
        "SELECT * FROM clients WHERE email = ? LIMIT 1",
        [googleUser.email.toLowerCase()]
      );
      client = (rows as Record<string, unknown>[])[0];

      if (client) {
        await db.execute(
          "UPDATE clients SET google_id = ?, photo_url = COALESCE(photo_url, ?) WHERE id = ?",
          [googleUser.sub, googleUser.picture ?? null, client.id]
        );
        client.google_id = googleUser.sub;
        client.photo_url = client.photo_url ?? googleUser.picture ?? null;
      } else {
        // 3. Create new client
        const [result] = await db.execute(
          "INSERT INTO clients (nom, email, google_id, photo_url, statut) VALUES (?, ?, ?, ?, 'actif')",
          [
            googleUser.name || googleUser.email,
            googleUser.email.toLowerCase(),
            googleUser.sub,
            googleUser.picture ?? null,
          ]
        );
        const id = (result as { insertId: number }).insertId;
        client = {
          id,
          nom:       googleUser.name || googleUser.email,
          email:     googleUser.email.toLowerCase(),
          telephone: null,
          google_id: googleUser.sub,
          photo_url: googleUser.picture ?? null,
        };
      }
    }

    const session = {
      id:        client.id as number,
      nom:       (client.nom as string) ?? "",
      email:     (client.email as string | null) ?? null,
      telephone: (client.telephone as string | null) ?? null,
      photo_url: (client.photo_url as string | null) ?? null,
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
    console.error("[google-callback]", err);
    return NextResponse.redirect(`${siteUrl}/?auth=error`);
  }
}
