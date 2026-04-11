import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listClients, countClients, upsertClient, getCRMStats } from "@/lib/admin-db";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 30;
  const offset = (page - 1) * limit;
  const search = searchParams.get("q") ?? "";
  const stats  = searchParams.get("stats") === "1";

  if (stats) {
    try {
      const crmStats = await getCRMStats();
      return NextResponse.json({ success: true, data: crmStats });
    } catch {
      return NextResponse.json({ success: true, data: { newClients30d: 0, topClients: [] } });
    }
  }

  try {
    const [clients, total] = await Promise.all([
      listClients(limit, offset, search),
      countClients(search),
    ]);
    return NextResponse.json({ success: true, data: clients, total, page, limit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Table doesn't exist yet — migration not run
    if (msg.includes("doesn't exist") || msg.includes("Unknown column")) {
      return NextResponse.json({ success: true, data: [], total: 0, page, limit, _migrationNeeded: true });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  if (!body.telephone?.trim()) {
    return NextResponse.json({ error: "Téléphone requis" }, { status: 400 });
  }

  const id = await upsertClient(body);
  return NextResponse.json({ success: true, id });
}
