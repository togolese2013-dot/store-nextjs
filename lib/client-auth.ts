import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024"
);

export const CLIENT_COOKIE = "ts_client_token";
const TTL = 60 * 60 * 24 * 30; // 30 days

export interface ClientSession {
  id: number;
  nom: string;
  email: string | null;
  telephone: string | null;
  photo_url: string | null;
}

export async function signClientToken(payload: ClientSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET);
}

export async function verifyClientToken(token: string): Promise<ClientSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as ClientSession;
  } catch {
    return null;
  }
}

export async function getClientSession(): Promise<ClientSession | null> {
  const jar = await cookies();
  const token = jar.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  return verifyClientToken(token);
}
