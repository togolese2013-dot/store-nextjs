# Graph Report - .  (2026-05-06)

## Corpus Check
- Large corpus: 254 files · ~189,040 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1090 nodes · 1809 edges · 101 communities (90 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.83)
- Token cost: 6,480 input · 3,504 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Navigation & Layout|Admin Navigation & Layout]]
- [[_COMMUNITY_Boutique Categories & Stock|Boutique Categories & Stock]]
- [[_COMMUNITY_Admin Order & Delivery Management|Admin Order & Delivery Management]]
- [[_COMMUNITY_Admin Events & Media Upload|Admin Events & Media Upload]]
- [[_COMMUNITY_Admin Settings & Configuration|Admin Settings & Configuration]]
- [[_COMMUNITY_Purchases, Reviews & Products|Purchases, Reviews & Products]]
- [[_COMMUNITY_Theme & Design Customization|Theme & Design Customization]]
- [[_COMMUNITY_CRM & Client Management|CRM & Client Management]]
- [[_COMMUNITY_Order Processing Actions|Order Processing Actions]]
- [[_COMMUNITY_Invoice & Document Printing|Invoice & Document Printing]]
- [[_COMMUNITY_Product Form & Image Upload|Product Form & Image Upload]]
- [[_COMMUNITY_Backend Business Logic|Backend Business Logic]]
- [[_COMMUNITY_Sales Management (Ventes)|Sales Management (Ventes)]]
- [[_COMMUNITY_Order Database Layer|Order Database Layer]]
- [[_COMMUNITY_User & Admin Management|User & Admin Management]]
- [[_COMMUNITY_Architecture Documentation|Architecture Documentation]]
- [[_COMMUNITY_DB Migration Scripts|DB Migration Scripts]]
- [[_COMMUNITY_Project Overview & Auth Docs|Project Overview & Auth Docs]]
- [[_COMMUNITY_Shopping Cart Frontend|Shopping Cart Frontend]]
- [[_COMMUNITY_Admin User CRUD|Admin User CRUD]]
- [[_COMMUNITY_CRM Client Edit|CRM Client Edit]]
- [[_COMMUNITY_Deliveries Manager|Deliveries Manager]]
- [[_COMMUNITY_Add Product Modal|Add Product Modal]]
- [[_COMMUNITY_Product Detail & Reviews|Product Detail & Reviews]]
- [[_COMMUNITY_Delivery Routes DB|Delivery Routes DB]]
- [[_COMMUNITY_Payment Plans & Orders|Payment Plans & Orders]]
- [[_COMMUNITY_Brand Color System|Brand Color System]]
- [[_COMMUNITY_PWA Icons & Brand Assets|PWA Icons & Brand Assets]]
- [[_COMMUNITY_Checkout Page|Checkout Page]]
- [[_COMMUNITY_Wishlist|Wishlist]]
- [[_COMMUNITY_Categories Manager|Categories Manager]]
- [[_COMMUNITY_Boutique Stock Manager|Boutique Stock Manager]]
- [[_COMMUNITY_Achats Manager|Achats Manager]]
- [[_COMMUNITY_Delivery Zones Manager|Delivery Zones Manager]]
- [[_COMMUNITY_Recently Viewed Products|Recently Viewed Products]]
- [[_COMMUNITY_Account Verifications|Account Verifications]]
- [[_COMMUNITY_Client Messaging|Client Messaging]]
- [[_COMMUNITY_Stock Movement Modal|Stock Movement Modal]]
- [[_COMMUNITY_Admin Routing Docs|Admin Routing Docs]]
- [[_COMMUNITY_Product Audio Images|Product Audio Images]]
- [[_COMMUNITY_Boutique Stock Routes|Boutique Stock Routes]]
- [[_COMMUNITY_Fournisseurs Manager|Fournisseurs Manager]]
- [[_COMMUNITY_Payment Plans Manager|Payment Plans Manager]]
- [[_COMMUNITY_DB Auto-Init Documentation|DB Auto-Init Documentation]]
- [[_COMMUNITY_Shop Homepage|Shop Homepage]]
- [[_COMMUNITY_Account Dropdown & Auth|Account Dropdown & Auth]]
- [[_COMMUNITY_Coupons Manager|Coupons Manager]]
- [[_COMMUNITY_Store URL & Social Share|Store URL & Social Share]]
- [[_COMMUNITY_Loyalty Program Manager|Loyalty Program Manager]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_User Account Page|User Account Page]]
- [[_COMMUNITY_Add to Cart Action|Add to Cart Action]]
- [[_COMMUNITY_Related Products Manager|Related Products Manager]]
- [[_COMMUNITY_Newsletter Manager|Newsletter Manager]]
- [[_COMMUNITY_Moov Money Brand|Moov Money Brand]]
- [[_COMMUNITY_Product Image Gallery Simple|Product Image Gallery Simple]]
- [[_COMMUNITY_ImportExport Manager|Import/Export Manager]]
- [[_COMMUNITY_PWA Icon Generation Scripts|PWA Icon Generation Scripts]]
- [[_COMMUNITY_Address Book|Address Book]]
- [[_COMMUNITY_Delivery Code Page|Delivery Code Page]]
- [[_COMMUNITY_Product Upload Images|Product Upload Images]]
- [[_COMMUNITY_DB Schema Docs|DB Schema Docs]]
- [[_COMMUNITY_Reviews DB Schema|Reviews DB Schema]]

