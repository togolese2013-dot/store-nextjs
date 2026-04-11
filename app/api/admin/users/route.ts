import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createAdminUser, listAdminUsers } from "@/lib/admin-db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  return NextResponse.json(await listAdminUsers());
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { nom, email, password, role } = await req.json();
  if (!nom || !email || !password) return NextResponse.json({ error: "Champs requis." }, { status: 400 });

  const hash = await bcrypt.hash(password, 12);
  try {
    await createAdminUser({ nom, email: email.toLowerCase(), password_hash: hash, role: role || "admin" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cet email existe déjà." }, { status: 409 });
  }
}
