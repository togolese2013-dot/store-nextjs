import { cookies } from "next/headers";
import { hasPageAccess, type AdminPermissions, type ModuleKey } from "@/lib/admin-permissions";

interface AdminTokenPayload {
  role:        string;
  permissions: AdminPermissions | null;
}

/** Decode JWT from cookie without verifying — for UI-only permission checks in RSC.
 *  Security is enforced on the backend (double layer). */
export async function getAdminSessionFromCookie(): Promise<AdminTokenPayload | null> {
  try {
    const jar   = await cookies();
    const token = jar.get("ts_admin_token")?.value;
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64     = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    return { role: decoded.role ?? "unknown", permissions: decoded.permissions ?? null };
  } catch {
    return null;
  }
}

/** Returns true if current admin can perform an action.
 *  super_admin and admin always return true. */
export async function adminCan(module: ModuleKey, pageId: string): Promise<boolean> {
  const session = await getAdminSessionFromCookie();
  if (!session) return false;
  if (["super_admin", "admin"].includes(session.role)) return true;
  return hasPageAccess(session.role, session.permissions, module, pageId);
}