## God Nodes (most connected - your core abstractions)
1. `formatPrice()` - 34 edges
2. `getSession()` - 29 edges
3. `apiGet()` - 24 edges
4. `getAdminSession()` - 24 edges
5. `Togolese Shop` - 20 edges
6. `getSettings()` - 16 edges
7. `HANDOFF — Togolese Shop Admin` - 15 edges
8. `applyThemeToDOM()` - 12 edges
9. `getSetting()` - 12 edges
10. `useCart()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AdminProductsPage()` --calls--> `apiGet()`  [INFERRED]
  app/admin/products/page.tsx → lib/api.ts
- `EditProductPage()` --calls--> `apiGet()`  [INFERRED]
  app/admin/products/[id]/page.tsx → lib/api.ts
- `RapportsPage()` --calls--> `getAdminSession()`  [INFERRED]
  app/admin/rapports/page.tsx → lib/auth.ts
- `AchatsPage()` --calls--> `apiGet()`  [INFERRED]
  app/admin/achats/page.tsx → lib/api.ts
- `CommerciauxPage()` --calls--> `getAdminSession()`  [INFERRED]
  app/admin/commerciaux/page.tsx → lib/auth.ts

## Communities (101 total, 11 thin omitted)

### Community 0 - "Admin Navigation & Layout"
Cohesion: 0.06
Nodes (22): AdminLayout(), AdminSSEProvider(), useAdminSSE(), requireSuperAdmin(), AdminZoneLayout(), BoutiqueClientsPage(), BoutiqueSegmentationPage(), CommerciauxPage() (+14 more)

### Community 1 - "Boutique Categories & Stock"
Cohesion: 0.06
Nodes (25): CategoriesPage(), countBoutiqueClients(), createBoutiqueClient(), createCategory(), createMarque(), createStockAjustement(), createStockEntree(), createStockSortie() (+17 more)

### Community 2 - "Admin Order & Delivery Management"
Cohesion: 0.06
Nodes (9): CartProvider(), EditProductPage(), getOrdersStats(), apiGet(), apiPost(), getCookieHeader(), LivraisonsPage(), AdminProductsPage() (+1 more)

### Community 3 - "Admin Events & Media Upload"
Cohesion: 0.09
Nodes (19): ensureCommerciauxTables(), ensureWhatsappMessagesTable(), approveReview(), deleteNewsletterSubscriber(), deleteReview(), ensureAdminUsersCols(), ensureOrderLivreurCols(), getAdminByEmail() (+11 more)

### Community 4 - "Admin Settings & Configuration"
Cohesion: 0.07
Nodes (9): updateSlide(), uploadImage(), DomainSettingsPage(), HeroSettingsPage(), getSettings(), PaymentSettingsPage(), SettingsPage(), ThemeSettingsPage() (+1 more)

### Community 5 - "Purchases, Reviews & Products"
Cohesion: 0.11
Nodes (21): AchatsPage(), countAchats(), createReview(), getAchatStats(), getStockStats(), listAchats(), listReviews(), checkReviewsTable() (+13 more)

### Community 6 - "Theme & Design Customization"
Cohesion: 0.15
Nodes (24): applyPreset(), handleAccent(), handleFont(), handlePrimary(), rampHex(), save(), ThemeVars(), getSetting() (+16 more)

