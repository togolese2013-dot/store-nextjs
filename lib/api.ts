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

/** Reads the x-shop-slug injected by middleware — forwarded to backend on every call. */
async function getShopSlugHeader(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-shop-slug");
  } catch {
    return null;
  }
}

async function buildHeaders(
  cookieHeader: string,
  shopSlug: string | null,
  extra?: Record<string, string>
): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(shopSlug    ? { "x-shop-slug": shopSlug } : {}),
    ...extra,
  };
}

export async function apiGet<T = unknown>(
  path: string,
  opts?: { noAuth?: boolean; revalidate?: number }
): Promise<T> {
  const [cookieHeader, shopSlug] = await Promise.all([
    opts?.noAuth ? Promise.resolve("") : getCookieHeader(),
    getShopSlugHeader(),
  ]);
  const res = await fetch(`${BACKEND}${path}`, {
    headers: await buildHeaders(cookieHeader, shopSlug),
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
  const [cookieHeader, shopSlug] = await Promise.all([
    getCookieHeader(),
    getShopSlugHeader(),
  ]);
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: await buildHeaders(cookieHeader, shopSlug),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API ${res.status}`);
  }
  return res.json();
}
