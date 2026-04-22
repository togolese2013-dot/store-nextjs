import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function getCookieHeader(): Promise<string> {
  try {
    const jar = await cookies();
    return jar.toString();
  } catch {
    return "";
  }
}

export async function apiGet<T = unknown>(
  path: string,
  opts?: { noAuth?: boolean; revalidate?: number }
): Promise<T> {
  const cookieHeader = opts?.noAuth ? "" : await getCookieHeader();
  const res = await fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    next: { revalidate: opts?.revalidate ?? 0 },
    cache: opts?.revalidate !== undefined ? "force-cache" : "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const cookieHeader = await getCookieHeader();
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? `API ${res.status}`);
  }
  return res.json();
}
