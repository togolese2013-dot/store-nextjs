import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  getStockBoutiqueStats,
  getStockBoutiqueList,
  getRecentBoutiqueMovements,
} from "@/lib/admin-db";

/* GET /api/admin/stock-boutique?filter=all|faible|epuise&q=search&limit=50&offset=0 */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  try {
    const sp     = req.nextUrl.searchParams;
    const q      = sp.get("q") || undefined;
    const filter = (sp.get("filter") || "all") as "all" | "faible" | "epuise";
    const limit  = Math.min(100, Math.max(1, Number(sp.get("limit")) || 50));
    const offset = Math.max(0, Number(sp.get("offset")) || 0);

    const [stats, { items, total }, movements] = await Promise.all([
      getStockBoutiqueStats(),
      getStockBoutiqueList({ search: q, filter, limit, offset }),
      getRecentBoutiqueMovements(20),
    ]);

    return NextResponse.json({ stats, items, total, movements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    // Table not yet created
    if (message.includes("doesn't exist") || message.includes("Table") || message.includes("ER_NO_SUCH_TABLE")) {
      return NextResponse.json({ error: "migration_needed" }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
