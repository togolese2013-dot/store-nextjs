import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

/* ── GET /api/account/orders/[ref] ── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  if (!ref) return NextResponse.json({ error: "Référence requise" }, { status: 400 });

  try {
    const [orderRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, reference, nom, telephone, adresse, zone_livraison,
              delivery_fee, subtotal, total, status, items, created_at
       FROM orders WHERE reference = ? LIMIT 1`,
      [ref]
    );
    if (!(orderRows as mysql.RowDataPacket[]).length) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = orderRows[0];

    const [events] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT status, note, created_at FROM order_events
       WHERE order_id = ? ORDER BY created_at ASC`,
      [order.id]
    );

    return NextResponse.json({ order, events });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
