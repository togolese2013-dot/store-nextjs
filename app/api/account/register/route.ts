import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

export async function POST(req: NextRequest) {
  try {
    await ensureColumns();

    const { nom, identifier, password } = await req.json();

    if (!nom?.trim() || !identifier?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }
    if ((password as string).length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 6 caractères" },
        { status: 400 }
      );
    }

    const isEmail    = (identifier as string).includes("@");
    const email      = isEmail ? (identifier as string).trim().toLowerCase() : null;
    const telephone  = isEmail ? null : (identifier as string).trim();

    // Check duplicate
    const field = isEmail ? "email" : "telephone";
    const [existing] = await db.execute(
      `SELECT id FROM clients WHERE ${field} = ? LIMIT 1`,
      [isEmail ? email : telephone]
    );
    if ((existing as unknown[]).length > 0) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet identifiant" },
        { status: 409 }
      );
    }

    const hash   = await bcrypt.hash(password as string, 12);
    const [result] = await db.execute(
      "INSERT INTO clients (nom, email, telephone, password, statut) VALUES (?, ?, ?, ?, 'actif')",
      [(nom as string).trim(), email, telephone, hash]
    );
    const id = (result as { insertId: number }).insertId;

    const session = {
      id,
      nom:       (nom as string).trim(),
      email,
      telephone,
      photo_url: null as string | null,
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
    console.error("[client-register]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
