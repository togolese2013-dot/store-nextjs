import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listEntrepots, upsertEntrepot } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const entrepots = await listEntrepots();
    return NextResponse.json({ success: true, data: entrepots });
  } catch {
    return NextResponse.json({ success: true, data: [], _migrationNeeded: true });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  await upsertEntrepot({
    nom:         body.nom.trim(),
    adresse:     body.adresse ?? "",
    telephone:   body.telephone ?? "",
    responsable: body.responsable ?? "",
    actif:       body.actif !== false,
    sort_order:  Number(body.sort_order ?? 0),
  });
  return NextResponse.json({ success: true });
}
