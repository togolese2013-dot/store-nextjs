import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listUtilisateurs, createUtilisateur } from "@/lib/admin-db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const users = await listUtilisateurs();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { nom, email, telephone, poste, motDePasse } = await req.json();
  if (!nom || !poste || !motDePasse) {
    return NextResponse.json({ error: "Nom, poste et mot de passe sont requis." }, { status: 400 });
  }

  const hash = await bcrypt.hash(motDePasse, 12);
  try {
    const id = await createUtilisateur({
      nom,
      email:      email     || undefined,
      telephone:  telephone || undefined,
      poste,
      motDePasse: hash,
    });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Cet email existe déjà." }, { status: 409 });
  }
}
