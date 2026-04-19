import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

function normalizePhone(p: string) {
  return p.replace(/\D/g, "").slice(-8);
}

/* ── GET /api/account/orders?q=XXXXXXXX  (phone OR reference) ── */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? req.nextUrl.searchParams.get("telephone") ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "Numéro ou référence requise" }, { status: 400 });
  }

  try {
    const SELECT = `SELECT id, reference, nom, telephone, adresse, zone_livraison,
                           delivery_fee, subtotal, total, status, items, created_at
                    FROM orders`;

    // Detect if it looks like an order reference (contains letters or is clearly not a phone)
    const looksLikeRef = /[A-Za-z]/.test(q) || (q.replace(/\D/g, "").length < 6);

    let rows: mysql.RowDataPacket[];

    if (looksLikeRef) {
      // Search by reference (partial, case-insensitive)
      [rows] = await db.execute<mysql.RowDataPacket[]>(
        `${SELECT} WHERE reference LIKE ? ORDER BY created_at DESC LIMIT 20`,
        [`%${q}%`]
      );
    } else {
      // Search by phone (last 8 digits)
      const phone = normalizePhone(q);
      [rows] = await db.execute<mysql.RowDataPacket[]>(
        `${SELECT}
         WHERE RIGHT(REPLACE(telephone, ' ', ''), 8) = ?
            OR RIGHT(REPLACE(telephone, '+', ''), 8) = ?
         ORDER BY created_at DESC LIMIT 20`,
        [phone, phone]
      );
      // If nothing found by phone, also try reference
      if (rows.length === 0) {
        [rows] = await db.execute<mysql.RowDataPacket[]>(
          `${SELECT} WHERE reference LIKE ? ORDER BY created_at DESC LIMIT 20`,
          [`%${q}%`]
        );
      }
    }

    return NextResponse.json({ orders: rows });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
