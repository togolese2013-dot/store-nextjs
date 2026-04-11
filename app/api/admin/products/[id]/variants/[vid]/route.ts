import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { vid } = await params;
  const body = await req.json();
  const { nom, options, prix, stock, reference_sku } = body;

  await db.execute(
    "UPDATE product_variants SET nom=?, options=?, prix=?, stock=?, reference_sku=? WHERE id=?",
    [
      nom,
      JSON.stringify(options ?? {}),
      Number(prix),
      Number(stock ?? 0),
      reference_sku ?? null,
      Number(vid),
    ]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { vid } = await params;
  await db.execute("DELETE FROM product_variants WHERE id=?", [Number(vid)]);

  return NextResponse.json({ ok: true });
}