### Community 8 - "Order Processing Actions"
Cohesion: 0.09
Nodes (9): getOrderById(), getOrderEvents(), clearClientCookie(), getClientSession(), setClientCookie(), signClientToken(), verifyClientToken(), findUser() (+1 more)

### Community 9 - "Invoice & Document Printing"
Cohesion: 0.08
Nodes (6): calcTotals(), deleteDevis(), emptyModal(), openModal(), saveDevis(), showFlash()

### Community 10 - "Product Form & Image Upload"
Cohesion: 0.11
Nodes (16): handleUploadMain(), handleUploadSecondary(), set(), toBase64(), updateVariant(), uploadFiles(), uploadVariantImage(), autoNom() (+8 more)

### Community 11 - "Backend Business Logic"
Cohesion: 0.1
Nodes (19): createAchat(), createFournisseur(), deleteFacture(), deleteFinanceEntry(), deleteFournisseur(), financeEntrieCols(), getAchatById(), getFactureById() (+11 more)

### Community 12 - "Sales Management (Ventes)"
Cohesion: 0.1
Nodes (7): closeModal(), emptyModal(), handleDelete(), openModal(), showFlash(), submitEdit(), submitVente()

### Community 13 - "Order Database Layer"
Cohesion: 0.12
Nodes (19): applyOrderDeliveredEffects(), applyOrderPaidEffects(), countOrders(), createDevis(), createFacture(), createFinanceEntry(), createManualLivraison(), createOrder() (+11 more)

### Community 15 - "Architecture Documentation"
Cohesion: 0.14
Nodes (18): lib/admin-events.ts (SSE EventEmitter singleton), AdminShell.tsx (SSE EventSource, auto-refresh), BoutiqueClientsManager.tsx, emitAdminEvent() (SSE push from mutation routes), FinanceManager.tsx, LivraisonsManager.tsx, MouvementModal.tsx (Entrée/Sortie/Ajustement), MySQL direct via mysql2/promise (no Prisma) (+10 more)

### Community 16 - "DB Migration Scripts"
Cohesion: 0.18
Nodes (16): clean_create(), main(), parse_create_columns(), produits_block(), Prépare CREATE TABLE pour MySQL 8., Retourne la liste ordonnée des colonnes du CREATE TABLE., Retire la valeur à la position index (0-based) d'un tuple SQL., Transforme un INSERT positionnel en INSERT IGNORE avec colonnes explicites, (+8 more)

### Community 17 - "Project Overview & Auth Docs"
Cohesion: 0.12
Nodes (17): app/api/admin — Admin API routes, app/(shop) — Public storefront, bcryptjs (password hashing), CartContext.tsx (localStorage, variant-aware), JWT via jose (httpOnly cookies), lib/auth.ts (JWT session), lib/utils.ts (Product type, formatPrice, finalPrice), Next.js 15 (App Router) (+9 more)

### Community 18 - "Shopping Cart Frontend"
Cohesion: 0.21
Nodes (4): Header(), useWishlistCount(), calcPrice(), useCart()

### Community 19 - "Admin User CRUD"
Cohesion: 0.16
Nodes (13): createAdminUser(), createUtilisateur(), deleteAdminUser(), deleteUtilisateur(), ensureUtilisateursCols(), getAdminByUsername(), listAdminUsers(), listAllUtilisateurModules() (+5 more)

### Community 20 - "CRM Client Edit"
Cohesion: 0.18
Nodes (10): ClientPage(), countClients(), deleteClient(), getClientById(), getClientByPhone(), getClientOrders(), getClientStats(), getCRMStats() (+2 more)

### Community 21 - "Deliveries Manager"
Cohesion: 0.21
Nodes (7): changeStatut(), handleAssign(), handleCreateLivreur(), handleCreateManual(), handleDelete(), handleDeleteLivreur(), showFlash()

### Community 22 - "Add Product Modal"
Cohesion: 0.19
Nodes (7): closeModal(), handleMainImage(), handleSecondaryImages(), handleSubmit(), toBase64(), uploadFiles(), uploadVariantImage()

### Community 23 - "Product Detail & Reviews"
Cohesion: 0.29
Nodes (8): getProduitColumns(), getRelatedProducts(), getRelatedProductsWithDetails(), relatedTableExists(), relatedToProduct(), finalPrice(), fetchProductBySlug(), generateMetadata()

