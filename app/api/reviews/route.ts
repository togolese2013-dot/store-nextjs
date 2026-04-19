import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import mysql from "mysql2/promise";

/* ── GET /api/reviews?productId=X ── */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId requis" }, { status: 400 });
  }

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, nom, rating, comment, created_at
       FROM reviews
       WHERE product_id = ? AND approved = 1
       ORDER BY created_at DESC
       LIMIT 20`,
      [productId]
    );

    const reviews = rows as { id: number; nom: string; rating: number; comment: string; created_at: string }[];
    const count   = reviews.length;
    const avg     = count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : null;

    return NextResponse.json({ reviews, count, avg });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/reviews ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, nom, rating, comment } = body as {
      product_id: number;
      nom:        string;
      rating:     number;
      comment:    string;
    };

    if (!product_id || !nom?.trim() || !comment?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Note invalide" }, { status: 400 });
    }

    await db.execute(
      `INSERT INTO reviews (product_id, nom, rating, comment, approved)
       VALUES (?, ?, ?, ?, 0)`,
      [product_id, nom.trim().slice(0, 100), rating, comment.trim().slice(0, 1000)]
    );

    return NextResponse.json({ success: true, message: "Avis envoyé, en attente de validation." });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
