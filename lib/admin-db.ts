import "server-only";
import { db } from "./db";
import type mysql from "mysql2/promise";

/* ─── Admin Users ─── */
export interface AdminUser {
  id:           number;
  nom:          string;
  email:        string;
  password_hash: string;
  role:         string;
  actif:        boolean;
  created_at:   string;
  last_login:   string | null;
}

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM admin_users WHERE email = ? AND actif = 1 LIMIT 1",
    [email]
  );
  return rows[0] as AdminUser ?? null;
}

export async function getAdminById(id: number): Promise<AdminUser | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM admin_users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] as AdminUser ?? null;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, email, role, actif, created_at, last_login FROM admin_users ORDER BY id ASC"
  );
  return rows as AdminUser[];
}

export async function createAdminUser(data: {
  nom: string; email: string; password_hash: string; role: string;
}) {
  await db.execute(
    "INSERT INTO admin_users (nom, email, password_hash, role) VALUES (?,?,?,?)",
    [data.nom, data.email, data.password_hash, data.role]
  );
}

export async function updateAdminLastLogin(id: number) {
  await db.execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [id]);
}

export async function updateAdminUser(id: number, data: Partial<Omit<AdminUser, "id" | "password_hash">>) {
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.nom   !== undefined) { sets.push("nom = ?");   vals.push(data.nom); }
  if (data.email !== undefined) { sets.push("email = ?"); vals.push(data.email); }
  if (data.role  !== undefined) { sets.push("role = ?");  vals.push(data.role); }
  if (data.actif !== undefined) { sets.push("actif = ?"); vals.push(data.actif ? 1 : 0); }
  if (!sets.length) return;
  vals.push(id);
  await db.execute(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, vals as mysql.ExecuteValues);
}

export async function updateAdminPassword(id: number, password_hash: string) {
  await db.execute("UPDATE admin_users SET password_hash = ? WHERE id = ?", [password_hash, id]);
}

/* ─── Settings ─── */
export async function getSettings(): Promise<Record<string, string>> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT `key`, `value` FROM settings"
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export async function getSetting(key: string): Promise<string> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT `value` FROM settings WHERE `key` = ?",
    [key]
  );
  return (rows[0]?.value as string) ?? "";
}

export async function setSetting(key: string, value: string) {
  await db.execute(
    "INSERT INTO settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, value]
  );
}

export async function setSettings(entries: Record<string, string>) {
  if (!Object.keys(entries).length) return;
  const rows = Object.entries(entries).map(([k, v]) => [k, v]);
  for (const [k, v] of rows) {
    await setSetting(k, v);
  }
}

/* ─── Delivery Zones ─── */
export interface DeliveryZone {
  id:         number;
  nom:        string;
  fee:        number;
  actif:      boolean;
  sort_order: number;
}

export async function getDeliveryZones(activeOnly = false): Promise<DeliveryZone[]> {
  const where = activeOnly ? "WHERE actif = 1" : "";
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM delivery_zones ${where} ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(r => ({ ...r, actif: Boolean(r.actif) })) as DeliveryZone[];
}

export async function upsertDeliveryZone(zone: Omit<DeliveryZone, "id"> & { id?: number }) {
  if (zone.id) {
    await db.execute(
      "UPDATE delivery_zones SET nom=?, fee=?, actif=?, sort_order=? WHERE id=?",
      [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order, zone.id]
    );
  } else {
    await db.execute(
      "INSERT INTO delivery_zones (nom, fee, actif, sort_order) VALUES (?,?,?,?)",
      [zone.nom, zone.fee, zone.actif ? 1 : 0, zone.sort_order]
    );
  }
}

export async function deleteDeliveryZone(id: number) {
  await db.execute("DELETE FROM delivery_zones WHERE id = ?", [id]);
}

/* ─── Orders ─── */
export interface Order {
  id:             number;
  reference:      string;
  nom:            string;
  telephone:      string;
  adresse:        string;
  zone_livraison: string;
  delivery_fee:   number;
  note:           string;
  items:          string;
  subtotal:       number;
  total:          number;
  status:         string;
  created_at:     string;
}

export async function listOrders(limit = 50, offset = 0): Promise<Order[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  );
  return rows as Order[];
}

