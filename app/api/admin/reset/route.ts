import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// One-time admin password reset endpoint.
// Protected by RESET_SECRET env var — delete this file after use.
export async function POST(req: NextRequest) {
  const { secret, email, password } = await req.json();

  const expected = process.env.RESET_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Secret invalide." }, { status: 403 });
  }

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email et mot de passe (8 caractères min) requis." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  // Upsert: update if exists, insert otherwise
  const [existing] = await db.execute<import("mysql2").RowDataPacket[]>(
    "SELECT id FROM admin_users WHERE email = ?",
    [email.toLowerCase()]
  );

  if ((existing as import("mysql2").RowDataPacket[]).length > 0) {
    await db.execute(
      "UPDATE admin_users SET password_hash = ?, actif = 1 WHERE email = ?",
      [hash, email.toLowerCase()]
    );
  } else {
    await db.execute(
      "INSERT INTO admin_users (nom, email, password_hash, role, actif) VALUES (?, ?, ?, 'super_admin', 1)",
      ["Admin", email.toLowerCase(), hash]
    );
  }

  return NextResponse.json({ ok: true, message: "Mot de passe mis à jour. Supprime ce endpoint !" });
}
