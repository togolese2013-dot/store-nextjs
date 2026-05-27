import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Absence of JWT_SECRET must deny access, never silently use a known fallback
const _jwtSecretRaw = process.env.JWT_SECRET;
if (!_jwtSecretRaw) {
  console.error("[middleware] CRITICAL: JWT_SECRET is not set — all admin sessions will be rejected.");
}
// Empty string as fallback: all jwtVerify() calls will fail → redirect to login (safe deny)
const SECRET = new TextEncoder().encode(_jwtSecretRaw ?? "");
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

  // ── Subdomain routing: app.togolese.tg → /admin ────────────────────────────
  const hostname = request.headers.get("host") ?? "";
  if (hostname.startsWith("app.")) {
    // API requests: pass through without prefix
    if (pathname.startsWith("/api/")) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-nonce", nonce);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    // Already on an /admin path — let normal auth middleware handle it
    if (pathname.startsWith("/admin")) {
      // fall through to standard middleware below
    } else {
      // Redirect root (and any non-admin path) to /admin
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/login" ? "/admin/login" : "/admin";
      return NextResponse.redirect(url);
    }
  }

  // ── Subdomain routing: livraison.togolese.tg → /livreur ────────────────────
  if (hostname.startsWith("livraison.")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    // API requests: pass through directly (no /livreur prefix)
    if (pathname.startsWith("/api/")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/livreur" : `/livreur${pathname}`;

    // Public pages served as-is (no /livreur prefix, no auth check)
    if (pathname === "/login" || pathname === "/livreur/login") {
      url.pathname = "/livreur/login";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    if (pathname === "/livreur-inscription") {
      url.pathname = "/livreur-inscription";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    // All other pages: check auth, redirect to subdomain login if missing/invalid
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try { await jwtVerify(token, SECRET); } catch {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }

    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  const isAdminRoute      = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isLivreurRoute    = pathname.startsWith("/livreur") &&
                            !pathname.startsWith("/livreur/login");
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