export async function countOrders(): Promise<number> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM orders"
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function updateOrderStatus(id: number, status: string) {
  await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}

export async function getOrderById(id: number): Promise<Order | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM orders WHERE id = ? LIMIT 1", [id]
  );
  return (rows[0] as Order) ?? null;
}

export async function createOrder(data: {
  nom: string;
  telephone: string;
  adresse: string;
  zone_livraison: string;
  delivery_fee: number;
  note: string;
  items: Array<{ id: number; nom: string; reference: string; prix: number; qty: number; total: number }>;
  subtotal: number;
  total: number;
}): Promise<number> {
  // Generate reference CMD-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const reference = `CMD-${dateStr}-${rand}`;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO orders (reference, nom, telephone, adresse, zone_livraison, delivery_fee, note, items, subtotal, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [reference, data.nom, data.telephone, data.adresse, data.zone_livraison,
     data.delivery_fee, data.note, JSON.stringify(data.items), data.subtotal, data.total]
  );
  return result.insertId;
}

/* ─── Order Events (timeline) ─── */
export interface OrderEvent {
  id:         number;
  order_id:   number;
  status:     string;
  note:       string;
  created_by: string;
  created_at: string;
}

export async function addOrderEvent(
  order_id: number, status: string, note = "", created_by = ""
) {
  await db.execute(
    "INSERT INTO order_events (order_id, status, note, created_by) VALUES (?,?,?,?)",
    [order_id, status, note, created_by]
  );
}

export async function getOrderEvents(order_id: number): Promise<OrderEvent[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC",
    [order_id]
  );
  return rows as OrderEvent[];
}

/* ─── Stats for dashboard ─── */
export async function getDashboardStats() {
  const [ordersRow] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as revenue FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  );
  const [productsRow] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM produits WHERE actif = 1"
  );
  const [messagesRow] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM whatsapp_messages WHERE direction='in' AND read_at IS NULL"
  ).catch(() => [[{ cnt: 0 }]] as unknown as [mysql.RowDataPacket[], mysql.FieldPacket[]]);

  const [recentOrders] = await db.query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"
  ).catch(() => [[] as mysql.RowDataPacket[], [] as mysql.FieldPacket[]]);

  return {
    orders30d:       Number(ordersRow[0]?.cnt ?? 0),
    revenue30d:      Number(ordersRow[0]?.revenue ?? 0),
    productsActive:  Number(productsRow[0]?.cnt ?? 0),
    unreadMessages:  Number(messagesRow[0]?.cnt ?? 0),
    recentOrders:    recentOrders as Order[],
  };
}

/* ─── WhatsApp Messages ─── */
export interface WaMessage {
  id:           number;
  wa_message_id: string;
  from_number:  string;
  to_number:    string;
  contact_name: string;
  direction:    "in" | "out";
  type:         string;
  content:      string;
  media_url:    string;
  status:       string;
  read_at:      string | null;
  created_at:   string;
}

export async function listWaMessages(limit = 100): Promise<WaMessage[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT ${limit}`
  ).catch(() => [[] as mysql.RowDataPacket[], [] as mysql.FieldPacket[]]);
  return rows as WaMessage[];
}

export async function markMessagesRead(ids: number[]) {
  if (!ids.length) return;
  await db.query(
    `UPDATE whatsapp_messages SET read_at = NOW() WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
}

export async function saveIncomingMessage(msg: Omit<WaMessage, "id" | "read_at" | "created_at">) {
  await db.execute(
    `INSERT IGNORE INTO whatsapp_messages
     (wa_message_id, from_number, to_number, contact_name, direction, type, content, media_url, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [msg.wa_message_id, msg.from_number, msg.to_number, msg.contact_name,
     msg.direction, msg.type, msg.content, msg.media_url, msg.status]
  );
}

/* ─── Reviews ─── */
export interface Review {
  id:         number;
  product_id: number;
  nom:        string;
  rating:     number;
  comment:    string;
  approved:   boolean;
  created_at: string;
}

export async function listReviews(approvedOnly = false): Promise<Review[]> {
  const where = approvedOnly ? "WHERE approved = 1" : "";
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT r.*, p.nom as product_nom FROM reviews r
     LEFT JOIN produits p ON r.product_id = p.id
     ${where} ORDER BY r.created_at DESC`
  );
  return rows.map(r => ({ ...r, approved: Boolean(r.approved) })) as Review[];
}

