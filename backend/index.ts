import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

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
import adminWhatsappRoutes, { ensureWhatsappMessagesTable } from "./routes/admin/whatsapp";
import adminCommerciauxRoutes  from "./routes/admin/commerciaux";
import { ensureCommerciauxTables } from "./routes/admin/commerciaux";
import livreurRoutes        from "./routes/livreur";
import publicRoutes         from "./routes/public";
import accountRoutes        from "./routes/account";
import ordersRoutes         from "./routes/orders";
import mobileMoneyRoutes    from "./routes/mobile-money";
import { ensureAdminUsersCols, ensureUtilisateursCols, ensureOrderLivreurCols, migrateAdminLivreursToTeam, ensureLivraisonCols } from "@/lib/admin-db";

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3003",
].filter(Boolean) as string[];

// ── Security middlewares ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images/assets cross-origin
  contentSecurityPolicy: false,                          // handled by Next.js
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    // Allow any local network IP (192.168.x.x, 10.x.x.x) on any port — for mobile dev
    if (/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS: origine non autorisée — ${origin}`));
  },
  credentials: true,
}));

// Rate limiter — login endpoint: 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  keyGenerator:     (req) => req.ip ?? "unknown",
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
app.use(adminWhatsappRoutes);
app.use(adminCommerciauxRoutes);
app.use(livreurRoutes);
app.use(publicRoutes);
app.use(accountRoutes);
app.use(ordersRoutes);
app.use(mobileMoneyRoutes);

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
    await migrateAdminLivreursToTeam();
    console.log("[backend] livreurs migration OK");
  } catch (e) {
    console.error("[backend] migrateAdminLivreursToTeam failed:", e);
  }
  try {
    await ensureCommerciauxTables();
    console.log("[backend] commerciaux tables OK");
  } catch (e) {
    console.error("[backend] ensureCommerciauxTables failed:", e);
  }
  try {
    await ensureWhatsappMessagesTable();
    console.log("[backend] whatsapp_messages table OK");
  } catch (e) {
    console.error("[backend] ensureWhatsappMessagesTable failed:", e);
  }
  try {
    await ensureLivraisonCols();
    console.log("[backend] livraisons_ventes FK migration OK");
  } catch (e) {
    console.error("[backend] ensureLivraisonCols failed:", e);
  }
});

export default app;
