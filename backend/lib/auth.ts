import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";
import type { AdminPermissions } from "@/lib/admin-permissions";
import { getTokenVersion } from "@/lib/admin-db";

export type { AdminPermissions };

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("FATAL: JWT_SECRET env var is not set. Server cannot start securely.");
  process.exit(1);
}
const SECRET = new TextEncoder().encode(jwtSecret);

export const COOKIE_NAME = "ts_admin_token";
const TTL = 60 * 60 * 8; // 8 hours

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  // Explicit override — use for compound TLDs (.co.uk) or custom setups
  if (process.env.AUTH_COOKIE_DOMAIN) return process.env.AUTH_COOKIE_DOMAIN;

  const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;

  try {
    const host = new URL(siteUrl).hostname;
    // Skip localhost and bare IPv4/IPv6
    if (host === "localhost" || /^\d+[\d.:]+$/.test(host)) return undefined;
    // Derive root domain from any hostname: "shop1.example.com" → ".example.com"
    const parts = host.split(".");
    if (parts.length < 2) return undefined;
    return `.${parts.slice(-2).join(".")}`;
  } catch {
    return undefined;
  }
}

export interface AdminPayload {
  id:                   number;
  username:             string;
  email:                string | null;
  nom:                  string;
  role:                 string;
  poste?:               string;
  permissions:          AdminPermissions | null;
  must_change_password?: boolean;
  token_version:        number;
  shop_id:              number;
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

export async function getSession(req: Request): Promise<AdminPayload | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify token_version matches DB — catches revoked tokens (logout, password change)
  try {
    const table = payload.role === "staff" ? "utilisateurs" : "admin_users";
    const dbVersion = await getTokenVersion(table, Number(payload.id));
    if (payload.token_version !== dbVersion) return null;
  } catch {
    // DB unreachable — fail open to avoid locking everyone out on DB hiccup
    return payload;
  }

  return payload;
}

export function setAuthCookie(res: Response, token: string) {
  const domain = cookieDomain();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   TTL * 1000,
    path:     "/",
    domain,
    secure:   process.env.NODE_ENV === "production",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    path:   "/",
    domain: cookieDomain(),
    secure: process.env.NODE_ENV === "production",
  });
}
