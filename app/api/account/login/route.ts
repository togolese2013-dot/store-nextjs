import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signClientToken, CLIENT_COOKIE } from "@/lib/client-auth";

// Auto-add columns if they don't exist yet
async function ensureColumns() {
  for (const sql of [
    "ALTER TABLE clients ADD COLUMN password VARCHAR(255)",
    "ALTER TABLE clients ADD COLUMN photo_url VARCHAR(512)",
    "ALTER TABLE clients ADD COLUMN google_id VARCHAR(255)",
  ]) {
    try { await db.execute(sql); } catch { /* column already exists */ }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureColumns();

    const { identifier, password } = await req.json();

    if (!identifier?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
    }

    const isEmail = (identifier as string).includes("@");
    let rows: unknown[];

    if (isEmail) {
      [rows] = await db.execute(
        "SELECT * FROM clients WHERE email = ? LIMIT 1",
        [identifier.trim().toLowerCase()]
      );
    } else {
      // Normalize: last 8 digits for flexible matching
      const digits = (identifier as string).replace(/\D/g, "");
      const last8 = digits.slice(-8);
      [rows] = await db.execute(
        "SELECT * FROM clients WHERE RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', ''), 8) = ? LIMIT 1",
        [last8]
      );
    }

    const client = (rows as Record<string, unknown>[])[0];
    if (!client) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 401 });
    }
    if (!client.password) {
      return NextResponse.json(
        { error: "Mot de passe non configuré. Connectez-vous avec Google ou créez un compte." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, client.password as string);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const session = {
      id:        client.id as number,
      nom:       (client.nom as string) ?? "",
      email:     (client.email as string | null) ?? null,
      telephone: (client.telephone as string | null) ?? null,
      photo_url: (client.photo_url as string | null) ?? null,
    };

    const token = await signClientToken(session);
    const res   = NextResponse.json({ ok: true, user: session });
    res.cookies.set(CLIENT_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30,
      path:     "/",
    });
    return res;
  } catch (err) {
    console.error("[client-login]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
