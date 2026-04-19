import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import mysql from "mysql2/promise";

/* Ensure the table exists */
async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

/* ── POST /api/newsletter ── */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    await ensureTable();

    const [existing] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM newsletter_subscribers WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if ((existing as mysql.RowDataPacket[]).length > 0) {
      return NextResponse.json({ success: true, already: true });
    }

    await db.execute(
      "INSERT INTO newsletter_subscribers (email) VALUES (?)",
      [email.trim().toLowerCase()]
    );

    return NextResponse.json({ success: true, already: false });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
