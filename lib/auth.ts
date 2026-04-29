import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { AdminPermissions } from "./admin-permissions";

export type { AdminPermissions };

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);

const COOKIE_NAME = "ts_admin_token";
const TTL         = 60 * 60 * 8; // 8 hours

export interface AdminPayload {
  id:          number;
  username:    string;
  email:       string | null;
  nom:         string;
  role:        string;
  permissions: AdminPermissions | null;
}

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

/** Reads the JWT from the request cookies (server component / route handler) */
export async function getAdminSession(): Promise<AdminPayload | null> {
  const jar   = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Reads JWT from a ReadonlyRequestCookies (middleware) */
export async function getSessionFromCookies(
  cookies: RequestCookies
): Promise<AdminPayload | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function cookieName() { return COOKIE_NAME; }
export function cookieTTL()  { return TTL; }
