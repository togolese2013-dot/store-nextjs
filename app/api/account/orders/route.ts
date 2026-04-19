import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

function normalizePhone(p: string) {
  return p.replace(/\D/g, "").slice(-8);
}

/* ── GET /api/account/orders?telephone=XXXXXXXX ── */
export async function GET(req: NextRequest) {
  const telephone = req.nextUrl.searchParams.get("telephone");
  if (!telephone?.trim()) {
    return NextResponse.json({ error: "Numéro requis" }, { status: 400 });
  }

  try {
    const phone = normalizePhone(telephone);

    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison,
              delivery_fee, subtotal, total, status, items, created_at
       FROM orders
       WHERE RIGHT(REPLACE(telephone, ' ', ''), 8) = ?
          OR RIGHT(REPLACE(telephone, '+', ''), 8) = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [phone, phone]
    );

    return NextResponse.json({ orders: rows });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
