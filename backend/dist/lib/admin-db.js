"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProduitsWithStock = getProduitsWithStock;
exports.createStockEntree = createStockEntree;
exports.createStockSortie = createStockSortie;
exports.createStockAjustement = createStockAjustement;
exports.getStockMovementCounts = getStockMovementCounts;
exports.getStockMovements = getStockMovements;
exports.ensureAdminUsersCols = ensureAdminUsersCols;
exports.getAdminByEmail = getAdminByEmail;
exports.getAdminByUsername = getAdminByUsername;
exports.getAdminById = getAdminById;
exports.listAdminUsers = listAdminUsers;
exports.createAdminUser = createAdminUser;
exports.updateAdminLastLogin = updateAdminLastLogin;
exports.updateAdminPassword = updateAdminPassword;
exports.updateUtilisateurPassword = updateUtilisateurPassword;
exports.updateAdminUser = updateAdminUser;
exports.deleteAdminUser = deleteAdminUser;
exports.ensureUtilisateursCols = ensureUtilisateursCols;
exports.ensureOrderLivreurCols = ensureOrderLivreurCols;
exports.migrateAdminLivreursToTeam = migrateAdminLivreursToTeam;
exports.listUtilisateurs = listUtilisateurs;
exports.getUtilisateurById = getUtilisateurById;
exports.getUtilisateurByUsername = getUtilisateurByUsername;
exports.createUtilisateur = createUtilisateur;
exports.updateUtilisateur = updateUtilisateur;
exports.deleteUtilisateur = deleteUtilisateur;
exports.listPermissions = listPermissions;
exports.listAllUtilisateurModules = listAllUtilisateurModules;
exports.getUtilisateurPermissions = getUtilisateurPermissions;
exports.setUtilisateurPermissions = setUtilisateurPermissions;
exports.getSettings = getSettings;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.setSettings = setSettings;
exports.getDeliveryZones = getDeliveryZones;
exports.upsertDeliveryZone = upsertDeliveryZone;
exports.deleteDeliveryZone = deleteDeliveryZone;
exports.listOrders = listOrders;
exports.countOrders = countOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.updateOrderFields = updateOrderFields;
exports.deleteOrder = deleteOrder;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.ensureOrderVente = ensureOrderVente;
exports.applyOrderDeliveredEffects = applyOrderDeliveredEffects;
exports.applyOrderPaidEffects = applyOrderPaidEffects;
exports.addOrderEvent = addOrderEvent;
exports.getOrderEvents = getOrderEvents;
exports.getDashboardStats = getDashboardStats;
exports.getOrdersStats = getOrdersStats;
exports.listWaMessages = listWaMessages;
exports.markMessagesRead = markMessagesRead;
exports.saveIncomingMessage = saveIncomingMessage;
exports.listReviews = listReviews;
exports.createReview = createReview;
exports.approveReview = approveReview;
exports.deleteReview = deleteReview;
exports.listCoupons = listCoupons;
exports.upsertCoupon = upsertCoupon;
exports.deleteCoupon = deleteCoupon;
exports.listAdminCategories = listAdminCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.listClients = listClients;
exports.countClients = countClients;
exports.getClientByPhone = getClientByPhone;
exports.getClientById = getClientById;
exports.upsertClient = upsertClient;
exports.deleteClient = deleteClient;
exports.getClientOrders = getClientOrders;
exports.getClientStats = getClientStats;
exports.getCRMStats = getCRMStats;
exports.listEntrepots = listEntrepots;
exports.getEntrepots = getEntrepots;
exports.upsertEntrepot = upsertEntrepot;
exports.deleteEntrepot = deleteEntrepot;
exports.updateProductStock = updateProductStock;
exports.getStockStats = getStockStats;
exports.getStockBoutiqueStats = getStockBoutiqueStats;
exports.getStockBoutiqueList = getStockBoutiqueList;
exports.createBoutiqueMouvement = createBoutiqueMouvement;
exports.getRecentBoutiqueMovements = getRecentBoutiqueMovements;
exports.listFactures = listFactures;
exports.getFacturePaiements = getFacturePaiements;
exports.getFactureById = getFactureById;
exports.getClientFacturesByNom = getClientFacturesByNom;
exports.createFacture = createFacture;
exports.createVenteWithStock = createVenteWithStock;
exports.updateFactureStatut = updateFactureStatut;
exports.updateFacture = updateFacture;
exports.deleteFacture = deleteFacture;
exports.listDevis = listDevis;
exports.createDevis = createDevis;
exports.createPaymentPlan = createPaymentPlan;
exports.listPaymentPlans = listPaymentPlans;
exports.getPaymentPlanByOrderId = getPaymentPlanByOrderId;
exports.markTranchePaid = markTranchePaid;
exports.markTrancheUnpaid = markTrancheUnpaid;
exports.cancelPaymentPlan = cancelPaymentPlan;
exports.updateDevisStatut = updateDevisStatut;
exports.deleteDevis = deleteDevis;
exports.listLivraisons = listLivraisons;
exports.updateLivraisonStatut = updateLivraisonStatut;
exports.deleteLivraison = deleteLivraison;
exports.listFinanceEntries = listFinanceEntries;
exports.getFinanceStats = getFinanceStats;
exports.createFinanceEntry = createFinanceEntry;
exports.updateFinanceEntry = updateFinanceEntry;
exports.deleteFinanceEntry = deleteFinanceEntry;
exports.invalidateVentesStats = invalidateVentesStats;
exports.getVentesStats = getVentesStats;
exports.getLivraisonsStats = getLivraisonsStats;
exports.listFournisseurs = listFournisseurs;
exports.createFournisseur = createFournisseur;
exports.updateFournisseur = updateFournisseur;
exports.deleteFournisseur = deleteFournisseur;
exports.listAchats = listAchats;
exports.countAchats = countAchats;
exports.getAchatStats = getAchatStats;
exports.getAchatById = getAchatById;
exports.createAchat = createAchat;
exports.updateAchatStatut = updateAchatStatut;
exports.deleteAchat = deleteAchat;
exports.updateAchat = updateAchat;
exports.recevoirAchat = recevoirAchat;
exports.listLivreurs = listLivreurs;
exports.getLivreurByCode = getLivreurByCode;
exports.createLivreur = createLivreur;
exports.updateLivreur = updateLivreur;
exports.deleteLivreur = deleteLivreur;
exports.ensureLivraisonCols = ensureLivraisonCols;
exports.listLivraisonsAdmin = listLivraisonsAdmin;
exports.updateLivraisonAdmin = updateLivraisonAdmin;
exports.accepterLivraison = accepterLivraison;
exports.createManualLivraison = createManualLivraison;
exports.getLivraisonsForLivreur = getLivraisonsForLivreur;
exports.listBoutiqueClients = listBoutiqueClients;
exports.countBoutiqueClients = countBoutiqueClients;
exports.getBoutiqueClientById = getBoutiqueClientById;
exports.createBoutiqueClient = createBoutiqueClient;
exports.updateBoutiqueClient = updateBoutiqueClient;
exports.deleteBoutiqueClient = deleteBoutiqueClient;
exports.getBoutiqueClientsStats = getBoutiqueClientsStats;
exports.listLoyaltyClients = listLoyaltyClients;
exports.getLoyaltyHistory = getLoyaltyHistory;
exports.addLoyaltyPointsManual = addLoyaltyPointsManual;
exports.listReferrals = listReferrals;
exports.listNewsletterSubscribers = listNewsletterSubscribers;
exports.deleteNewsletterSubscriber = deleteNewsletterSubscriber;
exports.listSiteClients = listSiteClients;
exports.getLoyaltyStats = getLoyaltyStats;
exports.listAdminMarques = listAdminMarques;
exports.createMarque = createMarque;
exports.updateMarque = updateMarque;
exports.deleteMarque = deleteMarque;
exports.ensureTokenVersionCols = ensureTokenVersionCols;
exports.getTokenVersion = getTokenVersion;
exports.incrementTokenVersion = incrementTokenVersion;
exports.ensureIndexes = ensureIndexes;
const db_1 = require("./db");
async function getProduitsWithStock() {
    const [rows] = await db_1.db.query(`SELECT id AS produit_id, nom, reference,
            COALESCE(stock_magasin, 0) AS stock
     FROM produits
     WHERE actif = 1
     ORDER BY nom`);
    return rows;
}
// Entrée stock magasin
async function createStockEntree(data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(`UPDATE produits SET stock_magasin = COALESCE(stock_magasin, 0) + ? WHERE id = ?`, [data.quantite, data.produit_id]);
        const [[stockRow]] = await conn.execute(`SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`, [data.produit_id]);
        const stockApres = Number(stockRow?.stock ?? 0);
        await conn.execute(`INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'entree', ?, ?, ?, ?, ?)`, [data.produit_id, data.quantite, stockApres, data.reference ?? null, data.note ?? null, data.user_id ?? null]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
// Sortie stock magasin → boutique
async function createStockSortie(data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const [[row]] = await conn.execute(`SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`, [data.produit_id]);
        const available = Number(row?.stock ?? 0);
        if (available < data.quantite) {
            throw new Error(`Stock insuffisant : ${available} disponible(s), ${data.quantite} demandé(s)`);
        }
        // Decrement magasin, increment boutique
        await conn.execute(`UPDATE produits
       SET stock_magasin  = GREATEST(0, COALESCE(stock_magasin, 0) - ?),
           stock_boutique = COALESCE(stock_boutique, 0) + ?
       WHERE id = ?`, [data.quantite, data.quantite, data.produit_id]);
        const stockApres = available - data.quantite;
        await conn.execute(`INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'retrait', ?, ?, ?, ?, ?)`, [data.produit_id, data.quantite, stockApres, data.reference ?? null, data.note ?? null, data.user_id ?? null]);
        // Track the entry in boutique_mouvements
        await conn.execute(`INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
       VALUES (?, 'entree', ?, 'Depuis magasin', ?, ?)`, [data.produit_id, data.quantite, data.reference ?? null, data.user_id ?? null]);
        // Update boutique_stock (INSERT or increment)
        await conn.execute(`INSERT INTO boutique_stock (produit_id, quantite)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite), updated_at = NOW()`, [data.produit_id, data.quantite]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
// Ajustement stock magasin (correction)
async function createStockAjustement(data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const abs = Math.abs(data.quantite);
        const type = data.quantite >= 0 ? "entree" : "retrait";
        await conn.execute(`UPDATE produits
       SET stock_magasin = GREATEST(0, COALESCE(stock_magasin, 0) + ?)
       WHERE id = ?`, [data.quantite, data.produit_id]);
        const [[stockRow]] = await conn.execute(`SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`, [data.produit_id]);
        const stockApres = Number(stockRow?.stock ?? 0);
        await conn.execute(`INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`, [data.produit_id, type, abs, stockApres, data.motif, data.user_id ?? null]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function getStockMovementCounts() {
    const [rows] = await db_1.db.query(`SELECT
       COUNT(*) AS total,
       SUM(type = 'entree')              AS entrees,
       SUM(type IN ('retrait','vente'))  AS sorties,
       SUM(type NOT IN ('entree','retrait','vente')) AS ajustements
     FROM stock_mouvements`);
    const r = rows[0];
    return {
        total: Number(r?.total ?? 0),
        entrees: Number(r?.entrees ?? 0),
        sorties: Number(r?.sorties ?? 0),
        ajustements: Number(r?.ajustements ?? 0),
    };
}
async function getStockMovements(opts = {}) {
    const { limit = 50, offset = 0, type, search } = opts;
    const conditions = [];
    const params = [];
    if (type && type !== "tous") {
        if (type === "sortie") {
            conditions.push("sm.type IN ('retrait','vente')");
        }
        else {
            conditions.push("sm.type = ?");
            params.push(type);
        }
    }
    if (search) {
        conditions.push("(p.nom LIKE ? OR sm.reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT sm.*, p.nom AS nom_produit
     FROM stock_mouvements sm
     LEFT JOIN produits p ON p.id = sm.produit_id
     ${where}
     ORDER BY sm.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM stock_mouvements sm LEFT JOIN produits p ON p.id = sm.produit_id ${where}`, params);
    return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function ensureAdminUsersCols() {
    const [cols] = await db_1.db.execute("SHOW COLUMNS FROM admin_users");
    const names = new Set(cols.map((c) => c.Field));
    const addCol = async (sql, col) => {
        if (names.has(col))
            return;
        try {
            await db_1.db.execute(sql);
            names.add(col);
        }
        catch (e) {
            const err = e;
            if (err?.code !== "ER_DUP_FIELDNAME" && !String(err?.message).includes("Duplicate column"))
                throw e;
            names.add(col);
        }
    };
    await addCol("ALTER TABLE admin_users ADD COLUMN username VARCHAR(50) NULL AFTER nom", "username");
    await addCol("ALTER TABLE admin_users ADD COLUMN telephone VARCHAR(30) NULL", "telephone");
    await addCol("ALTER TABLE admin_users ADD COLUMN poste VARCHAR(50) NULL DEFAULT 'staff'", "poste");
    await addCol("ALTER TABLE admin_users ADD COLUMN permissions TEXT NULL", "permissions");
    await addCol("ALTER TABLE admin_users ADD COLUMN must_change_password TINYINT NOT NULL DEFAULT 0", "must_change_password");
    // Populate username for existing rows that have none
    await db_1.db.execute("UPDATE admin_users SET username = CONCAT(LOWER(REPLACE(TRIM(nom), ' ', '_')), '_', id) WHERE username IS NULL OR username = ''");
    // Ensure the kent super_admin account exists with correct password (idempotent)
    const KENT_HASH = "$2b$12$4ivze.K3jg8LW7j9RRuzReeqjR2xtXscmGkTbh7rceBFQMI7tcef.";
    try {
        const [kentRows] = await db_1.db.execute("SELECT id FROM admin_users WHERE username = 'kent' LIMIT 1");
        if (kentRows.length) {
            // Update existing row to ensure correct hash and role
            await db_1.db.execute("UPDATE admin_users SET password_hash = ?, role = 'super_admin', actif = 1 WHERE username = 'kent'", [KENT_HASH]);
        }
        else {
            // Generate a unique email to avoid UNIQUE constraint conflicts
            const uniqueEmail = `kent.${Date.now()}@admin.local`;
            await db_1.db.execute("INSERT INTO admin_users (nom, username, email, poste, password_hash, role, actif) VALUES ('Kent','kent',?,'Administrateur',?,?,1)", [uniqueEmail, KENT_HASH, "super_admin"]);
        }
    }
    catch (e) {
        console.error("[ensureAdminUsersCols] kent seed failed:", e);
    }
}
async function getAdminByEmail(email) {
    const [rows] = await db_1.db.execute("SELECT * FROM admin_users WHERE email = ? AND actif = 1 LIMIT 1", [email]);
    return rows[0] ?? null;
}
async function getAdminByUsername(username) {
    const [rows] = await db_1.db.execute("SELECT * FROM admin_users WHERE username = ? AND actif = 1 LIMIT 1", [username]);
    return rows[0] ?? null;
}
async function getAdminById(id) {
    const [rows] = await db_1.db.execute("SELECT * FROM admin_users WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
}
async function listAdminUsers() {
    const [rows] = await db_1.db.execute("SELECT id, nom, username, email, telephone, poste, role, actif, permissions, created_at, last_login FROM admin_users ORDER BY id ASC");
    return rows;
}
async function createAdminUser(data) {
    await db_1.db.execute("INSERT INTO admin_users (nom, username, email, telephone, poste, password_hash, role, must_change_password) VALUES (?,?,?,?,?,?,?,?)", [data.nom, data.username, data.email ?? null, data.telephone ?? null, data.poste ?? "staff", data.password_hash, data.role, data.must_change_password ? 1 : 0]);
}
async function updateAdminLastLogin(id) {
    await db_1.db.execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [id]);
}
async function updateAdminPassword(id, hash, clearFlag = false) {
    const extra = clearFlag ? ", must_change_password = 0" : "";
    await db_1.db.execute(`UPDATE admin_users SET password_hash = ?${extra} WHERE id = ?`, [hash, id]);
}
async function updateUtilisateurPassword(id, hash) {
    await db_1.db.execute("UPDATE utilisateurs SET mot_de_passe = ?, must_change_password = 0 WHERE id = ?", [hash, id]);
}
async function updateAdminUser(id, data) {
    const sets = [];
    const vals = [];
    if (data.nom !== undefined) {
        sets.push("nom = ?");
        vals.push(data.nom);
    }
    if (data.username !== undefined) {
        sets.push("username = ?");
        vals.push(data.username);
    }
    if (data.email !== undefined) {
        sets.push("email = ?");
        vals.push(data.email);
    }
    if (data.telephone !== undefined) {
        sets.push("telephone = ?");
        vals.push(data.telephone);
    }
    if (data.poste !== undefined) {
        sets.push("poste = ?");
        vals.push(data.poste);
    }
    if (data.role !== undefined) {
        sets.push("role = ?");
        vals.push(data.role);
    }
    if (data.actif !== undefined) {
        sets.push("actif = ?");
        vals.push(data.actif ? 1 : 0);
    }
    if (data.permissions !== undefined) {
        sets.push("permissions = ?");
        vals.push(data.permissions);
    }
    if (!sets.length)
        return;
    vals.push(id);
    await db_1.db.execute(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, vals);
}
async function deleteAdminUser(id) {
    await db_1.db.execute("DELETE FROM admin_users WHERE id = ?", [id]);
}
async function ensureUtilisateursCols() {
    try {
        await db_1.db.execute("ALTER TABLE utilisateurs ADD COLUMN username VARCHAR(50) NULL AFTER nom");
    }
    catch { /* already exists */ }
    try {
        await db_1.db.execute("ALTER TABLE utilisateurs ADD COLUMN permissions TEXT NULL");
    }
    catch { /* already exists */ }
    try {
        await db_1.db.execute("ALTER TABLE utilisateurs ADD COLUMN must_change_password TINYINT NOT NULL DEFAULT 0");
    }
    catch { /* already exists */ }
    try {
        await db_1.db.execute("ALTER TABLE utilisateurs ADD COLUMN numero_plaque VARCHAR(30) NULL");
    }
    catch { /* already exists */ }
}
async function ensureOrderLivreurCols() {
    const cols = [
        "ALTER TABLE orders ADD COLUMN livreur_id INT NULL",
        "ALTER TABLE orders ADD COLUMN livraison_note TEXT NULL",
        "ALTER TABLE orders ADD COLUMN livraison_statut VARCHAR(20) NULL",
        "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ];
    for (const sql of cols) {
        try {
            await db_1.db.execute(sql);
        }
        catch { /* already exists */ }
    }
}
// Migrate livreurs from admin_users to utilisateurs (one-time, idempotent)
async function migrateAdminLivreursToTeam() {
    const [livreurs] = await db_1.db.execute("SELECT id, nom, username, email, telephone, password_hash FROM admin_users WHERE poste = 'Livreur' AND actif = 1");
    for (const l of livreurs) {
        // Skip if username already exists in utilisateurs
        const [existing] = await db_1.db.execute("SELECT id FROM utilisateurs WHERE username = ? LIMIT 1", [l.username]);
        if (existing.length === 0) {
            await db_1.db.execute("INSERT INTO utilisateurs (nom, username, email, telephone, poste, mot_de_passe, actif) VALUES (?,?,?,?,?,?,1)", [l.nom, l.username, l.email ?? null, l.telephone ?? null, "Livreur", l.password_hash]);
        }
        // Deactivate from admin_users
        await db_1.db.execute("UPDATE admin_users SET actif = 0 WHERE id = ?", [l.id]);
    }
}
async function listUtilisateurs() {
    await ensureUtilisateursCols();
    const [rows] = await db_1.db.execute("SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions FROM utilisateurs WHERE actif = 1 ORDER BY date_creation DESC");
    return rows;
}
async function getUtilisateurById(id) {
    const [rows] = await db_1.db.execute("SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions FROM utilisateurs WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
}
async function getUtilisateurByUsername(username) {
    const [rows] = await db_1.db.execute("SELECT id, nom, username, email, telephone, numero_plaque, poste, actif, date_creation, permissions, mot_de_passe, must_change_password FROM utilisateurs WHERE username = ? AND actif = 1 LIMIT 1", [username]);
    return rows[0] ?? null;
}
async function createUtilisateur(data) {
    await ensureUtilisateursCols();
    const [res] = await db_1.db.execute("INSERT INTO utilisateurs (nom, username, email, telephone, numero_plaque, poste, mot_de_passe, must_change_password) VALUES (?,?,?,?,?,?,?,?)", [data.nom, data.username ?? null, data.email ?? null, data.telephone ?? null, data.numero_plaque ?? null, data.poste, data.motDePasse, data.mustChangePassword ? 1 : 0]);
    return res.insertId;
}
async function updateUtilisateur(id, data) {
    const fields = [];
    const values = [];
    if (data.nom !== undefined) {
        fields.push("nom = ?");
        values.push(data.nom);
    }
    if (data.username !== undefined) {
        fields.push("username = ?");
        values.push(data.username ?? null);
    }
    if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email);
    }
    if (data.telephone !== undefined) {
        fields.push("telephone = ?");
        values.push(data.telephone);
    }
    if (data.numero_plaque !== undefined) {
        fields.push("numero_plaque = ?");
        values.push(data.numero_plaque ?? null);
    }
    if (data.poste !== undefined) {
        fields.push("poste = ?");
        values.push(data.poste);
    }
    if (data.permissions !== undefined) {
        fields.push("permissions = ?");
        values.push(data.permissions ?? null);
    }
    if (data.actif !== undefined) {
        fields.push("actif = ?");
        values.push(data.actif);
    }
    if (data.motDePasse !== undefined) {
        fields.push("mot_de_passe = ?");
        values.push(data.motDePasse);
    }
    if (fields.length === 0)
        return;
    values.push(id);
    await db_1.db.execute(`UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?`, values);
}
async function deleteUtilisateur(id) {
    // Soft-delete: utilisateurs has FK references from 12+ operational tables
    // (documents, achats, paiements, mouvements_stock, etc.) — physical DELETE
    // would cascade-fail. Deactivation preserves all historical data.
    await db_1.db.execute("UPDATE utilisateurs SET actif = 0 WHERE id = ?", [id]);
}
async function listPermissions() {
    const [rows] = await db_1.db.execute("SELECT id, nom, description, module FROM permissions ORDER BY module, id ASC");
    return rows;
}
/** Returns a map of utilisateur_id → distinct module keys from JSON permissions */
async function listAllUtilisateurModules() {
    const [rows] = await db_1.db.execute("SELECT id, permissions FROM utilisateurs WHERE actif = 1 AND permissions IS NOT NULL");
    const map = {};
    for (const r of rows) {
        try {
            const perms = JSON.parse(r.permissions);
            map[Number(r.id)] = Object.keys(perms);
        }
        catch { /* ignore malformed JSON */ }
    }
    return map;
}
async function getUtilisateurPermissions(utilisateurId) {
    const [rows] = await db_1.db.execute("SELECT permission_id FROM utilisateur_permissions WHERE utilisateur_id = ?", [utilisateurId]);
    return rows.map(r => Number(r.permission_id));
}
async function setUtilisateurPermissions(utilisateurId, permissionIds) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute("DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?", [utilisateurId]);
        if (permissionIds.length > 0) {
            const placeholders = permissionIds.map(() => "(?,?)").join(",");
            const values = permissionIds.flatMap(pid => [utilisateurId, pid]);
            await conn.execute(`INSERT IGNORE INTO utilisateur_permissions (utilisateur_id, permission_id) VALUES ${placeholders}`, values);
        }
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
/* ─── Settings — in-memory cache 5 min TTL ─── */
let _settingsCache = null;
function invalidateSettingsCache() { _settingsCache = null; }
async function loadSettings() {
    const now = Date.now();
    if (_settingsCache && _settingsCache.expiresAt > now)
        return _settingsCache.data;
    const [rows] = await db_1.db.execute("SELECT `key`, `value` FROM settings");
    const data = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    _settingsCache = { data, expiresAt: now + 5 * 60_000 };
    return data;
}
async function getSettings() {
    return loadSettings();
}
async function getSetting(key) {
    const all = await loadSettings();
    // Key already cached — return immediately
    if (key in all)
        return all[key] ?? "";
    // Key not in cache (new key) — fall back to direct query without poisoning cache
    const [rows] = await db_1.db.execute("SELECT `value` FROM settings WHERE `key` = ?", [key]);
    return rows[0]?.value ?? "";
}
async function setSetting(key, value) {
    await db_1.db.execute("INSERT INTO settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)", [key, value]);
    invalidateSettingsCache();
}
async function setSettings(entries) {
    const pairs = Object.entries(entries);
    if (!pairs.length)
        return;
    const placeholders = pairs.map(() => "(?,?)").join(",");
    const values = pairs.flatMap(([k, v]) => [k, v]);
    await db_1.db.execute(`INSERT INTO settings (\`key\`, \`value\`) VALUES ${placeholders} ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`, values);
    invalidateSettingsCache();
}
async function getDeliveryZones(activeOnly = false) {
    const where = activeOnly ? "WHERE actif = 1" : "";
    const [rows] = await db_1.db.execute(`SELECT * FROM delivery_zones ${where} ORDER BY sort_order ASC, id ASC`);
    return rows.map(r => ({ ...r, actif: Boolean(r.actif) }));
}
async function upsertDeliveryZone(zone) {
    if (zone.id) {
        await db_1.db.execute("UPDATE delivery_zones SET nom=?, fee=?, actif=?, sort_order=? WHERE id=?", [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order, zone.id]);
    }
    else {
        await db_1.db.execute("INSERT INTO delivery_zones (nom, fee, actif, sort_order) VALUES (?,?,?,?)", [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order]);
    }
}
async function deleteDeliveryZone(id) {
    await db_1.db.execute("DELETE FROM delivery_zones WHERE id = ?", [id]);
}
async function listOrders(limit = 50, offset = 0) {
    const [rows] = await db_1.db.query(`SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee,
            items, subtotal, total, status, statut_paiement,
            livreur_id, livraison_statut, created_at, updated_at
     FROM orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
    return rows;
}
async function countOrders() {
    const [rows] = await db_1.db.execute("SELECT COUNT(*) as cnt FROM orders");
    return Number(rows[0]?.cnt ?? 0);
}
async function ensureOrderLifecycleCols() {
    const pool = db_1.db;
    for (const ddl of [
        "ALTER TABLE orders ADD COLUMN stock_boutique_deducted TINYINT(1) NOT NULL DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN finance_entry_id INT NULL",
        "ALTER TABLE orders ADD COLUMN vente_facture_id INT NULL",
        "ALTER TABLE factures ADD COLUMN source VARCHAR(30) NULL",
        "ALTER TABLE factures ADD COLUMN order_id INT NULL",
    ]) {
        try {
            await pool.execute(ddl);
        }
        catch (err) {
            const code = err.code;
            if (code !== "ER_DUP_FIELDNAME" && code !== "ER_NO_SUCH_TABLE")
                throw err;
        }
    }
}
async function updateOrderStatus(id, status) {
    await db_1.db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}
async function updateOrderFields(id, data) {
    const sets = [];
    const params = [];
    if (data.nom !== undefined) {
        sets.push("nom = ?");
        params.push(data.nom);
    }
    if (data.telephone !== undefined) {
        sets.push("telephone = ?");
        params.push(data.telephone);
    }
    if (data.adresse !== undefined) {
        sets.push("adresse = ?");
        params.push(data.adresse);
    }
    if (data.zone_livraison !== undefined) {
        sets.push("zone_livraison = ?");
        params.push(data.zone_livraison);
    }
    if (data.note !== undefined) {
        sets.push("note = ?");
        params.push(data.note);
    }
    if (data.delivery_fee !== undefined) {
        sets.push("delivery_fee = ?");
        params.push(data.delivery_fee);
    }
    if (data.subtotal !== undefined) {
        sets.push("subtotal = ?");
        params.push(data.subtotal);
    }
    if (data.total !== undefined) {
        sets.push("total = ?");
        params.push(data.total);
    }
    if (data.items !== undefined) {
        sets.push("items = ?");
        params.push(data.items);
    }
    if (data.statut_paiement !== undefined) {
        sets.push("statut_paiement = ?");
        params.push(data.statut_paiement);
    }
    if (data.lien_localisation !== undefined) {
        sets.push("lien_localisation = ?");
        params.push(data.lien_localisation ?? null);
    }
    if (sets.length === 0)
        return;
    params.push(id);
    await db_1.db.execute(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`, params);
}
async function deleteOrder(id) {
    const [[order]] = await db_1.db.execute("SELECT finance_entry_id, vente_facture_id, reference FROM orders WHERE id = ? LIMIT 1", [id]);
    await db_1.db.execute("DELETE FROM order_events WHERE order_id = ?", [id]);
    await db_1.db.execute("DELETE FROM orders WHERE id = ?", [id]);
    // Clean up linked finance entry (rentree created by applyOrderPaidEffects)
    if (order?.finance_entry_id) {
        await db_1.db.execute("DELETE FROM finance_entries WHERE id = ?", [order.finance_entry_id]).catch(() => { });
    }
    // Clean up all finance entries linked to this order reference
    if (order?.reference) {
        await db_1.db.execute("DELETE FROM finance_entries WHERE description LIKE ?", [`%${order.reference}%`]).catch(() => { });
    }
    // Delete the auto-created facture linked to this order
    if (order?.vente_facture_id) {
        await db_1.db.execute("DELETE FROM factures WHERE id = ?", [order.vente_facture_id]).catch(() => { });
    }
    else {
        await db_1.db.execute("DELETE FROM factures WHERE order_id = ?", [id]).catch(() => { });
    }
    // Also delete the linked livraison
    await db_1.db.execute("DELETE FROM livraisons_ventes WHERE order_id = ?", [id]).catch(() => { });
    invalidateVentesStats();
}
async function getOrderById(id) {
    const [rows] = await db_1.db.execute(`SELECT id, reference, nom, telephone, adresse, zone_livraison, delivery_fee,
            note, items, subtotal, total, status, statut_paiement, payment_mode,
            livreur_id, livraison_statut, stock_boutique_deducted, finance_entry_id,
            vente_facture_id, created_at, updated_at
     FROM orders WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ?? null;
}
async function createOrder(data) {
    await ensureOrderLifecycleCols();
    // Generate reference CMD-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const reference = `CMD-${dateStr}-${rand}`;
    const [result] = await db_1.db.execute(`INSERT INTO orders (reference, nom, telephone, adresse, zone_livraison, delivery_fee, note, items, subtotal, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, [reference, data.nom, data.telephone, data.adresse, data.zone_livraison,
        data.delivery_fee, data.note, JSON.stringify(data.items), data.subtotal, data.total]);
    return result.insertId;
}
function parseOrderItems(items) {
    if (Array.isArray(items))
        return items;
    if (typeof items !== "string")
        return [];
    try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function orderPaymentModeToFinanceMode(mode) {
    if (mode === "moov_direct" || mode === "moov_money")
        return "moov_money";
    if (mode === "yas_direct" || mode === "tmoney" || mode === "mix_by_yas")
        return "tmoney";
    if (mode === "virement" || mode === "virement_bancaire")
        return "virement_bancaire";
    return "especes";
}
async function ensureOrderVente(orderId, actor) {
    await ensureOrderLifecycleCols();
    const [[order]] = await db_1.db.execute("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderId]);
    if (!order)
        return null;
    let factureId = order.vente_facture_id ? Number(order.vente_facture_id) : null;
    // If facture exists but admin_id not yet set, stamp the confirming actor (first write wins)
    if (factureId && actor?.id) {
        await db_1.db.execute("UPDATE factures SET admin_id = ? WHERE id = ? AND admin_id IS NULL", [actor.id, factureId]).catch(() => { });
    }
    // Create facture once — actor.id stored as admin_id (vendeur = first confirming admin)
    if (!factureId) {
        const items = parseOrderItems(order.items).map(item => {
            const qty = Number(item.qty ?? item.quantite ?? 1);
            const prix = Number(item.prix_unitaire ?? item.prix ?? 0);
            return {
                produit_id: Number(item.id ?? item.produit_id ?? 0),
                nom: String(item.nom ?? "Produit"),
                reference: String(item.reference ?? ""),
                qty, prix,
                total: Number(item.total ?? prix * qty),
            };
        });
        if (items.length === 0)
            return null;
        const reference = generateVenteRef("VS");
        const [result] = await db_1.db.execute(`INSERT INTO factures
         (reference, client_nom, client_tel, items, sous_total, remise, total,
          avec_livraison, adresse_livraison, contact_livraison, lien_localisation,
          mode_paiement, statut_paiement, statut, note, source, order_id, admin_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            reference,
            String(order.nom ?? "").trim().toUpperCase(),
            order.telephone ?? null,
            JSON.stringify(items),
            Number(order.subtotal ?? 0),
            0,
            Number(order.total ?? 0),
            1,
            order.adresse ?? null,
            order.telephone ?? null,
            order.lien_localisation ?? null,
            orderPaymentModeToFinanceMode(order.payment_mode),
            order.statut_paiement === "paye" ? "paye_total" : (order.statut_paiement ?? "non_paye"),
            "valide",
            `Commande site ${order.reference}`,
            "site_order",
            orderId,
            actor?.id ?? null,
        ]);
        factureId = result.insertId;
        await db_1.db.execute("UPDATE orders SET vente_facture_id = ? WHERE id = ?", [factureId, orderId]);
        if (order.nom && order.telephone) {
            await db_1.db.execute(`INSERT INTO boutique_clients (nom, telephone, type_client)
         SELECT ?, ?, 'particulier' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ?)`, [String(order.nom).trim(), String(order.telephone).trim(), String(order.telephone).trim()]).catch(() => { });
        }
    }
    // Create vente finance entry once when order is delivered
    const isDelivered = ["delivered", "livree", "livre", "livré"].includes(String(order.status ?? ""));
    if (isDelivered && !order.finance_entry_id) {
        const montant = Number(order.subtotal ?? 0);
        if (montant > 0) {
            const entryId = await createFinanceEntry({
                type: "vente",
                montant,
                mode_paiement: orderPaymentModeToFinanceMode(order.payment_mode) ?? "especes",
                description: `Commande site livrée — ${order.reference}`,
                date_entree: new Date().toISOString().slice(0, 10),
                admin_id: actor?.id,
                admin_nom: actor?.nom,
            }).catch(() => null);
            if (entryId) {
                await db_1.db.execute("UPDATE orders SET finance_entry_id = ? WHERE id = ?", [entryId, orderId]).catch(() => { });
            }
        }
    }
    return factureId;
}
async function applyOrderDeliveredEffects(orderId, actor) {
    await ensureOrderLifecycleCols();
    await ensureBoutiqueStockPopulated();
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(`SELECT id, reference, items, stock_boutique_deducted
       FROM orders WHERE id = ? FOR UPDATE`, [orderId]);
        const order = rows[0];
        if (!order || Number(order.stock_boutique_deducted ?? 0) === 1) {
            await conn.commit();
            return;
        }
        const items = parseOrderItems(order.items);
        for (const item of items) {
            const produitId = Number(item.id ?? item.produit_id ?? 0);
            const qty = Number(item.qty ?? item.quantite ?? 1);
            if (!produitId || qty <= 0)
                continue;
            const [stockRows] = await conn.execute("SELECT quantite FROM boutique_stock WHERE produit_id = ? LIMIT 1", [produitId]);
            const dispo = Number(stockRows[0]?.quantite ?? 0);
            if (dispo < qty) {
                throw new Error(`Stock boutique insuffisant pour "${item.nom ?? item.reference ?? produitId}" (dispo: ${dispo}, demandé: ${qty})`);
            }
        }
        for (const item of items) {
            const produitId = Number(item.id ?? item.produit_id ?? 0);
            const qty = Number(item.qty ?? item.quantite ?? 1);
            if (!produitId || qty <= 0)
                continue;
            await conn.execute("UPDATE boutique_stock SET quantite = GREATEST(0, quantite - ?), updated_at = NOW() WHERE produit_id = ?", [qty, produitId]);
            await conn.execute(`INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?,?,?,?,?,NULL)`, [produitId, "sortie", qty, "Commande site livrée", order.reference]);
            try {
                await conn.execute(`UPDATE produits p
           JOIN boutique_stock bs ON bs.produit_id = p.id
           SET p.stock_boutique = bs.quantite
           WHERE p.id = ?`, [produitId]);
            }
            catch { /* stock_boutique column may not exist */ }
        }
        await conn.execute("UPDATE orders SET stock_boutique_deducted = 1 WHERE id = ?", [orderId]);
        await conn.execute("INSERT INTO order_events (order_id, status, note, created_by) VALUES (?,?,?,?)", [orderId, "stock_boutique", "Stock boutique décrémenté automatiquement", actor ?? ""]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function applyOrderPaidEffects(orderId, actor) {
    await ensureOrderLifecycleCols();
    const [[order]] = await db_1.db.execute(`SELECT id, reference, nom, telephone, total, payment_mode, finance_entry_id
     FROM orders WHERE id = ? LIMIT 1`, [orderId]);
    if (!order || order.finance_entry_id)
        return;
    const entryId = await createFinanceEntry({
        type: "rentree",
        mode_paiement: orderPaymentModeToFinanceMode(order.payment_mode) ?? "especes",
        categorie: "Commande site",
        description: `Commande site ${order.reference} – ${order.nom ?? order.telephone}`,
        montant: Number(order.total ?? 0),
        date_entree: new Date().toISOString().slice(0, 10),
    });
    await db_1.db.execute("UPDATE orders SET finance_entry_id = ? WHERE id = ?", [entryId, orderId]);
    await addOrderEvent(orderId, "finance", "Entrée caisse créée automatiquement", actor ?? "");
}
async function addOrderEvent(order_id, status, note = "", created_by = "") {
    await db_1.db.execute("INSERT INTO order_events (order_id, status, note, created_by) VALUES (?,?,?,?)", [order_id, status, note, created_by]);
}
async function getOrderEvents(order_id) {
    const [rows] = await db_1.db.execute("SELECT * FROM order_events WHERE order_id = ? AND status NOT IN ('stock_boutique', 'finance') ORDER BY created_at ASC", [order_id]);
    return rows;
}
/* ─── Stats for dashboard ─── */
async function getDashboardStats() {
    const [ordersRow] = await db_1.db.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as revenue FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    const [productsRow] = await db_1.db.execute("SELECT COUNT(*) as cnt FROM produits WHERE actif = 1");
    const [messagesRow] = await db_1.db.execute("SELECT COUNT(*) as cnt FROM whatsapp_messages WHERE direction='in' AND read_at IS NULL").catch(() => [[{ cnt: 0 }]]);
    const [recentOrders] = await db_1.db.query(`SELECT id, reference, nom, telephone, zone_livraison, subtotal, total, status, statut_paiement, created_at
     FROM orders ORDER BY created_at DESC LIMIT 5`).catch(() => [[], []]);
    return {
        orders30d: Number(ordersRow[0]?.cnt ?? 0),
        revenue30d: Number(ordersRow[0]?.revenue ?? 0),
        productsActive: Number(productsRow[0]?.cnt ?? 0),
        unreadMessages: Number(messagesRow[0]?.cnt ?? 0),
        recentOrders: recentOrders,
    };
}
async function getOrdersStats() {
    const [[totalRow], [todayRow], [week7Row], [month30Row], statusRows, trendRows, recentRows,] = await Promise.all([
        db_1.db.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders"),
        db_1.db.execute("SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = CURDATE()"),
        db_1.db.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
        db_1.db.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        db_1.db.execute("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status"),
        db_1.db.execute(`SELECT DATE(created_at) as date,
              COUNT(*) as count,
              COALESCE(SUM(total),0) as revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`),
        db_1.db.query(`SELECT id, reference, nom, telephone, zone_livraison, subtotal, total, status, statut_paiement, created_at
       FROM orders ORDER BY created_at DESC LIMIT 8`),
    ]);
    const total = Number(totalRow[0]?.cnt ?? 0);
    const revenue = Number(totalRow[0]?.rev ?? 0);
    const byStatus = {};
    for (const r of statusRows[0]) {
        byStatus[r.status] = Number(r.cnt);
    }
    const trend7d = trendRows[0].map(r => ({
        date: String(r.date).slice(0, 10),
        count: Number(r.count),
        revenue: Number(r.revenue),
    }));
    return {
        totalOrders: total,
        totalRevenue: revenue,
        avgOrderValue: total > 0 ? revenue / total : 0,
        ordersToday: Number(todayRow[0]?.cnt ?? 0),
        orders7d: Number(week7Row[0]?.cnt ?? 0),
        orders30d: Number(month30Row[0]?.cnt ?? 0),
        revenue30d: Number(month30Row[0]?.rev ?? 0),
        byStatus,
        trend7d,
        recentOrders: recentRows[0],
    };
}
async function listWaMessages(limit = 100) {
    // Try modern schema first; fall back to legacy schema (body instead of content)
    const modern = `SELECT id, wa_message_id, from_number, to_number, contact_name, direction, type,
                         COALESCE(content, body, '') as content, COALESCE(media_url,'') as media_url,
                         status, read_at, created_at
                  FROM whatsapp_messages ORDER BY created_at DESC LIMIT ${limit}`;
    const legacy = `SELECT id, COALESCE(wa_message_id,'') as wa_message_id, from_number,
                         COALESCE(to_number,'') as to_number, COALESCE(contact_name,'') as contact_name,
                         COALESCE(direction,'in') as direction, COALESCE(type,'text') as type,
                         COALESCE(body,'') as content, '' as media_url, COALESCE(status,'received') as status,
                         read_at, created_at
                  FROM whatsapp_messages ORDER BY created_at DESC LIMIT ${limit}`;
    const [rows] = await db_1.db.query(modern)
        .catch(() => db_1.db.query(legacy))
        .catch(() => [[], []]);
    return rows;
}
async function markMessagesRead(ids) {
    if (!ids.length)
        return;
    await db_1.db.query(`UPDATE whatsapp_messages SET read_at = NOW() WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
}
async function saveIncomingMessage(msg) {
    await db_1.db.execute(`INSERT IGNORE INTO whatsapp_messages
     (wa_message_id, from_number, to_number, contact_name, direction, type, content, media_url, status)
     VALUES (?,?,?,?,?,?,?,?,?)`, [msg.wa_message_id, msg.from_number, msg.to_number, msg.contact_name,
        msg.direction, msg.type, msg.content, msg.media_url, msg.status]);
}
async function listReviews(filter = false) {
    const opts = typeof filter === "boolean"
        ? { approvedOnly: filter }
        : filter;
    const conditions = [];
    const params = [];
    if (opts.approvedOnly) {
        conditions.push("r.approved = 1");
    }
    if (opts.produit_id) {
        conditions.push("r.product_id = ?");
        params.push(opts.produit_id);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.execute(`SELECT r.*, p.nom as product_nom FROM reviews r
     LEFT JOIN produits p ON r.product_id = p.id
     ${where} ORDER BY r.created_at DESC`, params);
    return rows.map(r => ({ ...r, approved: Boolean(r.approved) }));
}
async function createReview(data) {
    await db_1.db.execute(`INSERT INTO reviews (product_id, nom, rating, comment, approved, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`, [data.produit_id, data.nom, data.note, data.commentaire ?? ""]);
}
async function approveReview(id, approved) {
    await db_1.db.execute("UPDATE reviews SET approved = ? WHERE id = ?", [approved ? 1 : 0, id]);
}
async function deleteReview(id) {
    await db_1.db.execute("DELETE FROM reviews WHERE id = ?", [id]);
}
async function listCoupons() {
    const [rows] = await db_1.db.execute("SELECT id, code, type, valeur, min_order, max_uses, uses_count, expires_at, actif, created_at FROM coupons ORDER BY created_at DESC LIMIT 500");
    return rows.map(r => ({ ...r, actif: Boolean(r.actif) }));
}
async function upsertCoupon(c) {
    if (c.id) {
        await db_1.db.execute("UPDATE coupons SET code=?,type=?,valeur=?,min_order=?,max_uses=?,expires_at=?,actif=? WHERE id=?", [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0, c.id]);
    }
    else {
        await db_1.db.execute("INSERT INTO coupons (code,type,valeur,min_order,max_uses,expires_at,actif) VALUES (?,?,?,?,?,?,?)", [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0]);
    }
}
async function deleteCoupon(id) {
    await db_1.db.execute("DELETE FROM coupons WHERE id = ?", [id]);
}
async function listAdminCategories() {
    const [rows] = await db_1.db.execute(`SELECT c.id, c.nom, COALESCE(c.description,'') AS description,
            COUNT(p.id) AS nb_produits
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     GROUP BY c.id
     ORDER BY c.nom ASC`);
    return rows.map(r => ({ ...r, nb_produits: Number(r.nb_produits) }));
}
async function createCategory(nom, description) {
    const [result] = await db_1.db.execute("INSERT INTO categories (nom, description) VALUES (?,?)", [nom, description]);
    return result.insertId;
}
async function updateCategory(id, nom, description) {
    await db_1.db.execute("UPDATE categories SET nom=?, description=? WHERE id=?", [nom, description, id]);
}
async function deleteCategory(id) {
    await db_1.db.execute("DELETE FROM categories WHERE id = ?", [id]);
}
async function listClients(limit = 50, offset = 0, search = "") {
    const where = search
        ? "WHERE telephone LIKE ? OR nom LIKE ?"
        : "";
    const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];
    const [rows] = await db_1.db.query(`SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params);
    return rows;
}
async function countClients(search = "") {
    const where = search ? "WHERE telephone LIKE ? OR nom LIKE ?" : "";
    const params = search ? [`%${search}%`, `%${search}%`] : [];
    const [rows] = await db_1.db.execute(`SELECT COUNT(*) as cnt FROM clients ${where}`, params);
    return Number(rows[0]?.cnt ?? 0);
}
async function getClientByPhone(telephone) {
    const [rows] = await db_1.db.execute("SELECT * FROM clients WHERE telephone = ? LIMIT 1", [telephone]);
    return rows[0] ?? null;
}
async function getClientById(id) {
    const [rows] = await db_1.db.execute("SELECT * FROM clients WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
}
async function upsertClient(data) {
    const existing = await getClientByPhone(data.telephone);
    if (existing) {
        const sets = [];
        const vals = [];
        if (data.nom !== undefined) {
            sets.push("nom=?");
            vals.push(data.nom);
        }
        if (data.email !== undefined) {
            sets.push("email=?");
            vals.push(data.email);
        }
        if (data.adresse !== undefined) {
            sets.push("adresse=?");
            vals.push(data.adresse);
        }
        if (data.ville !== undefined) {
            sets.push("ville=?");
            vals.push(data.ville);
        }
        if (data.statut !== undefined) {
            sets.push("statut=?");
            vals.push(data.statut);
        }
        if (data.notes !== undefined) {
            sets.push("notes=?");
            vals.push(data.notes);
        }
        if (data.tags !== undefined) {
            sets.push("tags=?");
            vals.push(data.tags);
        }
        if (sets.length) {
            vals.push(existing.id);
            await db_1.db.execute(`UPDATE clients SET ${sets.join(",")} WHERE id=?`, vals);
        }
        return existing.id;
    }
    else {
        const [result] = await db_1.db.execute("INSERT INTO clients (telephone,nom,email,adresse,ville,statut,notes,tags) VALUES (?,?,?,?,?,?,?,?)", [data.telephone, data.nom ?? "", data.email ?? "", data.adresse ?? "",
            data.ville ?? "", data.statut ?? "normal", data.notes ?? "", data.tags ?? null]);
        return result.insertId;
    }
}
async function deleteClient(id) {
    await db_1.db.execute("DELETE FROM clients WHERE id = ?", [id]);
}
async function getClientOrders(telephone) {
    const [rows] = await db_1.db.query(`SELECT id, reference, nom, telephone, zone_livraison, delivery_fee,
            subtotal, total, status, statut_paiement, created_at
     FROM orders WHERE telephone = ? ORDER BY created_at DESC LIMIT 20`, [telephone]);
    return rows;
}
async function getClientStats(telephone) {
    const [rows] = await db_1.db.execute(`SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_spent,
     COALESCE(AVG(total),0) as avg_basket, MAX(created_at) as last_order_at
     FROM orders WHERE telephone = ?`, [telephone]);
    const r = rows[0] ?? {};
    return {
        total_orders: Number(r.total_orders ?? 0),
        total_spent: Number(r.total_spent ?? 0),
        avg_basket: Number(r.avg_basket ?? 0),
        last_order_at: r.last_order_at ?? null,
    };
}
async function getCRMStats() {
    const [newClients] = await db_1.db.execute("SELECT COUNT(*) as cnt FROM clients WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)").catch(() => [[{ cnt: 0 }]]);
    const [topClients] = await db_1.db.query(`SELECT c.id, c.nom, c.telephone, c.statut,
     COUNT(o.id) as total_orders, COALESCE(SUM(o.total),0) as total_spent
     FROM clients c
     LEFT JOIN orders o ON o.telephone = c.telephone
     GROUP BY c.id ORDER BY total_spent DESC LIMIT 10`).catch(() => [[], []]);
    return {
        newClients30d: Number(newClients[0]?.cnt ?? 0),
        topClients: topClients,
    };
}
async function listEntrepots() { return []; }
async function getEntrepots() { return []; }
async function upsertEntrepot(_e) { }
async function deleteEntrepot(_id) { }
async function updateProductStock(produit_id, _entrepot_id, stock) {
    await db_1.db.execute(`UPDATE produits SET stock_magasin = ? WHERE id = ?`, [stock, produit_id]);
}
/* ─── Stock dashboard stats ─── */
async function getStockStats() {
    const [rows] = await db_1.db.execute(`
    SELECT
      COUNT(*)                                                                                   AS en_stock,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) = 0 THEN 1 ELSE 0 END)                           AS en_rupture,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) > 0 AND COALESCE(stock_magasin, 0) <= 5 THEN 1 ELSE 0 END) AS stock_faible,
      COALESCE(SUM(prix_unitaire * COALESCE(stock_magasin, 0)), 0)                               AS valeur_totale
    FROM produits
  `);
    const r = rows[0];
    return {
        en_stock: Number(r.en_stock ?? 0),
        en_rupture: Number(r.en_rupture ?? 0),
        stock_faible: Number(r.stock_faible ?? 0),
        valeur_totale: Number(r.valeur_totale ?? 0),
        entrees_jour: 0,
        sorties_jour: 0,
    };
}
async function getProduitColsAdmin() {
    const [rows] = await db_1.db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`);
    const names = new Set(rows.map(r => r.COLUMN_NAME.toLowerCase()));
    return {
        image_url: names.has("image_url"),
        image: names.has("image"),
        remise: names.has("remise"),
    };
}
async function ensureBoutiqueStockPopulated() {
    // Create table if missing
    await db_1.db.execute(`
    CREATE TABLE IF NOT EXISTS boutique_stock (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      produit_id   INT NOT NULL,
      quantite     INT NOT NULL DEFAULT 0,
      seuil_alerte INT NOT NULL DEFAULT 5,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_produit (produit_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    // If empty, seed from produits.stock_boutique (or 0 for all products)
    const [[cnt]] = await db_1.db.execute("SELECT COUNT(*) AS n FROM boutique_stock");
    if (Number(cnt.n ?? 0) === 0) {
        // Try with stock_boutique column first, fall back to 0
        await db_1.db.execute(`
      INSERT INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
      ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)
    `).catch(() => db_1.db.execute(`
        INSERT INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
        ON DUPLICATE KEY UPDATE quantite = quantite
      `));
    }
    else {
        // Ensure any new products added since last seeding are included
        await db_1.db.execute(`
      INSERT IGNORE INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
    `).catch(() => db_1.db.execute(`
        INSERT IGNORE INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
      `));
    }
}
async function getStockBoutiqueStats() {
    await ensureBoutiqueStockPopulated();
    const [rows] = await db_1.db.execute(`
    SELECT
      (SELECT COUNT(*) FROM produits)                                                        AS total_produits,
      COALESCE(SUM(bs.quantite * p.prix_unitaire), 0)                                      AS valeur_boutique,
      SUM(CASE WHEN bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte THEN 1 ELSE 0 END) AS stock_faible,
      SUM(CASE WHEN bs.quantite = 0 THEN 1 ELSE 0 END)                                     AS epuises
    FROM boutique_stock bs
    JOIN produits p ON p.id = bs.produit_id
  `);
    const r = rows[0] ?? {};
    return {
        total_produits: Number(r.total_produits ?? 0),
        valeur_boutique: Number(r.valeur_boutique ?? 0),
        stock_faible: Number(r.stock_faible ?? 0),
        epuises: Number(r.epuises ?? 0),
    };
}
async function getStockBoutiqueList(opts) {
    const { search, filter = "all", limit = 50, offset = 0 } = opts;
    await ensureBoutiqueStockPopulated();
    const cols = await getProduitColsAdmin();
    const imageCol = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
    const remiseCol = cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0";
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (filter === "faible")
        conditions.push("bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte");
    if (filter === "epuise")
        conditions.push("bs.quantite = 0");
    if (filter === "disponible")
        conditions.push("bs.quantite > 0");
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT bs.produit_id, p.nom, p.reference,
            ${imageCol}  AS image_url,
            ${remiseCol} AS remise,
            p.prix_unitaire,
            COALESCE(c.nom, '') AS categorie_nom,
            bs.quantite, bs.seuil_alerte,
            (bs.quantite * p.prix_unitaire) AS valeur
     FROM boutique_stock bs
     JOIN produits p ON p.id = bs.produit_id
     LEFT JOIN categories c ON c.id = p.categorie_id
     ${where}
     ORDER BY bs.quantite ASC, p.nom ASC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [countRows] = await db_1.db.query(`SELECT COUNT(*) AS cnt
     FROM boutique_stock bs
     JOIN produits p ON p.id = bs.produit_id
     ${where}`, params);
    return {
        items: rows.map(r => ({
            produit_id: Number(r.produit_id),
            nom: String(r.nom),
            reference: String(r.reference ?? ""),
            image_url: r.image_url ?? null,
            categorie_nom: String(r.categorie_nom ?? ""),
            prix_unitaire: Number(r.prix_unitaire),
            remise: Number(r.remise ?? 0),
            quantite: Number(r.quantite),
            seuil_alerte: Number(r.seuil_alerte),
            valeur: Number(r.valeur),
        })),
        total: Number(countRows[0]?.cnt ?? 0),
    };
}
async function createBoutiqueMouvement(data) {
    await db_1.db.execute(`INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
     VALUES (?,?,?,?,?,?)`, [data.produit_id, data.type, Math.abs(data.quantite),
        data.motif ?? null, data.ref_commande ?? null, data.admin_id ?? null]);
    const delta = data.type === "entree" ? Math.abs(data.quantite) : -Math.abs(data.quantite);
    await db_1.db.execute(`UPDATE boutique_stock SET quantite = GREATEST(0, quantite + ?), updated_at = NOW() WHERE produit_id = ?`, [delta, data.produit_id]);
    try {
        await db_1.db.execute(`UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id SET p.stock_boutique = bs.quantite WHERE p.id = ?`, [data.produit_id]);
    }
    catch { /* stock_boutique column may not exist */ }
}
async function getRecentBoutiqueMovements(limit = 30) {
    const [rows] = await db_1.db.query(`SELECT bm.*, p.nom AS nom_produit,
            COALESCE(au.nom, u.nom) AS admin_nom
     FROM boutique_mouvements bm
     JOIN produits p ON p.id = bm.produit_id
     LEFT JOIN admin_users au ON au.id = bm.admin_id
     LEFT JOIN utilisateurs u ON u.id = bm.admin_id
     ORDER BY bm.created_at DESC
     LIMIT ${Number(limit)}`);
    return rows;
}
async function listFactures(opts = {}) {
    const { limit = 50, offset = 0, search, statut } = opts;
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
        conditions.push("statut = ?");
        params.push(statut);
    }
    conditions.push("(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)");
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT f.*, CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status = 'delivered'
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     ${where} ORDER BY f.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM factures f LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status = 'delivered' ${where}`, params);
    return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function ensureFacturePaiementsTable() {
    await db_1.db.execute(`
    CREATE TABLE IF NOT EXISTS facture_paiements (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      facture_id    INT NOT NULL,
      montant       DECIMAL(12,2) NOT NULL,
      mode_paiement VARCHAR(50) NULL,
      admin_id      INT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_fp_facture (facture_id)
    )
  `);
}
async function createFacturePaiement(data) {
    await ensureFacturePaiementsTable();
    await db_1.db.execute(`INSERT INTO facture_paiements (facture_id, montant, mode_paiement, admin_id) VALUES (?,?,?,?)`, [data.facture_id, data.montant, data.mode_paiement ?? null, data.admin_id ?? null]);
}
async function getFacturePaiements(facture_id) {
    await ensureFacturePaiementsTable();
    const [rows] = await db_1.db.execute(`SELECT fp.*, COALESCE(au.nom, util.nom) AS vendeur
     FROM facture_paiements fp
     LEFT JOIN admin_users au ON au.id = fp.admin_id
     LEFT JOIN utilisateurs util ON util.id = fp.admin_id
     WHERE fp.facture_id = ? ORDER BY fp.created_at ASC`, [facture_id]);
    return rows;
}
async function getFactureById(id) {
    const [rows] = await db_1.db.execute(`SELECT f.*, CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     WHERE f.id = ? LIMIT 1`, [id]);
    if (!rows[0])
        return null;
    const facture = rows[0];
    facture.paiements = await getFacturePaiements(id);
    return facture;
}
async function getClientFacturesByNom(nom, tel) {
    const conditions = ["(f.client_nom = ? OR f.client_nom LIKE ?)"];
    const params = [nom, `%${nom}%`];
    if (tel) {
        conditions.push("f.client_tel = ?");
        params.push(tel);
    }
    const [rows] = await db_1.db.query(`SELECT f.*, CASE WHEN f.source = 'site_order' AND f.admin_id IS NULL THEN 'Site web' ELSE COALESCE(au.nom, util.nom) END AS vendeur
     FROM factures f
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs util ON util.id = f.admin_id
     WHERE f.client_nom = ?
     ORDER BY f.created_at DESC LIMIT 50`, [nom]);
    return rows;
}
function generateVenteRef(prefix) {
    const now = new Date();
    const date = now.toISOString().slice(2, 10).replace(/-/g, "");
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}${date}${seq}`;
}
async function createFacture(data) {
    const reference = generateVenteRef("FV");
    const [result] = await db_1.db.execute(`INSERT INTO factures (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, note, admin_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [reference, data.client_nom, data.client_tel ?? null, data.client_email ?? null,
        JSON.stringify(data.items), data.sous_total, data.remise ?? 0, data.total,
        data.statut ?? "brouillon", data.note ?? null, data.admin_id ?? null]);
    // Sync to boutique_clients if client has a name and phone
    if (data.client_nom?.trim() && data.client_tel?.trim()) {
        await db_1.db.execute(`INSERT INTO boutique_clients (nom, telephone, email, type_client)
       SELECT ?, ?, ?, 'particulier' FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ?)`, [data.client_nom.trim(), data.client_tel.trim(), data.client_email ?? null, data.client_tel.trim()]).catch(() => { });
    }
    return result.insertId;
}
async function createVenteWithStock(data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        // 1. Verify boutique stock for each item
        for (const item of data.items) {
            const [rows] = await conn.execute("SELECT quantite FROM boutique_stock WHERE produit_id = ? LIMIT 1", [item.produit_id]);
            const dispo = Number(rows[0]?.quantite ?? 0);
            if (dispo < item.qty) {
                throw new Error(`Stock insuffisant pour "${item.nom}" (dispo: ${dispo}, demandé: ${item.qty})`);
            }
        }
        // 2. Insert facture
        const reference = generateVenteRef("VT");
        data.client_nom = data.client_nom.trim().toUpperCase();
        const [result] = await conn.execute(`INSERT INTO factures
         (reference, client_nom, client_tel, items,
          sous_total, remise, total,
          avec_livraison, adresse_livraison, contact_livraison, lien_localisation,
          mode_paiement, statut_paiement, montant_acompte,
          statut, note, admin_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            reference, data.client_nom, data.client_tel ?? null,
            JSON.stringify(data.items),
            data.sous_total, data.remise ?? 0, data.total,
            data.avec_livraison ? 1 : 0,
            data.adresse_livraison ?? null, data.contact_livraison ?? null, data.lien_localisation ?? null,
            data.mode_paiement ?? null, data.statut_paiement ?? null, data.montant_acompte ?? null,
            "valide", data.note ?? null, data.admin_id ?? null,
        ]);
        const factureId = result.insertId;
        // 3. Decrement boutique_stock + log mouvements
        for (const item of data.items) {
            await conn.execute("UPDATE boutique_stock SET quantite = GREATEST(0, quantite - ?), updated_at = NOW() WHERE produit_id = ?", [item.qty, item.produit_id]);
            await conn.execute(`INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?,?,?,?,?,?)`, [item.produit_id, "sortie", item.qty, "Vente", reference, data.admin_id ?? null]);
            // Sync produits.stock_boutique (ignore if column missing)
            try {
                await conn.execute(`UPDATE produits p
         JOIN boutique_stock bs ON bs.produit_id = p.id
         SET p.stock_boutique = bs.quantite
         WHERE p.id = ?`, [item.produit_id]);
            }
            catch { /* stock_boutique column may not exist */ }
        }
        // 4. If delivery, create livraison entry
        if (data.avec_livraison) {
            const livRef = generateVenteRef("LV");
            await conn.execute(`INSERT INTO livraisons_ventes
           (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut)
         VALUES (?,?,?,?,?,?,?,?)`, [
                livRef, factureId, data.client_nom, data.client_tel ?? null,
                data.adresse_livraison ?? null, data.contact_livraison ?? null,
                data.lien_localisation ?? null, "en_attente",
            ]);
        }
        await conn.commit();
        // Sync client to boutique_clients after successful sale
        if (data.client_nom?.trim() && data.client_tel?.trim()) {
            await db_1.db.execute(`INSERT INTO boutique_clients (nom, telephone, type_client)
         SELECT ?, ?, 'particulier' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ?)`, [data.client_nom.trim(), data.client_tel.trim(), data.client_tel.trim()]).catch(() => { });
        }
        // Insert payment history entry for initial payment
        if (data.statut_paiement && data.statut_paiement !== "non_paye") {
            const montantInitial = data.statut_paiement === "acompte"
                ? (data.montant_acompte ?? 0)
                : data.total;
            if (montantInitial > 0) {
                await createFacturePaiement({
                    facture_id: factureId,
                    montant: montantInitial,
                    mode_paiement: data.mode_paiement ?? null,
                    admin_id: data.admin_id ?? null,
                }).catch(() => { });
            }
        }
        // Auto-create finance entry for paid/partial sales (skip if delivery pending — entry created on delivery confirmation)
        if (!data.avec_livraison && data.statut_paiement && data.statut_paiement !== "non_paye") {
            const montantFinance = data.statut_paiement === "acompte"
                ? (data.montant_acompte ?? 0)
                : data.total;
            if (montantFinance > 0) {
                await createFinanceEntry({
                    type: "vente",
                    mode_paiement: data.mode_paiement ?? "especes",
                    categorie: "Vente boutique",
                    description: `Vente ${reference} – ${data.client_nom.trim()}`,
                    montant: montantFinance,
                    date_entree: new Date().toISOString().slice(0, 10),
                }).catch(() => { });
            }
        }
        invalidateVentesStats();
        return { id: factureId, reference };
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function updateFactureStatut(id, statut) {
    await db_1.db.execute("UPDATE factures SET statut = ? WHERE id = ?", [statut, id]);
    invalidateVentesStats();
}
async function updateFacture(id, data) {
    const sets = [];
    const params = [];
    if (data.statut !== undefined) {
        sets.push("statut = ?");
        params.push(data.statut);
    }
    if (data.statut_paiement !== undefined) {
        sets.push("statut_paiement = ?");
        params.push(data.statut_paiement);
    }
    if (data.mode_paiement !== undefined) {
        sets.push("mode_paiement = ?");
        params.push(data.mode_paiement);
    }
    if (data.montant_acompte !== undefined) {
        sets.push("montant_acompte = ?");
        params.push(data.montant_acompte);
    }
    if (sets.length > 0) {
        params.push(id);
        await db_1.db.execute(`UPDATE factures SET ${sets.join(", ")} WHERE id = ?`, params);
    }
    if (data.montant_paiement && data.montant_paiement > 0) {
        await createFacturePaiement({
            facture_id: id,
            montant: data.montant_paiement,
            mode_paiement: data.mode_paiement ?? null,
            admin_id: data.admin_id ?? null,
        }).catch(() => { });
        // Record in finance_entries so solde_jour reflects the payment
        try {
            const [[f]] = await db_1.db.execute("SELECT reference, client_nom FROM factures WHERE id = ? LIMIT 1", [id]);
            if (f) {
                await createFinanceEntry({
                    type: "vente",
                    mode_paiement: data.mode_paiement ?? "especes",
                    categorie: "Vente boutique",
                    description: `Paiement ${f.reference} – ${f.client_nom}`,
                    montant: data.montant_paiement,
                    date_entree: new Date().toISOString().slice(0, 10),
                });
            }
        }
        catch { /* non-bloquant */ }
    }
    invalidateVentesStats();
}
async function deleteFacture(id) {
    const [[row]] = await db_1.db.execute("SELECT reference, items FROM factures WHERE id = ?", [id]);
    const ref = row?.reference;
    const items = (() => {
        try {
            const raw = row?.items;
            return Array.isArray(raw) ? raw : JSON.parse(raw ?? "[]");
        }
        catch {
            return [];
        }
    })();
    await Promise.all([
        db_1.db.execute("DELETE FROM factures WHERE id = ?", [id]),
        db_1.db.execute("DELETE FROM livraisons_ventes WHERE facture_id = ?", [id]).catch(() => { }),
    ]);
    // Restore boutique stock for each item
    for (const item of items) {
        if (!item.produit_id || !item.qty)
            continue;
        await db_1.db.execute("UPDATE boutique_stock SET quantite = quantite + ?, updated_at = NOW() WHERE produit_id = ?", [item.qty, item.produit_id]).catch(() => { });
        await db_1.db.execute(`INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande)
       VALUES (?, 'entree', ?, 'Annulation vente', ?)`, [item.produit_id, item.qty, ref ?? null]).catch(() => { });
        await db_1.db.execute(`UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id
       SET p.stock_boutique = bs.quantite WHERE p.id = ?`, [item.produit_id]).catch(() => { });
    }
    if (ref) {
        await db_1.db.execute("DELETE FROM finance_entries WHERE description LIKE ?", [`%${ref}%`]).catch(() => { });
    }
    invalidateVentesStats();
}
async function listDevis(opts = {}) {
    const { limit = 50, offset = 0, search, statut } = opts;
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
        conditions.push("statut = ?");
        params.push(statut);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT id, reference, client_nom, client_tel, client_email,
            sous_total, remise, total, statut, valide_jusqu, note, admin_id, created_at, updated_at
     FROM devis ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM devis ${where}`, params);
    return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function createDevis(data) {
    const reference = generateVenteRef("DV");
    const [result] = await db_1.db.execute(`INSERT INTO devis (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, valide_jusqu, note, admin_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [reference, data.client_nom, data.client_tel ?? null, data.client_email ?? null,
        JSON.stringify(data.items), data.sous_total, data.remise ?? 0, data.total,
        data.statut ?? "brouillon", data.valide_jusqu ?? null, data.note ?? null, data.admin_id ?? null]);
    return result.insertId;
}
async function createPaymentPlan(data) {
    const mt = Math.round((data.montant_total / data.nb_tranches) * 100) / 100;
    const [result] = await db_1.db.execute(`INSERT INTO payment_plans (order_id, nb_tranches, montant_total, montant_tranche) VALUES (?,?,?,?)`, [data.order_id, data.nb_tranches, data.montant_total, mt]);
    const planId = result.insertId;
    for (let i = 1; i <= data.nb_tranches; i++) {
        const d = new Date();
        d.setDate(d.getDate() + (i - 1) * 7);
        await db_1.db.execute(`INSERT INTO payment_tranches (plan_id, numero, montant, date_echeance) VALUES (?,?,?,?)`, [planId, i, mt, d.toISOString().split("T")[0]]);
    }
    return planId;
}
async function listPaymentPlans() {
    const [rows] = await db_1.db.execute(`SELECT pp.*, o.reference, o.nom
     FROM payment_plans pp JOIN orders o ON o.id = pp.order_id
     ORDER BY pp.created_at DESC`);
    return rows;
}
async function getPaymentPlanByOrderId(orderId) {
    const [planRows] = await db_1.db.execute(`SELECT pp.*, o.reference, o.nom FROM payment_plans pp
     JOIN orders o ON o.id = pp.order_id WHERE pp.order_id = ? LIMIT 1`, [orderId]);
    if (!planRows.length)
        return null;
    const plan = planRows[0];
    const [tranches] = await db_1.db.execute(`SELECT * FROM payment_tranches WHERE plan_id = ? ORDER BY numero`, [plan.id]);
    return { ...plan, tranches: tranches };
}
async function markTranchePaid(trancheId, note, mode_paiement) {
    await db_1.db.execute(`UPDATE payment_tranches SET statut='payee', date_paiement=NOW(), note=?, mode_paiement=? WHERE id=?`, [note ?? null, mode_paiement ?? null, trancheId]);
    const [tRow] = await db_1.db.execute(`SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`, [trancheId]);
    const planId = tRow[0]?.plan_id;
    if (!planId)
        return;
    const [rem] = await db_1.db.execute(`SELECT COUNT(*) AS cnt FROM payment_tranches WHERE plan_id=? AND statut!='payee'`, [planId]);
    if (Number(rem[0]?.cnt) === 0) {
        await db_1.db.execute(`UPDATE payment_plans SET statut='solde' WHERE id=?`, [planId]);
        const [pRow] = await db_1.db.execute(`SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`, [planId]);
        if (pRow[0]?.order_id) {
            // Use 'confirmed' (valid ENUM value)
            await db_1.db.execute(`UPDATE orders SET status='confirmed' WHERE id=?`, [pRow[0].order_id]);
            await addOrderEvent(pRow[0].order_id, "confirmed", "Paiement échelonné soldé — commande confirmée");
        }
    }
}
async function markTrancheUnpaid(trancheId) {
    await db_1.db.execute(`UPDATE payment_tranches SET statut='en_attente', date_paiement=NULL, note=NULL WHERE id=?`, [trancheId]);
    const [tRow] = await db_1.db.execute(`SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`, [trancheId]);
    if (tRow[0]?.plan_id) {
        await db_1.db.execute(`UPDATE payment_plans SET statut='en_cours' WHERE id=? AND statut='solde'`, [tRow[0].plan_id]);
    }
}
async function cancelPaymentPlan(planId) {
    await db_1.db.execute(`UPDATE payment_plans SET statut='annule' WHERE id=?`, [planId]);
    const [pRow] = await db_1.db.execute(`SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`, [planId]);
    if (pRow[0]?.order_id) {
        await db_1.db.execute(`UPDATE orders SET status='annulée' WHERE id=?`, [pRow[0].order_id]);
    }
}
async function updateDevisStatut(id, statut) {
    await db_1.db.execute("UPDATE devis SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteDevis(id) {
    await db_1.db.execute("DELETE FROM devis WHERE id = ?", [id]);
}
async function listLivraisons(opts = {}) {
    const { limit = 50, offset = 0, search, statut } = opts;
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(client_nom LIKE ? OR reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
        conditions.push("statut = ?");
        params.push(statut);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT id, reference, facture_id, client_nom, client_tel, adresse,
            contact_livraison, lien_localisation, statut, livreur,
            montant_livraison, order_id, livree_le, created_at, updated_at
     FROM livraisons_ventes ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM livraisons_ventes ${where}`, params);
    return { items: rows, total: Number(cnt[0]?.cnt ?? 0) };
}
async function updateLivraisonStatut(id, statut) {
    await db_1.db.execute("UPDATE livraisons_ventes SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteLivraison(id) {
    await db_1.db.execute("DELETE FROM livraisons_ventes WHERE id = ?", [id]);
}
async function listFinanceEntries(opts = {}) {
    const { limit = 50, offset = 0, type, search } = opts;
    await financeEntrieCols(); // ensure columns exist
    const conditions = ["f.type != 'vente'"]; // never show auto-generated vente entries
    const params = [];
    if (type) {
        conditions.push("f.type = ?");
        params.push(type);
    }
    if (search) {
        conditions.push("(f.categorie LIKE ? OR f.reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const [rows] = await db_1.db.query(`SELECT f.*, COALESCE(f.admin_nom, au.nom, u.nom) AS admin_nom
     FROM finance_entries f
     LEFT JOIN admin_users au ON au.id = f.admin_id
     LEFT JOIN utilisateurs u ON u.id = f.admin_id
     ${where} ORDER BY f.date_entree DESC, f.id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM finance_entries f ${where}`, params);
    const items = rows.map(r => ({ ...r, montant: Number(r.montant) }));
    return { items: items, total: Number(cnt[0]?.cnt ?? 0) };
}
// Cached column check for finance_entries
let _finCols = null;
async function financeEntrieCols() {
    if (_finCols)
        return _finCols;
    const [rows] = await db_1.db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_entries'`);
    const names = new Set(rows.map(r => r.COLUMN_NAME.toLowerCase()));
    // Auto-migrate optional columns
    if (!names.has("admin_id")) {
        try {
            await db_1.db.execute("ALTER TABLE finance_entries ADD COLUMN admin_id INT NULL");
        }
        catch { /* already exists */ }
        names.add("admin_id");
    }
    if (!names.has("compte_destination")) {
        try {
            await db_1.db.execute("ALTER TABLE finance_entries ADD COLUMN compte_destination VARCHAR(30) NULL");
        }
        catch { /* already exists */ }
        names.add("compte_destination");
    }
    if (!names.has("admin_nom")) {
        try {
            await db_1.db.execute("ALTER TABLE finance_entries ADD COLUMN admin_nom VARCHAR(150) NULL");
        }
        catch { /* already exists */ }
        names.add("admin_nom");
    }
    // Ensure 'transfert' is in the type ENUM (older DBs may be missing it)
    try {
        await db_1.db.execute(`ALTER TABLE finance_entries MODIFY COLUMN type ENUM('caisse','depense','rentree','vente','transfert') NOT NULL`);
    }
    catch { /* already correct or DB doesn't support */ }
    _finCols = {
        mode_paiement: names.has("mode_paiement"),
        admin_id: names.has("admin_id"),
        compte_destination: names.has("compte_destination"),
        admin_nom: names.has("admin_nom"),
    };
    return _finCols;
}
async function getFinanceStats() {
    const cols = await financeEntrieCols();
    const [netRows, transfersOut, transfersIn, summaryRow] = await Promise.all([
        // NET balance per account: ventes+rentrees+caisse as credits, depenses as debits
        cols.mode_paiement
            ? db_1.db.query(`SELECT COALESCE(mode_paiement, 'especes') AS mode_paiement,
                  SUM(CASE
                    WHEN type IN ('caisse','rentree','vente') THEN montant
                    WHEN type = 'depense' THEN -montant
                    ELSE 0
                  END) AS net
           FROM finance_entries
           WHERE type != 'transfert'
           GROUP BY COALESCE(mode_paiement, 'especes')`).then(([rows]) => rows)
            : Promise.resolve([]),
        // Transfer outflows (debit from source account)
        cols.mode_paiement
            ? db_1.db.query(`SELECT mode_paiement, SUM(montant) AS total
           FROM finance_entries WHERE type = 'transfert'
           GROUP BY mode_paiement`).then(([rows]) => rows)
            : Promise.resolve([]),
        // Transfer inflows (credit to destination account)
        cols.compte_destination
            ? db_1.db.query(`SELECT compte_destination AS mode_paiement, SUM(montant) AS total
           FROM finance_entries WHERE type = 'transfert' AND compte_destination IS NOT NULL
           GROUP BY compte_destination`).then(([rows]) => rows)
            : Promise.resolve([]),
        // Summary totals (manual entries only, not ventes)
        db_1.db.query(`SELECT
         SUM(CASE WHEN type IN ('caisse','rentree') THEN montant ELSE 0 END) AS recettes,
         SUM(CASE WHEN type = 'depense'             THEN montant ELSE 0 END) AS depenses
       FROM finance_entries`).then(([[row]]) => row),
    ]);
    const modeMap = {};
    netRows.forEach(r => {
        if (r.mode_paiement)
            modeMap[r.mode_paiement] = Number(r.net ?? 0);
    });
    // Apply transfer debits
    transfersOut.forEach(r => {
        if (r.mode_paiement)
            modeMap[r.mode_paiement] = (modeMap[r.mode_paiement] ?? 0) - Number(r.total ?? 0);
    });
    // Apply transfer credits
    transfersIn.forEach(r => {
        if (r.mode_paiement)
            modeMap[r.mode_paiement] = (modeMap[r.mode_paiement] ?? 0) + Number(r.total ?? 0);
    });
    const especes = modeMap["especes"] ?? 0;
    const moov_money = modeMap["moov_money"] ?? 0;
    const tmoney = modeMap["tmoney"] ?? 0;
    const virement_bancaire = modeMap["virement_bancaire"] ?? 0;
    return {
        total_recettes: Number(summaryRow?.recettes ?? 0),
        total_depenses: Number(summaryRow?.depenses ?? 0),
        solde_net: especes + moov_money + tmoney + virement_bancaire,
        especes,
        moov_money,
        tmoney,
        virement_bancaire,
    };
}
function genFinanceRef(type) {
    const prefix = type === "depense" ? "DEP" : type === "caisse" ? "CAI" : type === "transfert" ? "TRF" : "ENT";
    return `${prefix}-${Date.now()}`;
}
async function createFinanceEntry(data) {
    const cols = await financeEntrieCols();
    const reference = genFinanceRef(data.type);
    const colNames = ["reference", "type", "categorie", "description", "montant", "date_entree"];
    const colVals = [
        reference, data.type,
        data.categorie ?? null, data.description ?? null,
        data.montant, data.date_entree,
    ];
    if (cols.mode_paiement) {
        colNames.push("mode_paiement");
        colVals.push(data.mode_paiement ?? "especes");
    }
    if (cols.compte_destination) {
        colNames.push("compte_destination");
        colVals.push(data.compte_destination ?? null);
    }
    if (cols.admin_id) {
        colNames.push("admin_id");
        colVals.push(data.admin_id ?? null);
    }
    if (cols.admin_nom) {
        colNames.push("admin_nom");
        colVals.push(data.admin_nom ?? null);
    }
    const [result] = await db_1.db.execute(`INSERT INTO finance_entries (${colNames.join(", ")}) VALUES (${colNames.map(() => "?").join(", ")})`, colVals);
    return result.insertId;
}
async function updateFinanceEntry(id, data) {
    const cols = await financeEntrieCols();
    const fields = [];
    const params = [];
    if (cols.mode_paiement && data.mode_paiement !== undefined) {
        fields.push("mode_paiement = ?");
        params.push(data.mode_paiement);
    }
    if (data.categorie !== undefined) {
        fields.push("categorie = ?");
        params.push(data.categorie);
    }
    if (data.description !== undefined) {
        fields.push("description = ?");
        params.push(data.description);
    }
    if (data.montant !== undefined) {
        fields.push("montant = ?");
        params.push(data.montant);
    }
    if (data.date_entree !== undefined) {
        fields.push("date_entree = ?");
        params.push(data.date_entree);
    }
    if (!fields.length)
        return;
    params.push(id);
    await db_1.db.execute(`UPDATE finance_entries SET ${fields.join(", ")} WHERE id = ?`, params);
}
async function deleteFinanceEntry(id) {
    await db_1.db.execute("DELETE FROM finance_entries WHERE id = ?", [id]);
}
let _ventesStatsCache = null;
function invalidateVentesStats() { _ventesStatsCache = null; }
async function getVentesStats() {
    const now = Date.now();
    if (_ventesStatsCache && _ventesStatsCache.expiresAt > now)
        return _ventesStatsCache.data;
    // LEFT JOIN replaces the correlated EXISTS — one join scanned once instead of one subquery per row
    const SITE_JOIN = "LEFT JOIN orders _so ON _so.id = f.order_id AND _so.status = 'delivered'";
    const SITE_COND = "(f.source IS NULL OR f.source != 'site_order' OR _so.id IS NOT NULL)";
    const [[f], [l], [ca], [fp], [tj], [cj]] = await Promise.all([
        db_1.db.execute(`SELECT COUNT(*) AS cnt FROM factures f ${SITE_JOIN} WHERE ${SITE_COND}`),
        db_1.db.execute("SELECT COUNT(*) AS cnt FROM livraisons_ventes"),
        db_1.db.execute(`SELECT COALESCE(SUM(
        CASE
          WHEN f.statut_paiement IN ('paye','paye_total') THEN CASE WHEN f.source = 'site_order' THEN f.sous_total ELSE f.total END
          WHEN f.statut_paiement = 'acompte'             THEN COALESCE(f.montant_acompte, 0)
          ELSE 0
        END
      ), 0) AS total FROM factures f ${SITE_JOIN} WHERE f.statut != 'annule' AND ${SITE_COND}`),
        db_1.db.execute(`SELECT COUNT(*) AS cnt FROM factures f ${SITE_JOIN} WHERE f.statut = 'paye' AND ${SITE_COND}`),
        db_1.db.execute(`SELECT COUNT(*) AS cnt,
              COALESCE(SUM(
                CASE
                  WHEN f.statut_paiement IN ('paye','paye_total') THEN CASE WHEN f.source = 'site_order' THEN f.sous_total ELSE f.total END
                  WHEN f.statut_paiement = 'acompte'             THEN COALESCE(f.montant_acompte, 0)
                  ELSE 0
                END
              ), 0) AS montant
       FROM factures f
       LEFT JOIN livraisons_ventes lv ON lv.facture_id = f.id
       WHERE DATE(f.created_at) = CURDATE() AND f.statut_paiement IN ('paye','paye_total','acompte') AND f.statut != 'annule' AND (f.source IS NULL OR f.source != 'site_order')
         AND (lv.id IS NULL OR lv.statut = 'livre')`),
        db_1.db.execute(`SELECT COALESCE(SUM(subtotal), 0) AS montant, COUNT(*) AS cnt FROM orders WHERE status = 'delivered' AND DATE(updated_at) = CURDATE()`).catch(() => [[{ montant: 0, cnt: 0 }]]),
    ]);
    // Finance queries are optional — table may not exist yet on fresh DBs
    let depenses_jour = 0;
    let rentrees_jour = 0;
    let solde_jour = 0;
    try {
        const [[sj]] = await db_1.db.execute(`SELECT COALESCE(SUM(
         CASE WHEN type IN ('vente','rentree','caisse') THEN montant
              WHEN type = 'depense'                    THEN -montant
              ELSE 0 END
       ), 0) AS solde
       FROM finance_entries
       WHERE DATE(date_entree) = CURDATE() AND type != 'transfert'`);
        const [[dj]] = await db_1.db.execute(`SELECT COALESCE(SUM(montant), 0) AS montant FROM finance_entries WHERE type = 'depense' AND DATE(date_entree) = CURDATE()`);
        const [[rj]] = await db_1.db.execute(`SELECT COALESCE(SUM(montant), 0) AS montant FROM finance_entries WHERE type = 'rentree' AND DATE(date_entree) = CURDATE()`);
        solde_jour = Number(sj?.solde ?? 0);
        depenses_jour = Number(dj?.montant ?? 0);
        rentrees_jour = Number(rj?.montant ?? 0);
    }
    catch { /* finance_entries table not yet created */ }
    const result = {
        factures: Number(f[0]?.cnt ?? 0),
        livraisons: Number(l[0]?.cnt ?? 0),
        ca_total: Number(ca[0]?.total ?? 0),
        factures_payees: Number(fp[0]?.cnt ?? 0),
        ventes_jour_montant: Number(tj[0]?.montant ?? 0),
        ventes_jour_count: Number(tj[0]?.cnt ?? 0),
        commandes_livrees_jour: Number(cj[0]?.montant ?? 0),
        commandes_livrees_jour_count: Number(cj[0]?.cnt ?? 0),
        depenses_jour,
        rentrees_jour,
        solde_jour,
    };
    _ventesStatsCache = { data: result, expiresAt: Date.now() + 60_000 };
    return result;
}
async function getLivraisonsStats() {
    const [rows] = await db_1.db.execute(`SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut IN ('acceptee','en_cours')) AS en_cours,
       SUM(statut = 'livre') AS livre
     FROM livraisons_ventes`);
    const r = rows[0] ?? {};
    return {
        total: Number(r.total ?? 0),
        en_attente: Number(r.en_attente ?? 0),
        en_cours: Number(r.en_cours ?? 0),
        livre: Number(r.livre ?? 0),
    };
}
async function listFournisseurs() {
    const [rows] = await db_1.db.query("SELECT id, nom, contact, telephone, email, adresse, note, created_at FROM fournisseurs ORDER BY nom LIMIT 500");
    return rows;
}
async function createFournisseur(data) {
    const [result] = await db_1.db.execute(`INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, note) VALUES (?,?,?,?,?,?)`, [data.nom, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null]);
    return result.insertId;
}
async function updateFournisseur(id, data) {
    await db_1.db.execute(`UPDATE fournisseurs SET nom=?, contact=?, telephone=?, email=?, adresse=?, note=? WHERE id=?`, [data.nom ?? null, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null, id]);
}
async function deleteFournisseur(id) {
    await db_1.db.execute("DELETE FROM fournisseurs WHERE id = ?", [id]);
}
async function listAchats(limit = 50, offset = 0) {
    const [rows] = await db_1.db.query(`SELECT a.*, f.nom AS fournisseur_nom
     FROM achats a
     LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
     ORDER BY a.date_achat DESC, a.id DESC
     LIMIT ${limit} OFFSET ${offset}`);
    return rows;
}
async function countAchats() {
    const [rows] = await db_1.db.execute("SELECT COUNT(*) as cnt FROM achats");
    return Number(rows[0]?.cnt ?? 0);
}
async function getAchatStats() {
    const [rows] = await db_1.db.execute(`SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut = 'recu') AS recu,
       COALESCE(SUM(montant_total), 0) AS montant_total
     FROM achats`);
    const r = rows[0];
    return {
        total: Number(r.total ?? 0),
        en_attente: Number(r.en_attente ?? 0),
        recu: Number(r.recu ?? 0),
        montant_total: Number(r.montant_total ?? 0),
    };
}
async function getAchatById(id) {
    const [aRows] = await db_1.db.execute(`SELECT a.*, f.nom AS fournisseur_nom FROM achats a LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id WHERE a.id = ?`, [id]);
    if (!aRows[0])
        return null;
    const [iRows] = await db_1.db.execute(`SELECT ai.*, p.nom AS produit_nom FROM achat_items ai LEFT JOIN produits p ON p.id = ai.produit_id WHERE ai.achat_id = ?`, [id]);
    return { achat: aRows[0], items: iRows };
}
async function createAchat(data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        // Auto-generate reference if not provided
        let reference = data.reference?.trim();
        if (!reference) {
            const year = new Date().getFullYear();
            const [cntRows] = await conn.execute(`SELECT COUNT(*) AS cnt FROM achats WHERE YEAR(date_achat) = ?`, [year]);
            const num = (Number(cntRows[0].cnt) + 1).toString().padStart(3, "0");
            reference = `ACH-${year}-${num}`;
        }
        const montant_total = data.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
        // Ensure transport column exists (try/catch on ER_DUP_FIELDNAME like images_json)
        let hasTransport = false;
        try {
            await conn.execute(`ALTER TABLE achats ADD COLUMN transport VARCHAR(10) NULL`);
            hasTransport = true;
        }
        catch (e) {
            const err = e;
            if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
                hasTransport = true;
            }
        }
        const achatCols = ["fournisseur_id", "reference", "date_achat", "statut", "montant_total", "notes"];
        const achatVals = [
            data.fournisseur_id ?? null, reference, data.date_achat, data.statut, montant_total, data.note ?? null,
        ];
        if (hasTransport) {
            achatCols.push("transport");
            achatVals.push(data.transport ?? null);
        }
        const [res] = await conn.execute(`INSERT INTO achats (${achatCols.join(",")}) VALUES (${achatCols.map(() => "?").join(",")})`, achatVals);
        const achatId = res.insertId;
        if (data.items.length > 0) {
            const placeholders = data.items.map(() => "(?,?,?,?,?)").join(",");
            const values = data.items.flatMap(i => [achatId, i.produit_id ?? null, i.designation, i.quantite, i.prix_unitaire]);
            await conn.execute(`INSERT INTO achat_items (achat_id, produit_id, designation, quantite, prix_unitaire) VALUES ${placeholders}`, values);
        }
        await conn.commit();
        return achatId;
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function updateAchatStatut(id, statut) {
    await db_1.db.execute("UPDATE achats SET statut = ? WHERE id = ?", [statut, id]);
}
async function deleteAchat(id) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute("DELETE FROM achat_items WHERE achat_id = ?", [id]);
        await conn.execute("DELETE FROM achats WHERE id = ?", [id]);
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function updateAchat(id, data) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const sets = [];
        const vals = [];
        if ("fournisseur_id" in data) {
            sets.push("fournisseur_id = ?");
            vals.push(data.fournisseur_id ?? null);
        }
        if (data.date_achat) {
            sets.push("date_achat = ?");
            vals.push(data.date_achat);
        }
        if ("transport" in data) {
            sets.push("transport = ?");
            vals.push(data.transport ?? null);
        }
        if ("note" in data) {
            sets.push("notes = ?");
            vals.push(data.note ?? null);
        }
        if (data.items) {
            const montant_total = data.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
            sets.push("montant_total = ?");
            vals.push(montant_total);
            await conn.execute("DELETE FROM achat_items WHERE achat_id = ?", [id]);
            if (data.items.length > 0) {
                const placeholders = data.items.map(() => "(?,?,?,?,?)").join(",");
                const values = data.items.flatMap(i => [id, i.produit_id ?? null, i.designation, i.quantite, i.prix_unitaire]);
                await conn.execute(`INSERT INTO achat_items (achat_id, produit_id, designation, quantite, prix_unitaire) VALUES ${placeholders}`, values);
            }
        }
        if (sets.length) {
            vals.push(id);
            await conn.execute(`UPDATE achats SET ${sets.join(", ")} WHERE id = ?`, vals);
        }
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function recevoirAchat(id) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute("SELECT statut FROM achats WHERE id = ?", [id]);
        if (!rows[0])
            throw new Error("Achat introuvable.");
        if (rows[0].statut !== "en_attente")
            throw new Error("Cet achat n'est pas en attente.");
        await conn.execute("UPDATE achats SET statut = 'recu' WHERE id = ?", [id]);
        const [items] = await conn.execute("SELECT produit_id, quantite FROM achat_items WHERE achat_id = ? AND produit_id IS NOT NULL", [id]);
        if (items.length > 0) {
            const cases = items.map(() => "WHEN id = ? THEN COALESCE(stock_magasin, 0) + ?").join(" ");
            const ids = items.map(i => i.produit_id);
            const vals = items.flatMap(i => [i.produit_id, i.quantite]);
            await conn.execute(`UPDATE produits SET stock_magasin = CASE ${cases} END WHERE id IN (${ids.map(() => "?").join(",")})`, [...vals, ...ids]);
        }
        await conn.commit();
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function ensureLivreurCols() {
    try {
        await db_1.db.execute("ALTER TABLE livreurs ADD COLUMN numero_plaque VARCHAR(30) NULL AFTER telephone");
    }
    catch { /* column already exists */ }
}
async function listLivreurs() {
    await ensureLivreurCols();
    const [rows] = await db_1.db.query("SELECT id, nom, telephone, numero_plaque, code_acces, statut, created_at FROM livreurs ORDER BY nom ASC LIMIT 200");
    return rows;
}
async function getLivreurByCode(code) {
    const [rows] = await db_1.db.execute("SELECT * FROM livreurs WHERE code_acces = ? LIMIT 1", [code]);
    return rows[0] ?? null;
}
function generateCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
async function createLivreur(data) {
    let code = generateCode();
    // Ensure uniqueness
    let [existing] = await db_1.db.execute("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
    while (existing.length > 0) {
        code = generateCode();
        [existing] = await db_1.db.execute("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
    }
    const [result] = await db_1.db.execute("INSERT INTO livreurs (nom, telephone, numero_plaque, code_acces) VALUES (?,?,?,?)", [data.nom, data.telephone ?? null, data.numero_plaque ?? null, code]);
    const [rows] = await db_1.db.execute("SELECT * FROM livreurs WHERE id = ?", [result.insertId]);
    return rows[0];
}
async function updateLivreur(id, data) {
    const fields = [];
    const values = [];
    if (data.nom !== undefined) {
        fields.push("nom = ?");
        values.push(data.nom);
    }
    if (data.telephone !== undefined) {
        fields.push("telephone = ?");
        values.push(data.telephone);
    }
    if (data.numero_plaque !== undefined) {
        fields.push("numero_plaque = ?");
        values.push(data.numero_plaque);
    }
    if (data.statut !== undefined) {
        fields.push("statut = ?");
        values.push(data.statut);
    }
    if (fields.length === 0)
        return;
    values.push(id);
    await db_1.db.execute(`UPDATE livreurs SET ${fields.join(", ")} WHERE id = ?`, values);
}
async function deleteLivreur(id) {
    await db_1.db.execute("DELETE FROM livreurs WHERE id = ?", [id]);
}
async function ensureLivraisonCols() {
    // Each ALTER is independent — a missing column must not block the others
    const alters = [
        "ALTER TABLE livraisons_ventes ADD COLUMN montant_livraison DECIMAL(10,2) NULL",
        "ALTER TABLE livraisons_ventes ADD COLUMN livree_le DATETIME NULL",
        "ALTER TABLE livraisons_ventes ADD COLUMN note TEXT NULL",
        "ALTER TABLE livraisons_ventes ADD COLUMN livreur VARCHAR(255) NULL",
        "ALTER TABLE livraisons_ventes ADD COLUMN order_id INT NULL",
        // Prevent duplicate livraison for the same online order (race condition guard)
        "ALTER TABLE livraisons_ventes ADD UNIQUE KEY uk_order_id (order_id)",
        // Fix ENUM to include all required values
        "ALTER TABLE livraisons_ventes MODIFY COLUMN statut ENUM('en_attente','acceptee','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente'",
        // Drop old FK referencing `livreurs` — livreur_id now stores utilisateurs.id
        "ALTER TABLE livraisons_ventes DROP FOREIGN KEY livraisons_ventes_ibfk_2",
    ];
    for (const sql of alters) {
        try {
            await db_1.db.execute(sql);
        }
        catch { /* already applied */ }
    }
}
async function listLivraisonsAdmin(opts = {}) {
    await ensureLivraisonCols();
    const { limit = 50, offset = 0, search, statut } = opts;
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(lv.client_nom LIKE ? OR lv.reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (statut) {
        conditions.push("lv.statut = ?");
        params.push(statut);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT lv.*, li.nom AS livreur_nom
     FROM livraisons_ventes lv
     LEFT JOIN utilisateurs li ON li.id = lv.livreur_id
     ${where}
     ORDER BY lv.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
    const [cnt] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM livraisons_ventes lv ${where}`, params);
    return {
        items: rows.map(r => ({ ...r, livreur: r.livreur_nom ?? r.livreur })),
        total: Number(cnt[0]?.cnt ?? 0),
    };
}
async function updateLivraisonAdmin(id, data) {
    const fields = [];
    const values = [];
    if (data.statut !== undefined) {
        fields.push("statut = ?");
        values.push(data.statut);
    }
    if (data.livreur_id !== undefined) {
        fields.push("livreur_id = ?");
        values.push(data.livreur_id);
    }
    if (data.note !== undefined) {
        fields.push("note = ?");
        values.push(data.note);
    }
    if (data.statut === "livre") {
        fields.push("livree_le = NOW()");
    }
    if (fields.length === 0)
        return;
    values.push(id);
    await db_1.db.execute(`UPDATE livraisons_ventes SET ${fields.join(", ")} WHERE id = ?`, values);
    // When delivery is confirmed, create the finance entry for the linked facture
    if (data.statut === "livre") {
        const [[liv]] = await db_1.db.execute(`SELECT lv.facture_id, lv.order_id, f.reference, f.client_nom, f.total, f.sous_total,
              f.statut_paiement, f.montant_acompte, f.mode_paiement, f.source
       FROM livraisons_ventes lv
       LEFT JOIN factures f ON f.id = lv.facture_id
       WHERE lv.id = ? LIMIT 1`, [id]);
        const f = liv;
        // Site order livraisons (order_id set): finance entry handled by ensureOrderVente on delivery
        if (!f?.order_id && f?.reference && f.statut_paiement && f.statut_paiement !== "non_paye") {
            const montant = f.statut_paiement === "acompte"
                ? Number(f.montant_acompte ?? 0)
                : Number(f.source === "site_order" ? f.sous_total : f.total);
            if (montant > 0) {
                await createFinanceEntry({
                    type: "vente",
                    mode_paiement: f.mode_paiement ?? "especes",
                    categorie: "Vente boutique",
                    description: `Vente ${f.reference} – ${f.client_nom}`,
                    montant,
                    date_entree: new Date().toISOString().slice(0, 10),
                }).catch(() => { });
            }
        }
        invalidateVentesStats();
    }
}
// Called by driver: accept a delivery (atomic — only if still en_attente)
async function accepterLivraison(livraisonId, livreurId, montantLivraison) {
    const conn = await db_1.db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute("SELECT id, statut FROM livraisons_ventes WHERE id = ? FOR UPDATE", [livraisonId]);
        const liv = rows[0];
        if (!liv || liv.statut !== "en_attente") {
            await conn.rollback();
            return false;
        }
        const [livreurRow] = await conn.execute("SELECT nom FROM utilisateurs WHERE id = ?", [livreurId]);
        const nomLivreur = livreurRow[0]?.nom ?? null;
        await conn.execute("UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ?, montant_livraison = ? WHERE id = ?", [livreurId, nomLivreur, montantLivraison ?? null, livraisonId]);
        await conn.commit();
        return true;
    }
    catch (err) {
        await conn.rollback();
        throw err;
    }
    finally {
        conn.release();
    }
}
async function createManualLivraison(data) {
    const reference = generateVenteRef("LV");
    const [result] = await db_1.db.execute(`INSERT INTO livraisons_ventes
       (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut, note)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', ?)`, [
        reference,
        data.client_nom,
        data.client_tel ?? null,
        data.adresse ?? null,
        data.contact_livraison ?? null,
        data.lien_localisation ?? null,
        data.note ?? null,
    ]);
    return result.insertId;
}
// For driver page: get deliveries available (en_attente) + their own accepted ones
async function getLivraisonsForLivreur(livreurId) {
    const [rows] = await db_1.db.query(`SELECT lv.*, li.nom AS livreur_nom
     FROM livraisons_ventes lv
     LEFT JOIN utilisateurs li ON li.id = lv.livreur_id
     WHERE lv.statut = 'en_attente'
        OR (lv.livreur_id = ? AND lv.statut NOT IN ('livre','echoue'))
     ORDER BY lv.created_at DESC`, [livreurId]);
    return rows.map(r => ({ ...r, livreur: r.livreur_nom ?? r.livreur }));
}
async function ensureBoutiqueClientsTable() {
    await db_1.db.execute(`
    CREATE TABLE IF NOT EXISTS boutique_clients (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      nom          VARCHAR(255) NOT NULL,
      telephone    VARCHAR(20),
      email        VARCHAR(150),
      localisation VARCHAR(255),
      type_client  ENUM('particulier','professionnel') NOT NULL DEFAULT 'particulier',
      solde        DECIMAL(15,2) NOT NULL DEFAULT 0,
      notes        TEXT,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_nom       (nom),
      INDEX idx_telephone (telephone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    // Import from clients table if boutique_clients is empty
    const [[cnt]] = await db_1.db.execute("SELECT COUNT(*) AS n FROM boutique_clients");
    if (Number(cnt.n ?? 0) === 0) {
        await db_1.db.execute(`
      INSERT INTO boutique_clients (nom, telephone, email, type_client)
      SELECT nom, telephone, email, 'particulier'
      FROM clients
      WHERE telephone IS NOT NULL AND telephone != ''
    `).catch(() => { });
    }
}
async function listBoutiqueClients(limit, offset, search, filtre) {
    await ensureBoutiqueClientsTable();
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(nom LIKE ? OR telephone LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (filtre === "debiteurs") {
        conditions.push("solde < 0");
    }
    else if (filtre === "dettes") {
        conditions.push("solde > 0");
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT * FROM boutique_clients ${where} ORDER BY nom ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return rows;
}
async function countBoutiqueClients(search, filtre) {
    const conditions = [];
    const params = [];
    if (search) {
        conditions.push("(nom LIKE ? OR telephone LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (filtre === "debiteurs") {
        conditions.push("solde < 0");
    }
    else if (filtre === "dettes") {
        conditions.push("solde > 0");
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db_1.db.query(`SELECT COUNT(*) AS cnt FROM boutique_clients ${where}`, params);
    return rows[0].cnt;
}
async function getBoutiqueClientById(id) {
    const [rows] = await db_1.db.execute("SELECT * FROM boutique_clients WHERE id = ?", [id]);
    return rows[0] ?? null;
}
async function createBoutiqueClient(data) {
    const [result] = await db_1.db.execute(`INSERT INTO boutique_clients (nom, telephone, email, localisation, type_client, solde, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        data.nom ?? "",
        data.telephone ?? null,
        data.email ?? null,
        data.localisation ?? null,
        data.type_client ?? "particulier",
        data.solde ?? 0,
        data.notes ?? null,
    ]);
    return result.insertId;
}
async function updateBoutiqueClient(id, data) {
    const fields = [];
    const values = [];
    if (data.nom !== undefined) {
        fields.push("nom = ?");
        values.push(data.nom);
    }
    if (data.telephone !== undefined) {
        fields.push("telephone = ?");
        values.push(data.telephone);
    }
    if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email);
    }
    if (data.localisation !== undefined) {
        fields.push("localisation = ?");
        values.push(data.localisation);
    }
    if (data.type_client !== undefined) {
        fields.push("type_client = ?");
        values.push(data.type_client);
    }
    if (data.solde !== undefined) {
        fields.push("solde = ?");
        values.push(data.solde);
    }
    if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes);
    }
    if (fields.length === 0)
        return;
    values.push(id);
    await db_1.db.execute(`UPDATE boutique_clients SET ${fields.join(", ")} WHERE id = ?`, values);
}
async function deleteBoutiqueClient(id) {
    await db_1.db.execute("DELETE FROM boutique_clients WHERE id = ?", [id]);
}
async function getBoutiqueClientsStats() {
    const [[kpis], [segments], [acquisitions], [topDebiteurs], [topDepensiers], [derniers]] = await Promise.all([
        // KPIs
        db_1.db.query(`SELECT
           COUNT(*) AS total,
           SUM(solde > 0) AS en_avance,
           SUM(solde < 0) AS debiteurs,
           ROUND(AVG(solde), 2) AS solde_moyen
         FROM boutique_clients`),
        // Segment distribution
        db_1.db.query(`SELECT type_client, COUNT(*) AS count
         FROM boutique_clients
         GROUP BY type_client`),
        // New acquisitions last 6 months
        db_1.db.query(`SELECT DATE_FORMAT(created_at, '%b') AS mois,
                COUNT(*) AS count
         FROM boutique_clients
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY YEAR(created_at), MONTH(created_at), mois
         ORDER BY YEAR(created_at), MONTH(created_at)`),
        // Top debiteurs (solde le plus négatif)
        db_1.db.query(`SELECT id, nom, telephone, type_client, solde
         FROM boutique_clients
         WHERE solde < 0
         ORDER BY solde ASC
         LIMIT 5`),
        // Top dépensiers (solde le plus positif = en avance = ont payé le plus)
        db_1.db.query(`SELECT id, nom, telephone, type_client, solde AS total_achats
         FROM boutique_clients
         WHERE solde > 0
         ORDER BY solde DESC
         LIMIT 5`),
        // Derniers clients ajoutés
        db_1.db.query(`SELECT * FROM boutique_clients ORDER BY created_at DESC LIMIT 8`),
    ]);
    const kpi = kpis[0];
    return {
        total: Number(kpi?.total ?? 0),
        en_avance: Number(kpi?.en_avance ?? 0),
        debiteurs: Number(kpi?.debiteurs ?? 0),
        solde_moyen: Number(kpi?.solde_moyen ?? 0),
        segments: segments,
        acquisitions: acquisitions,
        top_debiteurs: topDebiteurs,
        top_depensiers: topDepensiers,
        derniers: derniers,
    };
}
// ─── VITRINE — Fidélité, Parrainage, Newsletter, Comptes clients ──────────────
async function listLoyaltyClients() {
    const [rows] = await db_1.db.execute(`
    SELECT
      lp.telephone,
      MAX(c.nom) AS nom,
      SUM(lp.points) AS total_points,
      MAX(lp.created_at) AS last_date,
      COUNT(*) AS nb_transactions
    FROM loyalty_points lp
    LEFT JOIN clients c
      ON RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', ''), 8)
       = RIGHT(REGEXP_REPLACE(lp.telephone, '[^0-9]', ''), 8)
    GROUP BY lp.telephone
    ORDER BY total_points DESC
  `);
    return rows;
}
async function getLoyaltyHistory(telephone) {
    const digits = telephone.replace(/\D/g, "").slice(-8);
    const [rows] = await db_1.db.execute(`SELECT * FROM loyalty_points
     WHERE RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', ''), 8) = ?
     ORDER BY created_at DESC LIMIT 50`, [digits]);
    return rows;
}
async function addLoyaltyPointsManual(telephone, points, reason) {
    await db_1.db.execute(`INSERT INTO loyalty_points (telephone, points, reason, created_at) VALUES (?, ?, ?, NOW())`, [telephone, points, reason]);
}
async function listReferrals() {
    const [rows] = await db_1.db.execute(`SELECT * FROM referrals ORDER BY uses_count DESC, created_at DESC`);
    return rows;
}
async function listNewsletterSubscribers() {
    const [rows] = await db_1.db.execute(`SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC`);
    return rows;
}
async function deleteNewsletterSubscriber(id) {
    await db_1.db.execute(`DELETE FROM newsletter_subscribers WHERE id = ?`, [id]);
}
async function listSiteClients() {
    try {
        const [rows] = await db_1.db.execute(`
      SELECT id, nom, email, telephone,
             google_id IS NOT NULL AS via_google,
             password IS NOT NULL  AS via_password,
             statut, created_at
      FROM clients
      WHERE password IS NOT NULL OR google_id IS NOT NULL
      ORDER BY created_at DESC
    `);
        return rows;
    }
    catch {
        return [];
    }
}
async function getLoyaltyStats() {
    try {
        const [[r]] = await db_1.db.execute(`
      SELECT
        COUNT(DISTINCT telephone) AS nb_clients,
        SUM(CASE WHEN points > 0 THEN points ELSE 0 END) AS total_distribues,
        ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)) AS total_echanges
      FROM loyalty_points
    `);
        return {
            nb_clients: Number(r?.nb_clients ?? 0),
            total_distribues: Number(r?.total_distribues ?? 0),
            total_echanges: Number(r?.total_echanges ?? 0),
        };
    }
    catch {
        return { nb_clients: 0, total_distribues: 0, total_echanges: 0 };
    }
}
async function ensureMarquesTable() {
    await db_1.db.execute(`
    CREATE TABLE IF NOT EXISTS marques (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nom         VARCHAR(255) NOT NULL,
      description TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Check column existence before ALTER to support MySQL < 8.0.3
    const [cols] = await db_1.db.execute(`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'produits'
       AND COLUMN_NAME  = 'marque_id'`);
    if (Number(cols[0]?.cnt ?? 0) === 0) {
        await db_1.db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`).catch(() => { });
    }
}
async function listAdminMarques() {
    await ensureMarquesTable();
    const [rows] = await db_1.db.execute(`
    SELECT m.id, m.nom, COALESCE(m.description, '') AS description,
           COUNT(p.id) AS nb_produits
    FROM marques m
    LEFT JOIN produits p ON p.marque_id = m.id
    GROUP BY m.id
    ORDER BY m.nom
  `);
    return rows.map(r => ({
        id: Number(r.id),
        nom: String(r.nom),
        description: String(r.description ?? ""),
        nb_produits: Number(r.nb_produits ?? 0),
    }));
}
async function createMarque(data) {
    await ensureMarquesTable();
    const [res] = await db_1.db.execute(`INSERT INTO marques (nom, description) VALUES (?, ?)`, [data.nom, data.description || null]);
    return res.insertId;
}
async function updateMarque(id, data) {
    await db_1.db.execute(`UPDATE marques SET nom = ?, description = ? WHERE id = ?`, [data.nom, data.description || null, id]);
}
async function deleteMarque(id) {
    await db_1.db.execute(`DELETE FROM marques WHERE id = ?`, [id]);
}
/* ─── Token version — JWT revocation ─── */
async function ensureTokenVersionCols() {
    const alters = [
        "ALTER TABLE admin_users ADD COLUMN token_version INT NOT NULL DEFAULT 0",
        "ALTER TABLE utilisateurs ADD COLUMN token_version INT NOT NULL DEFAULT 0",
    ];
    for (const sql of alters) {
        try {
            await db_1.db.execute(sql);
        }
        catch { /* column already exists */ }
    }
}
async function getTokenVersion(table, id) {
    const col = table === "admin_users" ? "id" : "id";
    const [rows] = await db_1.db.execute(`SELECT token_version FROM ${table} WHERE ${col} = ? LIMIT 1`, [id]);
    return Number(rows[0]?.token_version ?? 0);
}
async function incrementTokenVersion(table, id) {
    await db_1.db.execute(`UPDATE ${table} SET token_version = token_version + 1 WHERE id = ?`, [id]);
}
// ─── Performance indexes — idempotent, run at startup ────────────────────────
async function ensureIndexes() {
    const indexes = [
        // factures — filtres fréquents sur statut, date, order_id et statut_paiement
        ["CREATE INDEX IF NOT EXISTS idx_fac_statut     ON factures (statut)", "factures.statut"],
        ["CREATE INDEX IF NOT EXISTS idx_fac_created    ON factures (created_at)", "factures.created_at"],
        ["CREATE INDEX IF NOT EXISTS idx_fac_order_id   ON factures (order_id)", "factures.order_id"],
        ["CREATE INDEX IF NOT EXISTS idx_fac_statut_pmt ON factures (statut_paiement)", "factures.statut_paiement"],
        ["CREATE INDEX IF NOT EXISTS idx_fac_source     ON factures (source(20))", "factures.source"],
        // orders — LEFT JOIN + filtre status/updated_at
        ["CREATE INDEX IF NOT EXISTS idx_ord_status     ON orders (status)", "orders.status"],
        ["CREATE INDEX IF NOT EXISTS idx_ord_status_upd ON orders (status, updated_at)", "orders.status+updated_at"],
        // finance_entries — GROUP BY type + filtre date + ORDER BY date_entree
        ["CREATE INDEX IF NOT EXISTS idx_fe_type_date   ON finance_entries (type, date_entree)", "finance_entries.type+date_entree"],
        ["CREATE INDEX IF NOT EXISTS idx_fe_created     ON finance_entries (date_entree)", "finance_entries.date_entree"],
        // devis — ORDER BY / filtre date
        ["CREATE INDEX IF NOT EXISTS idx_dev_created    ON devis (created_at)", "devis.created_at"],
        // livraisons_ventes — ORDER BY / filtre date
        ["CREATE INDEX IF NOT EXISTS idx_liv_created    ON livraisons_ventes (created_at)", "livraisons_ventes.created_at"],
        // orders — recherche par téléphone (suivi commande public)
        ["CREATE INDEX IF NOT EXISTS idx_ord_telephone  ON orders (telephone)", "orders.telephone"],
    ];
    for (const [sql, label] of indexes) {
        try {
            await db_1.db.execute(sql);
            console.log(`[indexes] OK: ${label}`);
        }
        catch (e) {
            // ER_DUP_KEYNAME = index already exists under a different name — safe to ignore
            const code = e.code;
            if (code !== "ER_DUP_KEYNAME")
                console.warn(`[indexes] ${label}:`, e.message);
        }
    }
}
