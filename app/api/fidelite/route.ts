import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

const POINTS_PER_FCFA = 1 / 100; // 1 point per 100 FCFA
const POINTS_TO_FCFA  = 10;       // 1 point = 10 FCFA (100 pts = 1000 FCFA)
const MIN_REDEEM      = 100;      // minimum 100 points to redeem

async function ensureTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      telephone  VARCHAR(20) NOT NULL,
      points     INT NOT NULL DEFAULT 0,
      motif      VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_telephone (telephone)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

function normalizePhone(p: string) {
  return p.replace(/\D/g, "").slice(-8);
}

/* ── GET /api/fidelite?telephone=XXXXXXXX ── */
export async function GET(req: NextRequest) {
  const telephone = req.nextUrl.searchParams.get("telephone");
  if (!telephone?.trim()) {
    return NextResponse.json({ error: "Numéro requis" }, { status: 400 });
  }

  try {
    await ensureTable();
    const phone = normalizePhone(telephone);

    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT COALESCE(SUM(points), 0) as total FROM loyalty_points WHERE telephone = ?",
      [phone]
    );
    const total  = Number((rows as mysql.RowDataPacket[])[0]?.total ?? 0);
    const valeur = total * POINTS_TO_FCFA;

    const [history] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT points, motif, created_at FROM loyalty_points WHERE telephone = ? ORDER BY created_at DESC LIMIT 10",
      [phone]
    );

    return NextResponse.json({
      telephone: phone,
      points: total,
      valeur_fcfa: valeur,
      can_redeem: total >= MIN_REDEEM,
      history: history,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/fidelite ── */
/* body: { action: "redeem", telephone } → génère un coupon */
export async function POST(req: NextRequest) {
  try {
    const { action, telephone } = await req.json() as { action: string; telephone: string };
    if (!telephone?.trim()) return NextResponse.json({ error: "Numéro requis" }, { status: 400 });

    await ensureTable();
    const phone = normalizePhone(telephone);

    if (action === "redeem") {
      const [rows] = await db.execute<mysql.RowDataPacket[]>(
        "SELECT COALESCE(SUM(points), 0) as total FROM loyalty_points WHERE telephone = ?",
        [phone]
      );
      const total = Number((rows as mysql.RowDataPacket[])[0]?.total ?? 0);
      if (total < MIN_REDEEM) {
        return NextResponse.json({ error: `Il vous faut au moins ${MIN_REDEEM} points.` }, { status: 400 });
      }

      // Deduct points & generate coupon code
      const coupon  = `FID${phone.slice(-4)}${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const redeem  = Math.floor(total / MIN_REDEEM) * MIN_REDEEM;
      const valeur  = redeem * POINTS_TO_FCFA;

      await db.execute(
        "INSERT INTO loyalty_points (telephone, points, motif) VALUES (?, ?, ?)",
        [phone, -redeem, `Rachat coupon ${coupon} (−${valeur} FCFA)`]
      );

      // Insert coupon into coupons table if it exists
      try {
        await db.execute(
          `INSERT IGNORE INTO coupons (code, type, valeur, min_order, max_uses, uses_count, actif)
           VALUES (?, 'fixed', ?, 0, 1, 0, 1)`,
          [coupon, valeur]
        );
      } catch { /* coupons table may differ */ }

      return NextResponse.json({ success: true, coupon, valeur_fcfa: valeur, points_used: redeem });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
