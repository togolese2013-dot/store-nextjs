import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
import livreurRoutes        from "./routes/livreur";
import publicRoutes         from "./routes/public";
import accountRoutes        from "./routes/account";
import ordersRoutes         from "./routes/orders";
import mobileMoneyRoutes    from "./routes/mobile-money";
import { ensureAdminUsersCols, ensureUtilisateursCols, ensureOrderLivreurCols } from "@/lib/admin-db";

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3003",
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origine non autorisée — ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
});

export default app;
