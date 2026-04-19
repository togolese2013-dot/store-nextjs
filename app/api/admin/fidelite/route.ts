import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { addLoyaltyPointsManual } from "@/lib/admin-db";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { telephone, points, reason } = await req.json();
    if (!telephone?.trim() || typeof points !== "number" || !reason?.trim()) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }
    await addLoyaltyPointsManual(telephone.trim(), points, reason.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-fidelite]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
