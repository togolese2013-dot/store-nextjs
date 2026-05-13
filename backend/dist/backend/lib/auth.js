"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_NAME = void 0;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.getSession = getSession;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookie = clearAuthCookie;
const jose_1 = require("jose");
const admin_db_1 = require("@/lib/admin-db");
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET env var is not set. Server cannot start securely.");
    process.exit(1);
}
const SECRET = new TextEncoder().encode(jwtSecret);
exports.COOKIE_NAME = "ts_admin_token";
const TTL = 60 * 60 * 8; // 8 hours
function cookieDomain() {
    if (process.env.NODE_ENV !== "production")
        return undefined;
    if (process.env.AUTH_COOKIE_DOMAIN)
        return process.env.AUTH_COOKIE_DOMAIN;
    const siteUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
        try {
            const host = new URL(siteUrl).hostname;
            if (host === "togolese.tg" || host.endsWith(".togolese.tg"))
                return ".togolese.tg";
            if (host === "togolese.fr" || host.endsWith(".togolese.fr"))
                return ".togolese.fr";
        }
        catch {
            // Fall back to host-only cookies if the configured URL is malformed.
        }
    }
    return undefined;
}
async function signToken(payload) {
    return new jose_1.SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TTL}s`)
        .sign(SECRET);
}
async function verifyToken(token) {
    try {
        const { payload } = await (0, jose_1.jwtVerify)(token, SECRET);
        return payload;
    }
    catch {
        return null;
    }
}
async function getSession(req) {
    const token = req.cookies?.[exports.COOKIE_NAME];
    if (!token)
        return null;
    const payload = await verifyToken(token);
    if (!payload)
        return null;
    // Verify token_version matches DB — catches revoked tokens (logout, password change)
    try {
        const table = payload.role === "staff" ? "utilisateurs" : "admin_users";
        const dbVersion = await (0, admin_db_1.getTokenVersion)(table, Number(payload.id));
        if (payload.token_version !== dbVersion)
            return null;
    }
    catch {
        // DB unreachable — fail open to avoid locking everyone out on DB hiccup
        return payload;
    }
    return payload;
}
function setAuthCookie(res, token) {
    const domain = cookieDomain();
    res.cookie(exports.COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: TTL * 1000,
        path: "/",
        domain,
        secure: process.env.NODE_ENV === "production",
    });
}
function clearAuthCookie(res) {
    res.clearCookie(exports.COOKIE_NAME, {
        path: "/",
        domain: cookieDomain(),
        secure: process.env.NODE_ENV === "production",
    });
}
