import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listOrders, countOrders, createOrder, addOrderEvent } from "@/lib/admin-db";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 25;
  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([listOrders(limit, offset), countOrders()]);
  return NextResponse.json({ success: true, data: orders, total, page, limit });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { nom, telephone, adresse, zone_livraison, delivery_fee, note, items } = body;

  if (!telephone?.trim() || !items?.length) {
    return NextResponse.json({ error: "Téléphone et articles requis" }, { status: 400 });
  }

  const subtotal = items.reduce((s: number, i: { total: number }) => s + i.total, 0);
  const total    = subtotal + Number(delivery_fee ?? 0);

  const id = await createOrder({ nom, telephone, adresse, zone_livraison, delivery_fee: Number(delivery_fee ?? 0), note, items, subtotal, total });

  // Add first event
  await addOrderEvent(id, "pending", "Commande créée par l'admin", session.nom);

  return NextResponse.json({ success: true, id });
}
