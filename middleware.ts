import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET      = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);
const COOKIE_NAME = "ts_admin_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute   = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/change-password");
  const isLivreurRoute = pathname.startsWith("/livreur");

  if (!isAdminRoute && !isLivreurRoute) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/livreur/:path*"],
};
