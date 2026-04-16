import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  listBoutiqueClients,
  countBoutiqueClients,
  createBoutiqueClient,
  getBoutiqueClientsStats,
} from "@/lib/admin-db";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 30;
  const offset = (page - 1) * limit;
  const search = searchParams.get("q") ?? "";
  const filtre = (searchParams.get("filtre") ?? "tous") as "tous" | "debiteurs" | "dettes";
  const stats  = searchParams.get("stats") === "1";

  if (stats) {
    try {
      const data = await getBoutiqueClientsStats();
      return NextResponse.json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("doesn't exist")) {
        return NextResponse.json({ success: true, data: null, _migrationNeeded: true });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  try {
    const [clients, total] = await Promise.all([
      listBoutiqueClients(limit, offset, search, filtre),
      countBoutiqueClients(search, filtre),
    ]);
    return NextResponse.json({ success: true, data: clients, total, page, limit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("doesn't exist")) {
      return NextResponse.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.nom?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const id = await createBoutiqueClient(body);
  return NextResponse.json({ success: true, id });
}