export async function approveReview(id: number, approved: boolean) {
  await db.execute("UPDATE reviews SET approved = ? WHERE id = ?", [approved ? 1 : 0, id]);
}

export async function deleteReview(id: number) {
  await db.execute("DELETE FROM reviews WHERE id = ?", [id]);
}

/* ─── Coupons ─── */
export interface Coupon {
  id:         number;
  code:       string;
  type:       "percent" | "fixed";
  valeur:     number;
  min_order:  number;
  max_uses:   number;
  uses_count: number;
  expires_at: string | null;
  actif:      boolean;
  created_at: string;
}

export async function listCoupons(): Promise<Coupon[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM coupons ORDER BY created_at DESC"
  );
  return rows.map(r => ({ ...r, actif: Boolean(r.actif) })) as Coupon[];
}

export async function upsertCoupon(c: Omit<Coupon, "id" | "uses_count" | "created_at"> & { id?: number }) {
  if (c.id) {
    await db.execute(
      "UPDATE coupons SET code=?,type=?,valeur=?,min_order=?,max_uses=?,expires_at=?,actif=? WHERE id=?",
      [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0, c.id]
    );
  } else {
    await db.execute(
      "INSERT INTO coupons (code,type,valeur,min_order,max_uses,expires_at,actif) VALUES (?,?,?,?,?,?,?)",
      [c.code, c.type, c.valeur, c.min_order, c.max_uses, c.expires_at || null, c.actif ? 1 : 0]
    );
  }
}

export async function deleteCoupon(id: number) {
  await db.execute("DELETE FROM coupons WHERE id = ?", [id]);
}

/* ─── Categories (admin) ─── */
export interface AdminCategory {
  id:          number;
  nom:         string;
  description: string;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, COALESCE(description,'') as description FROM categories ORDER BY nom ASC"
  );
  return rows as AdminCategory[];
}

export async function createCategory(nom: string, description: string) {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    "INSERT INTO categories (nom, description) VALUES (?,?)",
    [nom, description]
  );
  return result.insertId;
}

export async function updateCategory(id: number, nom: string, description: string) {
  await db.execute(
    "UPDATE categories SET nom=?, description=? WHERE id=?",
    [nom, description, id]
  );
}

export async function deleteCategory(id: number) {
  await db.execute("DELETE FROM categories WHERE id = ?", [id]);
}

/* ─── Clients (CRM) ─── */
export interface Client {
  id:         number;
  telephone:  string;
  nom:        string;
  email:      string;
  adresse:    string;
  ville:      string;
  tags:       string | null;
  statut:     "normal" | "vip" | "blacklist";
  notes:      string;
  created_at: string;
  updated_at: string;
}

export async function listClients(limit = 50, offset = 0, search = ""): Promise<Client[]> {
  const where = search
    ? "WHERE telephone LIKE ? OR nom LIKE ?"
    : "";
  const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
  return rows as Client[];
}

