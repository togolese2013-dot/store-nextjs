import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);

export const CLIENT_COOKIE = "ts_client_token";
const TTL = 60 * 60 * 24 * 30; // 30 days

export interface ClientPayload {
  id:        number;
  nom:       string;
  email:     string | null;
  telephone: string | null;
  photo_url: string | null;
}

export async function signClientToken(payload: ClientPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET);
}

export async function verifyClientToken(token: string): Promise<ClientPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as ClientPayload;
  } catch {
    return null;
  }
}

export async function getClientSession(req: Request): Promise<ClientPayload | null> {
  const token = req.cookies?.[CLIENT_COOKIE];
  if (!token) return null;
  return verifyClientToken(token);
}

export function setClientCookie(res: Response, token: string) {
  res.cookie(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   TTL * 1000,
    path:     "/",
    secure:   process.env.NODE_ENV === "production",
  });
}

export function clearClientCookie(res: Response) {
  res.clearCookie(CLIENT_COOKIE, { path: "/" });
}
