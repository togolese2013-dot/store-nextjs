import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { upsertEntrepot, deleteEntrepot, getStocksForEntrepot, updateProductStock } from "@/lib/admin-db";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const stocks = await getStocksForEntrepot(Number(id));
  return NextResponse.json({ success: true, data: stocks });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Handle stock update for a single product
  if (body._stock !== undefined) {
    await updateProductStock(Number(body.produit_id), Number(id), Number(body._stock));
    return NextResponse.json({ success: true });
  }

  if (!body.nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  await upsertEntrepot({
    id:          Number(id),
    nom:         body.nom.trim(),
    adresse:     body.adresse ?? "",
    telephone:   body.telephone ?? "",
    responsable: body.responsable ?? "",
    actif:       body.actif !== false,
    sort_order:  Number(body.sort_order ?? 0),
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  await deleteEntrepot(Number(id));
  return NextResponse.json({ success: true });
}
