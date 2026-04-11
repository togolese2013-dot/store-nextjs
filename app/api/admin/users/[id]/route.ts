import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateAdminUser } from "@/lib/admin-db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  const body   = await req.json();
  await updateAdminUser(Number(id), body);
  return NextResponse.json({ ok: true });
}