export async function countClients(search = ""): Promise<number> {
  const where = search ? "WHERE telephone LIKE ? OR nom LIKE ?" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM clients ${where}`,
    params as mysql.ExecuteValues
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function getClientByPhone(telephone: string): Promise<Client | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM clients WHERE telephone = ? LIMIT 1",
    [telephone]
  );
  return (rows[0] as Client) ?? null;
}

export async function getClientById(id: number): Promise<Client | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM clients WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as Client) ?? null;
}

export async function upsertClient(data: Partial<Client> & { telephone: string }) {
  const existing = await getClientByPhone(data.telephone);
  if (existing) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (data.nom     !== undefined) { sets.push("nom=?");     vals.push(data.nom); }
    if (data.email   !== undefined) { sets.push("email=?");   vals.push(data.email); }
    if (data.adresse !== undefined) { sets.push("adresse=?"); vals.push(data.adresse); }
    if (data.ville   !== undefined) { sets.push("ville=?");   vals.push(data.ville); }
    if (data.statut  !== undefined) { sets.push("statut=?");  vals.push(data.statut); }
    if (data.notes   !== undefined) { sets.push("notes=?");   vals.push(data.notes); }
    if (data.tags    !== undefined) { sets.push("tags=?");    vals.push(data.tags); }
    if (sets.length) {
      vals.push(existing.id);
      await db.execute(
        `UPDATE clients SET ${sets.join(",")} WHERE id=?`,
        vals as mysql.ExecuteValues
      );
    }
    return existing.id;
  } else {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      "INSERT INTO clients (telephone,nom,email,adresse,ville,statut,notes,tags) VALUES (?,?,?,?,?,?,?,?)",
      [data.telephone, data.nom ?? "", data.email ?? "", data.adresse ?? "",
       data.ville ?? "", data.statut ?? "normal", data.notes ?? "", data.tags ?? null]
    );
    return result.insertId;
  }
}

export async function deleteClient(id: number) {
  await db.execute("DELETE FROM clients WHERE id = ?", [id]);
}

export async function getClientOrders(telephone: string): Promise<Order[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders WHERE telephone = ? ORDER BY created_at DESC",
    [telephone]
  );
  return rows as Order[];
}

export interface ClientStats {
  total_orders:   number;
  total_spent:    number;
  avg_basket:     number;
  last_order_at:  string | null;
}

export async function getClientStats(telephone: string): Promise<ClientStats> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_spent,
     COALESCE(AVG(total),0) as avg_basket, MAX(created_at) as last_order_at
     FROM orders WHERE telephone = ?`,
    [telephone]
  );
  const r = rows[0] ?? {};
  return {
    total_orders:  Number(r.total_orders ?? 0),
    total_spent:   Number(r.total_spent  ?? 0),
    avg_basket:    Number(r.avg_basket   ?? 0),
    last_order_at: r.last_order_at ?? null,
  };
}

export async function getCRMStats() {
  const [newClients] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM clients WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  ).catch(() => [[{ cnt: 0 }]] as unknown as [mysql.RowDataPacket[], mysql.FieldPacket[]]);

  const [topClients] = await db.query<mysql.RowDataPacket[]>(
    `SELECT c.id, c.nom, c.telephone, c.statut,
     COUNT(o.id) as total_orders, COALESCE(SUM(o.total),0) as total_spent
     FROM clients c
     LEFT JOIN orders o ON o.telephone = c.telephone
     GROUP BY c.id ORDER BY total_spent DESC LIMIT 10`
  ).catch(() => [[] as mysql.RowDataPacket[], [] as mysql.FieldPacket[]]);

  return {
    newClients30d: Number(newClients[0]?.cnt ?? 0),
    topClients: topClients as unknown as Record<string, unknown>[],
  };
}

/* ─── Entrepôts (multi-boutique) ─── */
export interface Entrepot {
  id:          number;
  nom:         string;
  adresse:     string;
  telephone:   string;
  responsable: string;
  actif:       boolean;
  sort_order:  number;
  created_at:  string;
}

export async function listEntrepots(activeOnly = false): Promise<Entrepot[]> {
  const where = activeOnly ? "WHERE actif = 1" : "";
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM entrepots ${where} ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(r => ({ ...r, actif: Boolean(r.actif) })) as Entrepot[];
}

export async function upsertEntrepot(e: Omit<Entrepot, "id" | "created_at"> & { id?: number }) {
  if (e.id) {
    await db.execute(
      "UPDATE entrepots SET nom=?,adresse=?,telephone=?,responsable=?,actif=?,sort_order=? WHERE id=?",
      [e.nom, e.adresse, e.telephone, e.responsable, e.actif ? 1 : 0, e.sort_order, e.id]
    );
  } else {
    await db.execute(
      "INSERT INTO entrepots (nom,adresse,telephone,responsable,actif,sort_order) VALUES (?,?,?,?,?,?)",
      [e.nom, e.adresse, e.telephone, e.responsable, e.actif ? 1 : 0, e.sort_order]
    );
  }
}

export async function deleteEntrepot(id: number) {
  await db.execute("DELETE FROM entrepots WHERE id = ?", [id]);
}

