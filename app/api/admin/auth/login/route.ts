import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByEmail, updateAdminLastLogin, createAdminUser } from "@/lib/admin-db";
import { signToken, cookieName, cookieTTL } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    let user = await getAdminByEmail(email.trim().toLowerCase());

    /* Auto-create first admin if table is empty */
    if (!user) {
      const { db } = await import("@/lib/db");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [rows] = await db.execute<any[]>(
        "SELECT COUNT(*) as cnt FROM admin_users"
      );
      if (Number(rows[0]?.cnt) === 0) {
        const hash = await bcrypt.hash(password, 12);
        await createAdminUser({ nom: "Admin", email: email.trim().toLowerCase(), password_hash: hash, role: "super_admin" });
        user = await getAdminByEmail(email.trim().toLowerCase());
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, nom: user.nom, role: user.role });
    await updateAdminLastLogin(user.id);

    const res = NextResponse.json({ ok: true, nom: user.nom, role: user.role });
    res.cookies.set(cookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge:   cookieTTL(),
      path:     "/",
      secure:   process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("[admin login]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
