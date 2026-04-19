import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteNewsletterSubscriber, listNewsletterSubscribers } from "@/lib/admin-db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const subscribers = await listNewsletterSubscribers();
    return NextResponse.json({ subscribers });
  } catch (err) {
    console.error("[admin-newsletter GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    await deleteNewsletterSubscriber(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-newsletter DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