export interface ProduitStock {
  produit_id:  number;
  entrepot_id: number;
  stock:       number;
  nom_entrepot?: string;
  nom_produit?:  string;
}

export async function getStocksForProduct(produit_id: number): Promise<ProduitStock[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT ps.*, e.nom as nom_entrepot FROM produit_stocks ps
     JOIN entrepots e ON e.id = ps.entrepot_id
     WHERE ps.produit_id = ?`,
    [produit_id]
  );
  return rows as ProduitStock[];
}

export async function getStocksForEntrepot(entrepot_id: number): Promise<ProduitStock[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT ps.*, p.nom as nom_produit FROM produit_stocks ps
     JOIN produits p ON p.id = ps.produit_id
     WHERE ps.entrepot_id = ?
     ORDER BY p.nom ASC`,
    [entrepot_id]
  );
  return rows as ProduitStock[];
}

export async function updateProductStock(produit_id: number, entrepot_id: number, stock: number) {
  await db.execute(
    `INSERT INTO produit_stocks (produit_id, entrepot_id, stock) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
    [produit_id, entrepot_id, stock]
  );
}

/* ─── Stock dashboard stats ─── */
export async function getStockStats() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
    SELECT
      SUM(CASE WHEN stock_boutique > 0 THEN 1 ELSE 0 END)                         AS en_stock,
      SUM(CASE WHEN stock_boutique = 0  THEN 1 ELSE 0 END)                         AS en_rupture,
      SUM(CASE WHEN stock_boutique > 0 AND stock_boutique <= 5 THEN 1 ELSE 0 END)  AS stock_faible,
      COALESCE(SUM(prix_unitaire * stock_boutique), 0)                              AS valeur_totale
    FROM produits
    WHERE actif = 1
  `);
  const r = rows[0];
  return {
    en_stock:      Number(r.en_stock      ?? 0),
    en_rupture:    Number(r.en_rupture    ?? 0),
    stock_faible:  Number(r.stock_faible  ?? 0),
    valeur_totale: Number(r.valeur_totale ?? 0),
    entrees_jour:  0,
    sorties_jour:  0,
  };
}

/* ─── Stock Boutique (tables dédiées boutique_stock + boutique_mouvements) ─── */
export interface BoutiqueStockItem {
  produit_id:    number;
  nom:           string;
  reference:     string;
  image_url:     string | null;
  categorie_nom: string;
  prix_unitaire: number;
  remise:        number;
  quantite:      number;
  seuil_alerte:  number;
  valeur:        number;
}

export interface BoutiqueStats {
  total_produits:  number;
  valeur_boutique: number;
  stock_faible:    number;
  epuises:         number;
}

export interface BoutiqueMouvement {
  id:           number;
  produit_id:   number;
  nom_produit:  string;
  type:         "entree" | "sortie" | "retrait" | "ajustement";
  quantite:     number;
  motif:        string | null;
  ref_commande: string | null;
  admin_id:     number | null;
  created_at:   string;
}

async function getProduitColsAdmin() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produits'`
  );
  const names = new Set(rows.map(r => (r.COLUMN_NAME as string).toLowerCase()));
  return {
    image_url: names.has("image_url"),
    image:     names.has("image"),
    remise:    names.has("remise"),
  };
}

