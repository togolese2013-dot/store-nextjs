import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET      = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);
const COOKIE_NAME = "ts_admin_token";

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' https: data: blob:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a unique nonce for every request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isAdminRoute      = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isLivreurRoute    = pathname.startsWith("/livreur");
  const isChangePassRoute = pathname.startsWith("/change-password");

  const isProtected = isAdminRoute || isLivreurRoute || isChangePassRoute;

  if (isProtected) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    const redirectToLogin = (deleteToken = false) => {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(login);
      if (deleteToken) res.cookies.delete(COOKIE_NAME);
      res.headers.set("Content-Security-Policy", buildCsp(nonce));
      return res;
    };

    if (!token) return redirectToLogin();

    try {
      await jwtVerify(token, SECRET);
    } catch {
      return redirectToLogin(true);
    }
  }

  // Pass nonce to Server Components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
