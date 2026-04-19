import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS referrals (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      code       VARCHAR(20) NOT NULL UNIQUE,
      nom        VARCHAR(100) NOT NULL,
      telephone  VARCHAR(20) NOT NULL,
      uses_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_telephone (telephone)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

function normalizePhone(p: string) {
  return p.replace(/\D/g, "").slice(-8);
}

function generateCode(nom: string, telephone: string): string {
  const prefix = nom.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X");
  const suffix = normalizePhone(telephone).slice(-3);
  const rand   = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `${prefix}${suffix}${rand}`;
}

/* ── GET /api/referrals?code=XXXXX ── */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code?.trim()) return NextResponse.json({ error: "Code requis" }, { status: 400 });

  try {
    await ensureTable();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT id, code, nom, uses_count FROM referrals WHERE code = ? LIMIT 1",
      [code.toUpperCase()]
    );
    if (!(rows as mysql.RowDataPacket[]).length) {
      return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/referrals ── */
/* body: { nom, telephone } → crée ou retourne le code existant */
export async function POST(req: NextRequest) {
  try {
    const { nom, telephone } = await req.json() as { nom: string; telephone: string };
    if (!nom?.trim() || !telephone?.trim()) {
      return NextResponse.json({ error: "Nom et numéro requis" }, { status: 400 });
    }

    await ensureTable();
    const phone = normalizePhone(telephone);

    // Return existing code if already registered
    const [existing] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT code, nom, uses_count FROM referrals WHERE telephone = ? LIMIT 1",
      [phone]
    );
    if ((existing as mysql.RowDataPacket[]).length) {
      return NextResponse.json({ ...existing[0], already: true });
    }

    // Generate unique code
    let code = generateCode(nom, telephone);
    let attempts = 0;
    while (attempts < 5) {
      const [check] = await db.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM referrals WHERE code = ?", [code]
      );
      if (!(check as mysql.RowDataPacket[]).length) break;
      code = generateCode(nom, telephone);
      attempts++;
    }

    await db.execute(
      "INSERT INTO referrals (code, nom, telephone) VALUES (?, ?, ?)",
      [code, nom.trim().slice(0, 100), phone]
    );

    return NextResponse.json({ code, nom: nom.trim(), uses_count: 0, already: false });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH /api/referrals?code=XXXXX ── increment uses_count ── */
export async function PATCH(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Code requis" }, { status: 400 });
  try {
    await db.execute(
      "UPDATE referrals SET uses_count = uses_count + 1 WHERE code = ?",
      [code.toUpperCase()]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