export async function getStockBoutiqueStats(): Promise<BoutiqueStats> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
    SELECT
      COUNT(bs.produit_id)                                                                  AS total_produits,
      COALESCE(SUM(bs.quantite * p.prix_unitaire), 0)                                      AS valeur_boutique,
      SUM(CASE WHEN bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte THEN 1 ELSE 0 END) AS stock_faible,
      SUM(CASE WHEN bs.quantite = 0 THEN 1 ELSE 0 END)                                     AS epuises
    FROM boutique_stock bs
    JOIN produits p ON p.id = bs.produit_id
  `);
  const r = rows[0] ?? {};
  return {
    total_produits:  Number(r.total_produits  ?? 0),
    valeur_boutique: Number(r.valeur_boutique ?? 0),
    stock_faible:    Number(r.stock_faible    ?? 0),
    epuises:         Number(r.epuises         ?? 0),
  };
}

export async function getStockBoutiqueList(opts: {
  search?: string;
  filter?: "all" | "faible" | "epuise";
  limit?: number;
  offset?: number;
}): Promise<{ items: BoutiqueStockItem[]; total: number }> {
  const { search, filter = "all", limit = 50, offset = 0 } = opts;

  const cols = await getProduitColsAdmin();
  const imageCol  = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const remiseCol = cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0";

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filter === "faible") conditions.push("bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte");
  if (filter === "epuise") conditions.push("bs.quantite = 0");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT bs.produit_id, p.nom, p.reference,
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
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [countRows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt
     FROM boutique_stock bs
     JOIN produits p ON p.id = bs.produit_id
     ${where}`,
    params
  );

  return {
    items: rows.map(r => ({
      produit_id:    Number(r.produit_id),
      nom:           String(r.nom),
      reference:     String(r.reference ?? ""),
      image_url:     r.image_url ?? null,
      categorie_nom: String(r.categorie_nom ?? ""),
      prix_unitaire: Number(r.prix_unitaire),
      remise:        Number(r.remise ?? 0),
      quantite:      Number(r.quantite),
      seuil_alerte:  Number(r.seuil_alerte),
      valeur:        Number(r.valeur),
    })),
    total: Number(countRows[0]?.cnt ?? 0),
  };
}

export async function createBoutiqueMouvement(data: {
  produit_id:    number;
  type:          "entree" | "sortie" | "retrait" | "ajustement";
  quantite:      number;
  motif?:        string;
  ref_commande?: string;
  admin_id?:     number;
}): Promise<void> {
  await db.execute(
    `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
     VALUES (?,?,?,?,?,?)`,
    [data.produit_id, data.type, Math.abs(data.quantite),
     data.motif ?? null, data.ref_commande ?? null, data.admin_id ?? null]
  );
  const delta = data.type === "entree" ? Math.abs(data.quantite) : -Math.abs(data.quantite);
  await db.execute(
    `UPDATE boutique_stock SET quantite = GREATEST(0, quantite + ?), updated_at = NOW() WHERE produit_id = ?`,
    [delta, data.produit_id]
  );
  await db.execute(
    `UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id SET p.stock_boutique = bs.quantite WHERE p.id = ?`,
    [data.produit_id]
  );
}

export async function getRecentBoutiqueMovements(limit = 30): Promise<BoutiqueMouvement[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT bm.*, p.nom AS nom_produit
     FROM boutique_mouvements bm
     JOIN produits p ON p.id = bm.produit_id
     ORDER BY bm.created_at DESC
     LIMIT ${Number(limit)}`
  );
  return rows as BoutiqueMouvement[];
}

/* ─── Ventes : Factures ─── */
export interface FactureItem {
  nom:       string;
  reference: string;
  qty:       number;
  prix:      number;
  total:     number;
}

export interface Facture {
  id:           number;
  reference:    string;
  client_nom:   string;
  client_tel:   string | null;
  client_email: string | null;
  items:        string;
  sous_total:   number;
  remise:       number;
  total:        number;
  statut:       "brouillon" | "valide" | "paye" | "annule";
  note:         string | null;
  admin_id:     number | null;
  created_at:   string;
  updated_at:   string;
}

export async function listFactures(opts: { limit?: number; offset?: number; search?: string; statut?: string } = {}): Promise<{ items: Facture[]; total: number }> {
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (search) { conditions.push("(client_nom LIKE ? OR reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM factures ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM factures ${where}`, params);
  return { items: rows as Facture[], total: Number(cnt[0]?.cnt ?? 0) };
}

export async function getFactureById(id: number): Promise<Facture | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT * FROM factures WHERE id = ? LIMIT 1", [id]);
  return (rows[0] as Facture) ?? null;
}

function generateVenteRef(prefix: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const seq  = String(Math.floor(1 + Math.random() * 9999)).padStart(4, "0");
  return `${prefix}-${date}_${time}-${seq}`;
}

