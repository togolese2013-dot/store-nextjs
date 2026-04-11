/**
 * Togolese Shop Admin — Service Worker
 * Strategy:
 *   - Static Next.js assets  → Cache First
 *   - /api/admin/orders      → Network First, fallback to cache (orders-today)
 *   - /api/admin/orders/sse  → Network Only (SSE stream, never cache)
 *   - Other API routes       → Network Only
 *   - Admin pages            → Network First, fallback to /admin/offline
 */

const CACHE_VERSION   = "v1";
const STATIC_CACHE    = `ts-admin-static-${CACHE_VERSION}`;
const ORDERS_CACHE    = `ts-admin-orders-${CACHE_VERSION}`;
const OFFLINE_URL     = "/admin/offline";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/admin",
  "/admin/orders",
  OFFLINE_URL,
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => { /* ignore precache errors */ }))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const validCaches = [STATIC_CACHE, ORDERS_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !validCaches.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // SSE endpoint — never intercept
  if (path.startsWith("/api/admin/orders/sse")) return;

  // Orders API — Network First with cache fallback
  if (path.startsWith("/api/admin/orders") && request.method === "GET") {
    event.respondWith(networkFirstOrders(request));
    return;
  }

  // Other API routes — Network Only
  if (path.startsWith("/api/")) return;

  // Next.js static chunks — Cache First
  if (path.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Admin pages — Network First with offline fallback
  if (path.startsWith("/admin")) {
    event.respondWith(networkFirstAdmin(request));
    return;
  }
});

// ─── Strategies ──────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Network error", { status: 503 });
  }
}

async function networkFirstOrders(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the first page of orders (today's view)
      const url = new URL(request.url);
      const page = url.searchParams.get("page") || "1";
      if (page === "1") {
        const cache = await caches.open(ORDERS_CACHE);
        // Store with a timestamp header for TTL tracking
        const cloned = response.clone();
        const body   = await cloned.json();
        const stamped = new Response(JSON.stringify({ ...body, _cached_at: Date.now() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        cache.put(request, stamped);
      }
    }
    return response;
  } catch {
    // Offline fallback: return cached orders if available
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ success: false, offline: true, data: [], total: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkFirstAdmin(request) {
  try {
    const response = await fetch(request);
    // Cache successful navigation responses
    if (response.ok && response.type !== "opaque") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try cache first
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback: offline page
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("Hors connexion", { status: 503 });
  }
}
