import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../.env.local") });
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import adminAuthRoutes      from "./routes/admin/auth";
import adminProductsRoutes  from "./routes/admin/products";
import adminVariantsRoutes  from "./routes/admin/variants";
import adminStockRoutes     from "./routes/admin/stock";
import adminStockBoutiqueRoutes from "./routes/admin/stock-boutique";
import adminVentesRoutes    from "./routes/admin/ventes";
import adminLivraisonsRoutes from "./routes/admin/livraisons";
import adminFinanceRoutes   from "./routes/admin/finance";
import adminClientsRoutes   from "./routes/admin/clients";
import adminOrdersRoutes    from "./routes/admin/orders";
import adminUploadRoutes    from "./routes/admin/upload";
import adminSettingsRoutes  from "./routes/admin/settings";
import adminFournisseursRoutes from "./routes/admin/fournisseurs";
import adminCategoriesRoutes   from "./routes/admin/categories";
import adminBoutiqueClientsRoutes from "./routes/admin/boutique-clients";
import adminNewsletterRoutes from "./routes/admin/newsletter";
import adminSchemaRoutes    from "./routes/admin/schema";
import adminEventsRoutes    from "./routes/admin/events";
import adminUsersRoutes     from "./routes/admin/users";
import adminReviewsRoutes       from "./routes/admin/reviews";
import adminPaymentPlansRoutes  from "./routes/admin/payment-plans";
import adminVerificationsRoutes from "./routes/admin/verifications";
import adminCommerciauxRoutes  from "./routes/admin/commerciaux";
import { ensureCommerciauxTables } from "./routes/admin/commerciaux";
import livreurRoutes        from "./routes/livreur";
import publicRoutes         from "./routes/public";
import accountRoutes        from "./routes/account";
import ordersRoutes         from "./routes/orders";
import mobileMoneyRoutes    from "./routes/mobile-money";
import { ensureAdminUsersCols, ensureUtilisateursCols, ensureOrderLivreurCols, ensureLivraisonCols, ensureTokenVersionCols, ensureIndexes, fixSiteOrderFinanceEntries } from "@/lib/admin-db";
import adminSecurityLogsRoutes from "./routes/admin/security-logs";
import { ensureSecurityLogsTable } from "./lib/security-log";
import adminRapportsRoutes  from "./routes/admin/rapports";
import adminTendancesRoutes        from "./routes/admin/tendances";
import adminPerfProduitsRoutes     from "./routes/admin/performance-produits";
import adminWhatsappInboxRoutes, { ensureWaMessagesCols } from "./routes/admin/whatsapp-inbox";
import waWebhookRoutes, { ensureWaMessagesTable } from "./routes/whatsapp-webhook";
import analyticsRoutes       from "./routes/analytics";
import referralsRoutes       from "./routes/referrals";
import adminDeliveryZonesRoutes from "./routes/admin/delivery-zones";
import adminCouponsRoutes       from "./routes/admin/coupons";
import adminSocialRoutes        from "./routes/admin/social";
import adminWaCampagneRoutes     from "./routes/admin/whatsapp-campagne";
import { recoverMixByYasEntries, recoverCouponFinanceEntries } from "./routes/admin/finance";
import adminLivreurInscriptionsRoutes from "./routes/admin/livreur-inscriptions";
import adminEntrepotsRoutes, { ensureEntrepotsTable } from "./routes/admin/entrepots";

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

function splitEnvList(value: string | undefined): string[] {
  return value?.split(",").map(v => v.trim()).filter(Boolean) ?? [];
}

function originFromUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = new Set(
  [
    ...splitEnvList(process.env.FRONTEND_URL),
    ...splitEnvList(process.env.NEXT_PUBLIC_SITE_URL),
    ...splitEnvList(process.env.CORS_ORIGINS),
    "https://togolese.tg",
    "https://www.togolese.tg",
    "https://store.togolese.fr",
    "http://localhost:3000",
    "http://localhost:3003",
  ]
    .map(originFromUrl)
    .filter(Boolean) as string[]
);

function isAllowedOrigin(origin: string): boolean {
  const parsed = originFromUrl(origin);
  if (!parsed) return false;
  if (allowedOrigins.has(parsed)) return true;
  return /^https:\/\/([a-z0-9-]+\.)?togolese\.(tg|fr)$/i.test(parsed);
}

// ── Security middlewares ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'none'"],
      styleSrc:   ["'none'"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    // Allow any local network IP (192.168.x.x, 10.x.x.x) on any port — for mobile dev
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return cb(null, true);
    if (isAllowedOrigin(origin)) return cb(null, true);
    cb(new Error(`CORS: origine non autorisée — ${origin}`));
  },
  credentials: true,
}));