export async function createFacture(data: {
  client_nom: string; client_tel?: string; client_email?: string;
  items: FactureItem[]; sous_total: number; remise?: number; total: number;
  statut?: Facture["statut"]; note?: string; admin_id?: number;
}): Promise<number> {
  const reference = generateVenteRef("FV");
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO factures (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, note, admin_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [reference, data.client_nom, data.client_tel ?? null, data.client_email ?? null,
     JSON.stringify(data.items), data.sous_total, data.remise ?? 0, data.total,
     data.statut ?? "brouillon", data.note ?? null, data.admin_id ?? null]
  );
  return result.insertId;
}

export async function updateFactureStatut(id: number, statut: Facture["statut"]) {
  await db.execute("UPDATE factures SET statut = ? WHERE id = ?", [statut, id]);
}

export async function deleteFacture(id: number) {
  await db.execute("DELETE FROM factures WHERE id = ?", [id]);
}

/* ─── Ventes : Devis ─── */
export interface Devis {
  id:           number;
  reference:    string;
  client_nom:   string;
  client_tel:   string | null;
  client_email: string | null;
  items:        string;
  sous_total:   number;
  remise:       number;
  total:        number;
  statut:       "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
  valide_jusqu: string | null;
  note:         string | null;
  admin_id:     number | null;
  created_at:   string;
  updated_at:   string;
}

export async function listDevis(opts: { limit?: number; offset?: number; search?: string; statut?: string } = {}): Promise<{ items: Devis[]; total: number }> {
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (search) { conditions.push("(client_nom LIKE ? OR reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM devis ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM devis ${where}`, params);
  return { items: rows as Devis[], total: Number(cnt[0]?.cnt ?? 0) };
}

export async function createDevis(data: {
  client_nom: string; client_tel?: string; client_email?: string;
  items: FactureItem[]; sous_total: number; remise?: number; total: number;
  statut?: Devis["statut"]; valide_jusqu?: string; note?: string; admin_id?: number;
}): Promise<number> {
  const reference = generateVenteRef("DV");
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO devis (reference, client_nom, client_tel, client_email, items, sous_total, remise, total, statut, valide_jusqu, note, admin_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [reference, data.client_nom, data.client_tel ?? null, data.client_email ?? null,
     JSON.stringify(data.items), data.sous_total, data.remise ?? 0, data.total,
     data.statut ?? "brouillon", data.valide_jusqu ?? null, data.note ?? null, data.admin_id ?? null]
  );
  return result.insertId;
}

export async function updateDevisStatut(id: number, statut: Devis["statut"]) {
  await db.execute("UPDATE devis SET statut = ? WHERE id = ?", [statut, id]);
}

export async function deleteDevis(id: number) {
  await db.execute("DELETE FROM devis WHERE id = ?", [id]);
}

/* ─── Ventes : Livraisons ─── */
export interface Livraison {
  id:          number;
  reference:   string;
  facture_id:  number | null;
  client_nom:  string;
  client_tel:  string | null;
  adresse:     string | null;
  statut:      "en_attente" | "en_cours" | "livre" | "echoue";
  livreur:     string | null;
  note:        string | null;
  livree_le:   string | null;
  created_at:  string;
  updated_at:  string;
}

export async function listLivraisons(opts: { limit?: number; offset?: number; search?: string; statut?: string } = {}): Promise<{ items: Livraison[]; total: number }> {
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (search) { conditions.push("(client_nom LIKE ? OR reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM livraisons ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM livraisons ${where}`, params);
  return { items: rows as Livraison[], total: Number(cnt[0]?.cnt ?? 0) };
}

export async function updateLivraisonStatut(id: number, statut: Livraison["statut"]) {
  await db.execute("UPDATE livraisons SET statut = ? WHERE id = ?", [statut, id]);
}

export async function deleteLivraison(id: number) {
  await db.execute("DELETE FROM livraisons WHERE id = ?", [id]);
}

export async function getVentesStats(): Promise<{ factures: number; devis: number; livraisons: number }> {
  const [[f], [d], [l]] = await Promise.all([
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM factures"),
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM devis"),
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM livraisons"),
  ]);
  return {
    factures:   Number((f as mysql.RowDataPacket[])[0]?.cnt ?? 0),
    devis:      Number((d as mysql.RowDataPacket[])[0]?.cnt ?? 0),
    livraisons: Number((l as mysql.RowDataPacket[])[0]?.cnt ?? 0),
  };
}
