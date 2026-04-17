import { NextRequest, NextResponse } from "next/server";
import { getLivreurByCode, getLivraisonsForLivreur } from "@/lib/admin-db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const livreur = await getLivreurByCode(code);
  if (!livreur) return NextResponse.json({ error: "Code livreur invalide." }, { status: 404 });
  const livraisons = await getLivraisonsForLivreur(livreur.id);
  return NextResponse.json({ livreur, livraisons });
}
