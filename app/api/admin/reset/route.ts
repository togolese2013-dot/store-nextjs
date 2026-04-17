import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// One-time admin password reset endpoint.
// Protected by RESET_SECRET env var — delete this file after use.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, email, password } = body;

    const expected = process.env.RESET_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
    }

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Email et mot de passe (8 caractères min) requis." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    const lowerEmail = email.toLowerCase();

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM admin_users WHERE email = ?",
      [lowerEmail]
    );

    if (rows.length > 0) {
      await db.execute(
        "UPDATE admin_users SET password_hash = ?, actif = 1 WHERE email = ?",
        [hash, lowerEmail]
      );
      return NextResponse.json({ ok: true, action: "updated", email: lowerEmail });
    } else {
      await db.execute(
        "INSERT INTO admin_users (nom, email, password_hash, role, actif) VALUES (?, ?, ?, 'super_admin', 1)",
        ["Admin", lowerEmail, hash]
      );
      return NextResponse.json({ ok: true, action: "created", email: lowerEmail });
    }
  } catch (err) {
    console.error("[reset]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
