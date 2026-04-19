import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { signClientToken, CLIENT_COOKIE } from "@/lib/client-auth";

type ClientRow = RowDataPacket & {
  id:        number;
  nom:       string;
  email:     string | null;
  telephone: string | null;
  password:  string | null;
  photo_url: string | null;
};

// Auto-add columns if they don't exist yet
async function ensureColumns() {
  for (const sql of [
    "ALTER TABLE clients ADD COLUMN password VARCHAR(255)",
    "ALTER TABLE clients ADD COLUMN photo_url VARCHAR(512)",
    "ALTER TABLE clients ADD COLUMN google_id VARCHAR(255)",
  ]) {
    try { await db.execute(sql); } catch { /* already exists */ }
  }
  // telephone was originally NOT NULL — allow NULL so email-only accounts work
  try {
    await db.execute("ALTER TABLE clients MODIFY COLUMN telephone VARCHAR(20) NULL");
  } catch { /* already nullable */ }
}

export async function POST(req: NextRequest) {
  try {
    await ensureColumns();

    const { identifier, password } = await req.json();

    if (!identifier?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
    }

    const isEmail = (identifier as string).includes("@");
    let rows: ClientRow[];

    if (isEmail) {
      [rows] = await db.execute<ClientRow[]>(
        "SELECT * FROM clients WHERE email = ? LIMIT 1",
        [identifier.trim().toLowerCase()]
      );
    } else {
      // Normalize: last 8 digits for flexible matching
      const digits = (identifier as string).replace(/\D/g, "");
      const last8  = digits.slice(-8);
      [rows] = await db.execute<ClientRow[]>(
        "SELECT * FROM clients WHERE RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', ''), 8) = ? LIMIT 1",
        [last8]
      );
    }

    const client = rows[0];
    if (!client) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 401 });
    }
    if (!client.password) {
      return NextResponse.json(
        { error: "Mot de passe non configuré. Connectez-vous avec Google ou créez un compte." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password as string, client.password);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const session = {
      id:        client.id,
      nom:       client.nom ?? "",
      email:     client.email ?? null,
      telephone: client.telephone ?? null,
      photo_url: client.photo_url ?? null,
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
