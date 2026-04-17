import { NextRequest, NextResponse } from "next/server";
import { getLivreurByCode, accepterLivraison } from "@/lib/admin-db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const livreur = await getLivreurByCode(code);
  if (!livreur) return NextResponse.json({ error: "Code livreur invalide." }, { status: 404 });
  if (livreur.statut === "indisponible")
    return NextResponse.json({ error: "Vous êtes marqué indisponible." }, { status: 403 });

  const { livraison_id } = await req.json();
  if (!livraison_id) return NextResponse.json({ error: "livraison_id requis." }, { status: 400 });

  const accepted = await accepterLivraison(Number(livraison_id), livreur.id);
  if (!accepted) return NextResponse.json({ error: "Cette livraison a déjà été prise." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
