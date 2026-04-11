import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getStocksForProduct } from "@/lib/admin-db";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const stocks = await getStocksForProduct(Number(id));
  return NextResponse.json({ success: true, data: stocks });
}
