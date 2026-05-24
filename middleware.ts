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

/** Extract the leftmost subdomain, excluding known system subdomains. */
function extractShopSlug(hostname: string): string | null {
  const host = hostname.split(":")[0]; // strip port
  const parts = host.split(".");
  if (parts.length < 3) return null; // no subdomain (e.g. saas.com)
  const sub = parts[0];
  if (["www", "livraison", "api", "mail"].includes(sub)) return null;
  return sub;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate a unique nonce for every request
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // ── Subdomain routing: livraison.togolese.tg → /livreur ────────────────────
  const hostname = request.headers.get("host") ?? "";

  // Inject shop slug for multi-tenant resolution in server components / route handlers
  const shopSlug = extractShopSlug(hostname);

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

  // Root domain (no shop subdomain) + "/" → SaaS landing page (production only)
  const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.");
  if (!shopSlug && !isLocalhost && pathname === "/") {
    return NextResponse.redirect(new URL("/saas", request.url));
  }

  // Pass nonce + shop slug to Server Components via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  if (shopSlug) requestHeaders.set("x-shop-slug", shopSlug);

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
