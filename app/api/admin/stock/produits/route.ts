import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getProduitsWithStock } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const produits = await getProduitsWithStock();
    return NextResponse.json({ produits });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
