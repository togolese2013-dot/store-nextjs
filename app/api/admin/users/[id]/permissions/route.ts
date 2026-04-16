import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getUtilisateurPermissions, setUtilisateurPermissions } from "@/lib/admin-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const permissionIds = await getUtilisateurPermissions(Number(id));
  return NextResponse.json(permissionIds);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id }           = await params;
  const { permissionIds } = await req.json() as { permissionIds: number[] };
  if (!Array.isArray(permissionIds)) {
    return NextResponse.json({ error: "permissionIds doit être un tableau." }, { status: 400 });
  }

  await setUtilisateurPermissions(Number(id), permissionIds);
  return NextResponse.json({ ok: true });
}
