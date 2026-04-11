import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [rows] = await db.query(
    "SELECT * FROM proformats ORDER BY created_at DESC LIMIT 50"
  );
  return NextResponse.json({ proformats: rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { client_nom, client_telephone, client_adresse, client_email, items, remise = 0, validite_jours = 30, note } = body;

  if (!client_nom || !items?.length) {
    return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
  }

  const [[{ cnt }]] = await db.query("SELECT COUNT(*) as cnt FROM proformats") as any;
  const reference = `PRO-${String(cnt + 1).padStart(4, "0")}`;

  const sous_total = items.reduce((s: number, i: any) => s + i.total, 0);
  const total = sous_total - remise;

  const [result] = await db.query(
    `INSERT INTO proformats (reference, client_nom, client_telephone, client_adresse, client_email, items, sous_total, remise, total, validite_jours, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [reference, client_nom, client_telephone ?? null, client_adresse ?? null, client_email ?? null,
     JSON.stringify(items), sous_total, remise, total, validite_jours, note ?? null]
  ) as any;

  return NextResponse.json({ ok: true, reference, id: result.insertId });
}