### Community 24 - "Delivery Routes DB"
Cohesion: 0.17
Nodes (11): createLivreur(), deleteLivraison(), deleteLivreur(), ensureLivraisonCols(), ensureLivreurCols(), generateCode(), getLivraisonsStats(), listLivraisonsAdmin() (+3 more)

### Community 25 - "Payment Plans & Orders"
Cohesion: 0.2
Nodes (8): ensurePaymentTables(), addOrderEvent(), cancelPaymentPlan(), createPaymentPlan(), getPaymentPlanByOrderId(), listPaymentPlans(), markTranchePaid(), markTrancheUnpaid()

### Community 26 - "Brand Color System"
Cohesion: 0.24
Nodes (12): Dark Green Color (#047857), Color: Green #86efac (Tailwind green-300), Light Green Color (#22c55e), Color: White (#ffffff), Helvetica Neue / Arial Black Font Family, Logo Text: 'shop' (green #86efac, regular weight), Logo Text: 'Togolese' (white, bold), Togolese Shop Logo SVG (+4 more)

### Community 27 - "PWA Icons & Brand Assets"
Cohesion: 0.24
Nodes (12): Dark Blue (#00377d), Yellow (#ffd100), PWA Icon 192x192 — dark navy blue background (#0f2060 approx), bold white capital letter T centered, sans-serif font, minimal flat design, PWA Icon 512x512 — dark navy blue square background with a large bold white letter T centered, minimal flat design, no rounded corners, Rounded rectangle background, Logo Mixx by Yas (SVG), BY YAS lettering, MIXX lettering (X-pattern wordmark) (+4 more)

### Community 28 - "Checkout Page"
Cohesion: 0.25
Nodes (4): handleSubmit(), normalizeLocalPhone(), saveCurrentAddress(), validate()

### Community 29 - "Wishlist"
Cohesion: 0.25
Nodes (6): getWishlist(), saveWishlist(), toggleWishlist(), getWishlistIds(), handler(), load()

### Community 30 - "Categories Manager"
Cohesion: 0.22
Nodes (4): closeMarqueModal(), closeModal(), handleMarqueSave(), handleSave()

### Community 31 - "Boutique Stock Manager"
Cohesion: 0.22
Nodes (3): closeModal(), showFlash(), submitMouvement()

### Community 33 - "Achats Manager"
Cohesion: 0.22
Nodes (3): emptyLine(), handleSave(), resetForm()

### Community 34 - "Delivery Zones Manager"
Cohesion: 0.24
Nodes (3): DeliverySettingsPage(), getDeliveryZones(), NewOrderPage()

### Community 38 - "Stock Movement Modal"
Cohesion: 0.27
Nodes (4): closeModal(), emptyItem(), openModal(), reset()

### Community 39 - "Admin Routing Docs"
Cohesion: 0.2
Nodes (10): ROUTE_TO_MODULE sidebar routing (startsWith order), AdminSidebar.tsx, app/admin — Back-office (JWT protected), Admin Module: BOUTIQUE, Admin Module: CRM, Admin Module: MAGASIN, Admin Module: STORE, ProductForm.tsx (+2 more)

### Community 40 - "Product Audio Images"
Cohesion: 0.22
Nodes (10): Audio Electronics, Black, Orange, JBL, JBL Wireless Microphone Set (2 mics + USB receiver), Karaoke / Live Performance Use Case, Product Image Upload, USB Wireless Receiver Dongle (+2 more)

### Community 42 - "Boutique Stock Routes"
Cohesion: 0.39
Nodes (7): createBoutiqueMouvement(), ensureBoutiqueStockPopulated(), getProduitColsAdmin(), getRecentBoutiqueMovements(), getStockBoutiqueList(), getStockBoutiqueStats(), StockBoutiquePage()

### Community 43 - "Fournisseurs Manager"
Cohesion: 0.28
Nodes (4): closeModal(), handleSave(), FournisseursPage(), listFournisseurs()

### Community 45 - "Payment Plans Manager"
Cohesion: 0.28
Nodes (3): loadTranches(), toggleExpand(), toggleTranche()

### Community 46 - "DB Auto-Init Documentation"
Cohesion: 0.25
Nodes (9): Auto-init DB tables (no manual migration), DB Table: boutique_clients, DB Table: boutique_stock, DB Table: factures (ventes boutique), DB Table: livraisons_ventes, createVenteWithStock (atomic transaction), lib/admin-db.ts (admin queries), DB Table: clients (CRM) (+1 more)

### Community 50 - "Account Dropdown & Auth"
Cohesion: 0.43
Nodes (6): clearLocalStorage(), handleLogin(), handleLogout(), handleRegister(), resetForm(), syncLocalStorage()

### Community 52 - "Store URL & Social Share"
Cohesion: 0.32
Nodes (3): handleSaveShare(), handleSaveUrl(), saveSettings()

### Community 53 - "Loyalty Program Manager"
Cohesion: 0.32
Nodes (3): FidelitePage(), getLoyaltyStats(), listLoyaltyClients()

### Community 55 - "User Account Page"
Cohesion: 0.48
Nodes (4): handleLogin(), handleRegister(), resetForm(), syncLocalStorage()

### Community 57 - "Add to Cart Action"
Cohesion: 0.33
Nodes (4): addItem(), handleAdd(), handleAdd(), handleAdd()

### Community 58 - "Related Products Manager"
Cohesion: 0.53
Nodes (4): addRelated(), loadRelated(), removeRelated(), updateType()

### Community 62 - "Moov Money Brand"
Cohesion: 0.53
Nodes (6): Moov Money Logo SVG, Money Text Element (white, bold), Moov Money (Brand/Service), MOOV Text Element (blue, bold), Orange Diamond Shape (Logo Background), Payment Method Asset

### Community 63 - "Product Image Gallery Simple"
Cohesion: 0.6
Nodes (3): next(), onKey(), prev()

### Community 64 - "Import/Export Manager"
Cohesion: 0.6
Nodes (3): handleFile(), onDrop(), onFileChange()

### Community 65 - "PWA Icon Generation Scripts"
Cohesion: 0.8
Nodes (4): chunk(), crc32(), makePNG(), u32()

### Community 70 - "Address Book"
Cohesion: 0.83
Nodes (3): handleAdd(), handleDelete(), persist()

### Community 76 - "Product Upload Images"
Cohesion: 0.83
Nodes (4): Flock of birds silhouetted against a pink and orange sunset sky, Flock of birds in flight, Silhouette photography style, Sunset sky with pink and orange clouds

### Community 80 - "DB Schema Docs"
Cohesion: 0.67
Nodes (3): lib/db.ts (MySQL pool, public queries), DB Table: product_variants, DB Table: produits

## Knowledge Gaps
- **51 isolated node(s):** `Retourne [(table, create_sql, insert_sql), ...]`, `Prépare CREATE TABLE pour MySQL 8.`, `Retourne la liste ordonnée des colonnes du CREATE TABLE.`, `Retire la valeur à la position index (0-based) d'un tuple SQL.`, `Transforme un INSERT positionnel en INSERT IGNORE avec colonnes explicites,` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatPrice()` connect `CRM & Client Management` to `Commerciaux Manager`, `Admin Navigation & Layout`, `Achats Manager`, `Recently Viewed Products`, `Order Processing Actions`, `Invoice & Document Printing`, `Sales Management (Ventes)`, `Payment Plans Manager`, `Product Quick Actions`, `Shopping Cart Frontend`, `CRM Client Edit`, `Product Detail & Reviews`, `Add to Cart Action`, `Boutique Clients Manager`, `Checkout Page`, `Wishlist`, `Boutique Stock Manager`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `apiGet()` connect `Admin Order & Delivery Management` to `Product Quick Actions`, `Shop Homepage`, `Purchases, Reviews & Products`, `Product Detail & Reviews`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `set()` connect `Product Form & Image Upload` to `DB Migration Scripts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getSession()` (e.g. with `requireLivreur()` and `requireSuperAdmin()`) actually correct?**
  _`getSession()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `apiGet()` (e.g. with `AdminProductsPage()` and `EditProductPage()`) actually correct?**
  _`apiGet()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `getAdminSession()` (e.g. with `AdminLayout()` and `RapportsPage()`) actually correct?**
  _`getAdminSession()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Retourne [(table, create_sql, insert_sql), ...]`, `Prépare CREATE TABLE pour MySQL 8.`, `Retourne la liste ordonnée des colonnes du CREATE TABLE.` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._