// Trust Railway's reverse proxy so X-Forwarded-For is read correctly by rate-limit
app.set("trust proxy", 1);

// Rate limiter — login endpoint: 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  keyGenerator:     (req) => ipKeyGenerator(req.ip ?? "unknown"),
});
app.use("/api/admin/auth/login", loginLimiter);

// General API rate limiter — 200 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: "Trop de requêtes. Ralentissez." },
  skip:             (req) => req.path.startsWith("/api/admin/upload"), // uploads exempt
});
app.use(generalLimiter);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(adminAuthRoutes);
app.use(adminProductsRoutes);
app.use(adminVariantsRoutes);
app.use(adminStockRoutes);
app.use(adminStockBoutiqueRoutes);
app.use(adminVentesRoutes);
app.use(adminLivraisonsRoutes);
app.use(adminFinanceRoutes);
app.use(adminClientsRoutes);
app.use(adminOrdersRoutes);
app.use(adminUploadRoutes);
app.use(adminSettingsRoutes);
app.use(adminFournisseursRoutes);
app.use(adminCategoriesRoutes);
app.use(adminBoutiqueClientsRoutes);
app.use(adminNewsletterRoutes);
app.use(adminSchemaRoutes);
app.use(adminEventsRoutes);
app.use(adminUsersRoutes);
app.use(adminReviewsRoutes);
app.use(adminPaymentPlansRoutes);
app.use(adminVerificationsRoutes);
app.use(adminCommerciauxRoutes);
app.use(adminSecurityLogsRoutes);
app.use(adminRapportsRoutes);
app.use(adminTendancesRoutes);
app.use(adminPerfProduitsRoutes);
app.use(livreurRoutes);
app.use(publicRoutes);
app.use(accountRoutes);
app.use(ordersRoutes);
app.use(mobileMoneyRoutes);
app.use(adminWhatsappInboxRoutes);
app.use(waWebhookRoutes);
app.use(analyticsRoutes);
app.use(referralsRoutes);
app.use(adminDeliveryZonesRoutes);
app.use(adminCouponsRoutes);
app.use(adminSocialRoutes);
app.use(adminWaCampagneRoutes);
app.use(adminLivreurInscriptionsRoutes);
app.use(adminEntrepotsRoutes);

app.listen(PORT, async () => {
  console.log(`[backend] Serveur démarré sur le port ${PORT}`);
  try {
    await ensureAdminUsersCols();
    console.log("[backend] admin_users schema OK");
  } catch (e) {
    console.error("[backend] ensureAdminUsersCols failed:", e);
  }
  try {
    await ensureUtilisateursCols();
    console.log("[backend] utilisateurs schema OK");
  } catch (e) {
    console.error("[backend] ensureUtilisateursCols failed:", e);
  }
  try {
    await ensureOrderLivreurCols();
    console.log("[backend] orders livreur cols OK");
  } catch (e) {
    console.error("[backend] ensureOrderLivreurCols failed:", e);
  }
try {
    await ensureCommerciauxTables();
    console.log("[backend] commerciaux tables OK");
  } catch (e) {
    console.error("[backend] ensureCommerciauxTables failed:", e);
  }
try {
    await ensureLivraisonCols();
    console.log("[backend] livraisons_ventes FK migration OK");
  } catch (e) {
    console.error("[backend] ensureLivraisonCols failed:", e);
  }
  try {
    await ensureTokenVersionCols();
    console.log("[backend] token_version cols OK");
  } catch (e) {
    console.error("[backend] ensureTokenVersionCols failed:", e);
  }
  try {
    await ensureSecurityLogsTable();
    console.log("[backend] security_logs table OK");
  } catch (e) {
    console.error("[backend] ensureSecurityLogsTable failed:", e);
  }
  try {
    await ensureIndexes();
    console.log("[backend] indexes OK");
  } catch (e) {
    console.error("[backend] ensureIndexes failed:", e);
  }
  try {
    await fixSiteOrderFinanceEntries();
    console.log("[backend] site order finance entries OK");
  } catch (e) {
    console.error("[backend] fixSiteOrderFinanceEntries failed:", e);
  }
  try {
    await ensureWaMessagesTable();
    console.log("[backend] wa_messages table OK");
  } catch (e) {
    console.error("[backend] ensureWaMessagesTable failed:", e);
  }
  try {
    await ensureWaMessagesCols();
    console.log("[backend] wa_messages media cols OK");
  } catch (e) {
    console.error("[backend] ensureWaMessagesCols failed:", e);
  }
  try {
    await ensureEntrepotsTable();
    console.log("[backend] entrepots table OK");
  } catch (e) {
    console.error("[backend] ensureEntrepotsTable failed:", e);
  }
  recoverMixByYasEntries();
  recoverCouponFinanceEntries();
});

export default app;
