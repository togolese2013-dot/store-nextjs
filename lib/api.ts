import { cookies, headers } from "next/headers";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function getCookieHeader(): Promise<string> {
  try {
    const jar = await cookies();
    return jar.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  } catch {
    return "";
  }
}

/** Reads x-shop-slug and x-custom-domain injected by middleware. */
async function getShopHeaders(): Promise<{ slug: string | null; customDomain: string | null }> {
  try {
    const h = await headers();
    return {
      slug:         h.get("x-shop-slug"),
      customDomain: h.get("x-custom-domain"),
    };
  } catch {
    return { slug: null, customDomain: null };
  }
}

async function buildHeaders(
  cookieHeader: string,
  slug: string | null,
  customDomain: string | null,
  extra?: Record<string, string>
): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    ...(cookieHeader  ? { Cookie: cookieHeader } : {}),
    ...(slug          ? { "x-shop-slug":     slug }         : {}),
    ...(customDomain  ? { "x-custom-domain": customDomain } : {}),
    ...extra,
  };
}

export async function apiGet<T = unknown>(
  path: string,
  opts?: { noAuth?: boolean; revalidate?: number }
): Promise<T> {
  const [cookieHeader, { slug, customDomain }] = await Promise.all([
    opts?.noAuth ? Promise.resolve("") : getCookieHeader(),
    getShopHeaders(),
  ]);
  const res = await fetch(`${BACKEND}${path}`, {
    headers: await buildHeaders(cookieHeader, slug, customDomain),
    ...(opts?.revalidate !== undefined
      ? { next: { revalidate: opts.revalidate } }
      : { cache: "no-store" as const }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const [cookieHeader, { slug, customDomain }] = await Promise.all([
    getCookieHeader(),
    getShopHeaders(),
  ]);
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: await buildHeaders(cookieHeader, slug, customDomain),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API ${res.status}`);
  }
  return res.json();
}
