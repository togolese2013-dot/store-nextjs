import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listAdminCategories, createCategory } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const categories = await listAdminCategories();
  return NextResponse.json({ success: true, data: categories });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { nom, description = "" } = await req.json();
  if (!nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const id = await createCategory(nom.trim(), description.trim());
  return NextResponse.json({ success: true, id });
}
