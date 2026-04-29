import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";
import type { AdminPermissions } from "@/lib/admin-permissions";

export type { AdminPermissions };

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);

export const COOKIE_NAME = "ts_admin_token";
const TTL = 60 * 60 * 8; // 8 hours

export interface AdminPayload {
  id:                  number;
  username:            string;
  email:               string | null;
  nom:                 string;
  role:                string;
  poste?:              string;
  permissions:         AdminPermissions | null;
  must_change_password?: boolean;
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
  return verifyToken(token);
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   TTL * 1000,
    path:     "/",
    secure:   process.env.NODE_ENV === "production",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
