"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_COOKIE = void 0;
exports.signClientToken = signClientToken;
exports.verifyClientToken = verifyClientToken;
exports.getClientSession = getClientSession;
exports.setClientCookie = setClientCookie;
exports.clearClientCookie = clearClientCookie;
const jose_1 = require("jose");
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "togolese-shop-secret-change-in-production-2024");
exports.CLIENT_COOKIE = "ts_client_token";
const TTL = 60 * 60 * 24 * 30; // 30 days
async function signClientToken(payload) {
    return new jose_1.SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TTL}s`)
        .sign(SECRET);
}
async function verifyClientToken(token) {
    try {
        const { payload } = await (0, jose_1.jwtVerify)(token, SECRET);
        return payload;
    }
    catch {
        return null;
    }
}
async function getClientSession(req) {
    const token = req.cookies?.[exports.CLIENT_COOKIE];
    if (!token)
        return null;
    return verifyClientToken(token);
}
function setClientCookie(res, token) {
    res.cookie(exports.CLIENT_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: TTL * 1000,
        path: "/",
        secure: process.env.NODE_ENV === "production",
    });
}
function clearClientCookie(res) {
    res.clearCookie(exports.CLIENT_COOKIE, { path: "/" });
}
