import { db } from "./db";
import type mysql from "mysql2/promise";

// ─── Stock Operations ─────────────────────────────────────────────────────────

export interface ProduitStock {
  produit_id: number;
  nom:        string;
  reference:  string;
  stock:      number; // stock magasin (sum de produit_stocks)
}

export async function getProduitsWithStock(): Promise<ProduitStock[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT id AS produit_id, nom, reference,
            COALESCE(stock_magasin, 0) AS stock
     FROM produits
     WHERE actif = 1
     ORDER BY nom`
  );
  return rows as ProduitStock[];
}

// Entrée stock magasin
export async function createStockEntree(data: {
  produit_id: number;
  quantite:   number;
  reference?: string;
  note?:      string;
  user_id?:   number;
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE produits SET stock_magasin = COALESCE(stock_magasin, 0) + ? WHERE id = ?`,
      [data.quantite, data.produit_id]
    );

    const [[stockRow]] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
      [data.produit_id]
    );
    const stockApres = Number((stockRow as mysql.RowDataPacket)?.stock ?? 0);

    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'entree', ?, ?, ?, ?, ?)`,
      [data.produit_id, data.quantite, stockApres, data.reference ?? null, data.note ?? null, data.user_id ?? null]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Sortie stock magasin → boutique
export async function createStockSortie(data: {
  produit_id: number;
  quantite:   number;
  reference?: string;
  note?:      string;
  user_id?:   number;
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[row]] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
      [data.produit_id]
    );
    const available = Number((row as mysql.RowDataPacket)?.stock ?? 0);
    if (available < data.quantite) {
      throw new Error(`Stock insuffisant : ${available} disponible(s), ${data.quantite} demandé(s)`);
    }

    // Decrement magasin, increment boutique
    await conn.execute(
      `UPDATE produits
       SET stock_magasin  = GREATEST(0, COALESCE(stock_magasin, 0) - ?),
           stock_boutique = COALESCE(stock_boutique, 0) + ?
       WHERE id = ?`,
      [data.quantite, data.quantite, data.produit_id]
    );

    const stockApres = available - data.quantite;

    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, reference, note, user_id)
       VALUES (?, 'retrait', ?, ?, ?, ?, ?)`,
      [data.produit_id, data.quantite, stockApres, data.reference ?? null, data.note ?? null, data.user_id ?? null]
    );

    // Track the entry in boutique_mouvements
    await conn.execute(
      `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
       VALUES (?, 'entree', ?, 'Depuis magasin', ?, ?)`,
      [data.produit_id, data.quantite, data.reference ?? null, data.user_id ?? null]
    );
    // Update boutique_stock (INSERT or increment)
    await conn.execute(
      `INSERT INTO boutique_stock (produit_id, quantite)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite), updated_at = NOW()`,
      [data.produit_id, data.quantite]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Ajustement stock magasin (correction)
export async function createStockAjustement(data: {
  produit_id: number;
  quantite:   number; // positif = ajout, négatif = retrait
  motif:      string;
  user_id?:   number;
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const abs  = Math.abs(data.quantite);
    const type = data.quantite >= 0 ? "entree" : "retrait";

    await conn.execute(
      `UPDATE produits
       SET stock_magasin = GREATEST(0, COALESCE(stock_magasin, 0) + ?)
       WHERE id = ?`,
      [data.quantite, data.produit_id]
    );

    const [[stockRow]] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(stock_magasin, 0) AS stock FROM produits WHERE id = ?`,
      [data.produit_id]
    );
    const stockApres = Number((stockRow as mysql.RowDataPacket)?.stock ?? 0);

    await conn.execute(
      `INSERT INTO stock_mouvements (produit_id, type, quantite, stock_apres, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.produit_id, type, abs, stockApres, data.motif, data.user_id ?? null]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Stock Movements ───────────────────────────────────────────────────────────

export interface StockMouvement {
  id:          number;
  produit_id:  number;
  nom_produit: string;
  type:        "entree" | "retrait" | "vente" | "ajustement";
  quantite:    number;
  stock_apres: number;
  reference:   string | null;
  note:        string | null;
  user_id:     number | null;
  created_at:  string;
}

export async function getStockMovementCounts(): Promise<{
  total: number; entrees: number; sorties: number; ajustements: number;
}> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(type = 'entree')              AS entrees,
       SUM(type IN ('retrait','vente'))  AS sorties,
       SUM(type NOT IN ('entree','retrait','vente')) AS ajustements
     FROM stock_mouvements`
  );
  const r = (rows as mysql.RowDataPacket[])[0];
  return {
    total:       Number(r?.total       ?? 0),
    entrees:     Number(r?.entrees     ?? 0),
    sorties:     Number(r?.sorties     ?? 0),
    ajustements: Number(r?.ajustements ?? 0),
  };
}

export async function getStockMovements(opts: {
  type?:   "entree" | "retrait" | "vente" | "sortie" | "tous" | "ajustement";
  search?: string;
  limit?:  number;
  offset?: number;
} = {}): Promise<{ items: StockMouvement[]; total: number }> {
  const { limit = 50, offset = 0, type, search } = opts;
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];

  if (type && type !== "tous") {
    if (type === "sortie") {
      conditions.push("sm.type IN ('retrait','vente')");
    } else {
      conditions.push("sm.type = ?"); params.push(type);
    }
  }
  if (search) { conditions.push("(p.nom LIKE ? OR sm.reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT sm.*, p.nom AS nom_produit
     FROM stock_mouvements sm
     LEFT JOIN produits p ON p.id = sm.produit_id
     ${where}
     ORDER BY sm.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM stock_mouvements sm LEFT JOIN produits p ON p.id = sm.produit_id ${where}`,
    params
  );
  return { items: rows as StockMouvement[], total: Number(cnt[0]?.cnt ?? 0) };
}

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

// ─── Utilisateurs métier ───────────────────────────────────────────────────────

export interface Utilisateur {
  id:             number;
  nom:            string;
  email:          string | null;
  telephone:      string | null;
  poste:          "Administrateur" | "Commercial" | "Responsable" | "Livreur";
  actif:          number;
  date_creation:  string;
}

export interface Permission {
  id:          number;
  nom:         string;
  description: string | null;
  module:      string | null;
}

export async function listUtilisateurs(): Promise<Utilisateur[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, email, telephone, poste, actif, date_creation FROM utilisateurs ORDER BY date_creation DESC"
  );
  return rows as Utilisateur[];
}

export async function getUtilisateurById(id: number): Promise<Utilisateur | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, email, telephone, poste, actif, date_creation FROM utilisateurs WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as Utilisateur) ?? null;
}

export async function createUtilisateur(data: {
  nom: string; email?: string; telephone?: string;
  poste: string; motDePasse: string;
}): Promise<number> {
  const [res] = await db.execute<mysql.ResultSetHeader>(
    "INSERT INTO utilisateurs (nom, email, telephone, poste, mot_de_passe) VALUES (?,?,?,?,?)",
    [data.nom, data.email ?? null, data.telephone ?? null, data.poste, data.motDePasse]
  );
  return res.insertId;
}

export async function updateUtilisateur(id: number, data: {
  nom?: string; email?: string; telephone?: string;
  poste?: string; actif?: number; motDePasse?: string;
}) {
  const fields: string[] = [];
  const values: (string | number | boolean | null | Buffer)[] = [];
  if (data.nom       !== undefined) { fields.push("nom = ?");         values.push(data.nom); }
  if (data.email     !== undefined) { fields.push("email = ?");       values.push(data.email); }
  if (data.telephone !== undefined) { fields.push("telephone = ?");   values.push(data.telephone); }
  if (data.poste     !== undefined) { fields.push("poste = ?");       values.push(data.poste); }
  if (data.actif     !== undefined) { fields.push("actif = ?");       values.push(data.actif); }
  if (data.motDePasse !== undefined){ fields.push("mot_de_passe = ?");values.push(data.motDePasse); }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteUtilisateur(id: number) {
  await db.execute("DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?", [id]);
  await db.execute("DELETE FROM utilisateurs WHERE id = ?", [id]);
}

export async function listPermissions(): Promise<Permission[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT id, nom, description, module FROM permissions ORDER BY module, id ASC"
  );
  return rows as Permission[];
}

export async function getUtilisateurPermissions(utilisateurId: number): Promise<number[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT permission_id FROM utilisateur_permissions WHERE utilisateur_id = ?",
    [utilisateurId]
  );
  return (rows as mysql.RowDataPacket[]).map(r => Number(r.permission_id));
}

export async function setUtilisateurPermissions(utilisateurId: number, permissionIds: number[]) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM utilisateur_permissions WHERE utilisateur_id = ?", [utilisateurId]);
    for (const pid of permissionIds) {
      await conn.execute(
        "INSERT IGNORE INTO utilisateur_permissions (utilisateur_id, permission_id) VALUES (?,?)",
        [utilisateurId, pid]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
  id:              number;
  reference:       string;
  nom:             string;
  telephone:       string;
  adresse:         string;
  zone_livraison:  string;
  delivery_fee:    number;
  note:            string;
  items:           string;
  subtotal:        number;
  total:           number;
  status:          string;
  statut_paiement: string | null;
  created_at:      string;
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

export async function updateOrderFields(id: number, data: {
  nom?:               string;
  telephone?:         string;
  adresse?:           string;
  zone_livraison?:    string;
  note?:              string;
  delivery_fee?:      number;
  subtotal?:          number;
  total?:             number;
  items?:             string;
  statut_paiement?:   string;
  lien_localisation?: string | null;
}) {
  const sets:   string[]                        = [];
  const params: (string | number | null)[] = [];
  if (data.nom               !== undefined) { sets.push("nom = ?");               params.push(data.nom); }
  if (data.telephone         !== undefined) { sets.push("telephone = ?");         params.push(data.telephone); }
  if (data.adresse           !== undefined) { sets.push("adresse = ?");           params.push(data.adresse); }
  if (data.zone_livraison    !== undefined) { sets.push("zone_livraison = ?");    params.push(data.zone_livraison); }
  if (data.note              !== undefined) { sets.push("note = ?");              params.push(data.note); }
  if (data.delivery_fee      !== undefined) { sets.push("delivery_fee = ?");      params.push(data.delivery_fee); }
  if (data.subtotal          !== undefined) { sets.push("subtotal = ?");          params.push(data.subtotal); }
  if (data.total             !== undefined) { sets.push("total = ?");             params.push(data.total); }
  if (data.items             !== undefined) { sets.push("items = ?");             params.push(data.items); }
  if (data.statut_paiement   !== undefined) { sets.push("statut_paiement = ?");   params.push(data.statut_paiement); }
  if (data.lien_localisation !== undefined) { sets.push("lien_localisation = ?"); params.push(data.lien_localisation ?? null); }
  if (sets.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteOrder(id: number) {
  await db.execute("DELETE FROM order_events WHERE order_id = ?", [id]);
  await db.execute("DELETE FROM orders WHERE id = ?", [id]);
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

/* ─── Orders Stats (dashboard) ─── */
export interface OrdersStats {
  totalOrders:     number;
  totalRevenue:    number;
  avgOrderValue:   number;
  ordersToday:     number;
  orders7d:        number;
  orders30d:       number;
  revenue30d:      number;
  byStatus:        Record<string, number>;
  trend7d:         { date: string; count: number; revenue: number }[];
  recentOrders:    Order[];
}

export async function getOrdersStats(): Promise<OrdersStats> {
  const [
    [totalRow],
    [todayRow],
    [week7Row],
    [month30Row],
    statusRows,
    trendRows,
    recentRows,
  ] = await Promise.all([
    db.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders"
    ),
    db.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = CURDATE()"
    ),
    db.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    ),
    db.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    ),
    db.execute<mysql.RowDataPacket[]>(
      "SELECT status, COUNT(*) as cnt FROM orders GROUP BY status"
    ),
    db.execute<mysql.RowDataPacket[]>(
      `SELECT DATE(created_at) as date,
              COUNT(*) as count,
              COALESCE(SUM(total),0) as revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ),
    db.query<mysql.RowDataPacket[]>(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 8"
    ),
  ]);

  const total    = Number(totalRow[0]?.cnt ?? 0);
  const revenue  = Number(totalRow[0]?.rev ?? 0);

  const byStatus: Record<string, number> = {};
  for (const r of statusRows[0] as mysql.RowDataPacket[]) {
    byStatus[r.status] = Number(r.cnt);
  }

  const trend7d = (trendRows[0] as mysql.RowDataPacket[]).map(r => ({
    date:    String(r.date).slice(0, 10),
    count:   Number(r.count),
    revenue: Number(r.revenue),
  }));

  return {
    totalOrders:   total,
    totalRevenue:  revenue,
    avgOrderValue: total > 0 ? revenue / total : 0,
    ordersToday:   Number(todayRow[0]?.cnt ?? 0),
    orders7d:      Number(week7Row[0]?.cnt ?? 0),
    orders30d:     Number(month30Row[0]?.cnt ?? 0),
    revenue30d:    Number(month30Row[0]?.rev ?? 0),
    byStatus,
    trend7d,
    recentOrders:  recentRows[0] as Order[],
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

export async function listReviews(
  filter: { produit_id?: number; approvedOnly?: boolean } | boolean = false
): Promise<Review[]> {
  const opts = typeof filter === "boolean"
    ? { approvedOnly: filter }
    : filter;
  const conditions: string[] = [];
  const params: (number | boolean)[] = [];
  if (opts.approvedOnly) { conditions.push("r.approved = 1"); }
  if (opts.produit_id)   { conditions.push("r.product_id = ?"); params.push(opts.produit_id); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT r.*, p.nom as product_nom FROM reviews r
     LEFT JOIN produits p ON r.product_id = p.id
     ${where} ORDER BY r.created_at DESC`,
    params
  );
  return rows.map(r => ({ ...r, approved: Boolean(r.approved) })) as Review[];
}

export async function createReview(data: {
  produit_id: number; nom: string; note: number; commentaire?: string;
}) {
  await db.execute(
    `INSERT INTO reviews (product_id, nom, rating, comment, approved, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [data.produit_id, data.nom, data.note, data.commentaire ?? ""]
  );
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
  nb_produits: number;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT c.id, c.nom, COALESCE(c.description,'') AS description,
            COUNT(p.id) AS nb_produits
     FROM categories c
     LEFT JOIN produits p ON p.categorie_id = c.id AND p.actif = 1
     GROUP BY c.id
     ORDER BY c.nom ASC`
  );
  return rows.map(r => ({ ...r, nb_produits: Number(r.nb_produits) })) as AdminCategory[];
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

/* ─── Entrepôts — supprimés, stubs pour compatibilité des imports ─── */
export interface Entrepot {
  id: number; nom: string; adresse: string | null;
  telephone: string | null; responsable: string | null;
  actif: boolean; sort_order: number; created_at: string;
}
export async function listEntrepots(): Promise<Entrepot[]> { return []; }
export async function getEntrepots():  Promise<Entrepot[]> { return []; }
export async function upsertEntrepot(_e: unknown): Promise<void> {}
export async function deleteEntrepot(_id: number): Promise<void> {}

export interface ProduitStock {
  produit_id: number; stock: number;
  nom_produit?: string;
}

export async function updateProductStock(produit_id: number, _entrepot_id: number, stock: number) {
  await db.execute(
    `UPDATE produits SET stock_magasin = ? WHERE id = ?`,
    [stock, produit_id]
  );
}

/* ─── Stock dashboard stats ─── */
export async function getStockStats() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
    SELECT
      SUM(CASE WHEN COALESCE(stock_magasin, 0) > 0 THEN 1 ELSE 0 END)                           AS en_stock,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) = 0 THEN 1 ELSE 0 END)                           AS en_rupture,
      SUM(CASE WHEN COALESCE(stock_magasin, 0) > 0 AND COALESCE(stock_magasin, 0) <= 5 THEN 1 ELSE 0 END) AS stock_faible,
      COALESCE(SUM(prix_unitaire * COALESCE(stock_magasin, 0)), 0)                               AS valeur_totale
    FROM produits
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

async function ensureBoutiqueStockPopulated(): Promise<void> {
  // Create table if missing
  await db.execute(`
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
  const [[cnt]] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM boutique_stock"
  );
  if (Number((cnt as mysql.RowDataPacket).n ?? 0) === 0) {
    // Try with stock_boutique column first, fall back to 0
    await db.execute(`
      INSERT INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
      ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)
    `).catch(() =>
      db.execute(`
        INSERT INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
        ON DUPLICATE KEY UPDATE quantite = quantite
      `)
    );
  } else {
    // Ensure any new products added since last seeding are included
    await db.execute(`
      INSERT IGNORE INTO boutique_stock (produit_id, quantite)
      SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
      FROM produits
    `).catch(() =>
      db.execute(`
        INSERT IGNORE INTO boutique_stock (produit_id, quantite)
        SELECT id, 0 FROM produits
      `)
    );
  }
}

export async function getStockBoutiqueStats(): Promise<BoutiqueStats> {
  await ensureBoutiqueStockPopulated();
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
  filter?: "all" | "faible" | "epuise" | "disponible";
  limit?: number;
  offset?: number;
}): Promise<{ items: BoutiqueStockItem[]; total: number }> {
  const { search, filter = "all", limit = 50, offset = 0 } = opts;

  await ensureBoutiqueStockPopulated();
  const cols = await getProduitColsAdmin();
  const imageCol  = cols.image_url ? "p.image_url" : cols.image ? "p.image" : "NULL";
  const remiseCol = cols.remise ? "COALESCE(CAST(p.remise AS DECIMAL(10,2)), 0)" : "0";

  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];

  if (search) {
    conditions.push("(p.nom LIKE ? OR p.reference LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filter === "faible")     conditions.push("bs.quantite > 0 AND bs.quantite <= bs.seuil_alerte");
  if (filter === "epuise")     conditions.push("bs.quantite = 0");
  if (filter === "disponible") conditions.push("bs.quantite > 0");

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
  try {
    await db.execute(
      `UPDATE produits p JOIN boutique_stock bs ON bs.produit_id = p.id SET p.stock_boutique = bs.quantite WHERE p.id = ?`,
      [data.produit_id]
    );
  } catch { /* stock_boutique column may not exist */ }
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
  id:                number;
  reference:         string;
  client_nom:        string;
  client_tel:        string | null;
  client_email:      string | null;
  items:             string;
  sous_total:        number;
  remise:            number;
  total:             number;
  avec_livraison:    number;          // 0 | 1
  adresse_livraison: string | null;
  contact_livraison: string | null;
  lien_localisation: string | null;
  mode_paiement:     string | null;
  statut_paiement:   string | null;
  montant_acompte:   number | null;
  statut:            "brouillon" | "valide" | "paye" | "annule";
  note:              string | null;
  admin_id:          number | null;
  vendeur:           string | null;
  created_at:        string;
  updated_at:        string;
}

export async function listFactures(opts: { limit?: number; offset?: number; search?: string; statut?: string } = {}): Promise<{ items: Facture[]; total: number }> {
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];
  if (search) { conditions.push("(client_nom LIKE ? OR reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT f.*, COALESCE(u.nom, 'N/A') AS vendeur
     FROM factures f
     LEFT JOIN admin_users u ON u.id = f.admin_id
     ${where} ORDER BY f.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM factures f ${where}`, params);
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
  // Sync to boutique_clients if client has a name and phone
  if (data.client_nom?.trim() && data.client_tel?.trim()) {
    await db.execute(
      `INSERT INTO boutique_clients (nom, telephone, email, type_client)
       SELECT ?, ?, ?, 'particulier' FROM DUAL
       WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ?)`,
      [data.client_nom.trim(), data.client_tel.trim(), data.client_email ?? null, data.client_tel.trim()]
    ).catch(() => {});
  }
  return result.insertId;
}

export async function createVenteWithStock(data: {
  client_nom:         string;
  client_tel?:        string;
  avec_livraison?:    boolean;
  adresse_livraison?: string;
  contact_livraison?: string;
  lien_localisation?: string;
  mode_paiement?:     string;
  statut_paiement?:   string;
  montant_acompte?:   number;
  sous_total:         number;
  remise?:            number;
  total:              number;
  note?:              string;
  admin_id?:          number;
  items: Array<{ produit_id: number; nom: string; reference: string; qty: number; prix: number; total: number }>;
}): Promise<number> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify boutique stock for each item
    for (const item of data.items) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        "SELECT quantite FROM boutique_stock WHERE produit_id = ? LIMIT 1", [item.produit_id]
      );
      const dispo = Number(rows[0]?.quantite ?? 0);
      if (dispo < item.qty) {
        throw new Error(`Stock insuffisant pour "${item.nom}" (dispo: ${dispo}, demandé: ${item.qty})`);
      }
    }

    // 2. Insert facture
    const reference = generateVenteRef("VT");
    data.client_nom = data.client_nom.trim().toUpperCase();
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO factures
         (reference, client_nom, client_tel, items,
          sous_total, remise, total,
          avec_livraison, adresse_livraison, contact_livraison, lien_localisation,
          mode_paiement, statut_paiement, montant_acompte,
          statut, note, admin_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        reference, data.client_nom, data.client_tel ?? null,
        JSON.stringify(data.items),
        data.sous_total, data.remise ?? 0, data.total,
        data.avec_livraison ? 1 : 0,
        data.adresse_livraison ?? null, data.contact_livraison ?? null, data.lien_localisation ?? null,
        data.mode_paiement ?? null, data.statut_paiement ?? null, data.montant_acompte ?? null,
        "valide", data.note ?? null, data.admin_id ?? null,
      ]
    );
    const factureId = result.insertId;

    // 3. Decrement boutique_stock + log mouvements
    for (const item of data.items) {
      await conn.execute(
        "UPDATE boutique_stock SET quantite = GREATEST(0, quantite - ?), updated_at = NOW() WHERE produit_id = ?",
        [item.qty, item.produit_id]
      );
      await conn.execute(
        `INSERT INTO boutique_mouvements (produit_id, type, quantite, motif, ref_commande, admin_id)
         VALUES (?,?,?,?,?,?)`,
        [item.produit_id, "sortie", item.qty, "Vente", reference, data.admin_id ?? null]
      );
      // Sync produits.stock_boutique (ignore if column missing)
      try { await conn.execute(
        `UPDATE produits p
         JOIN boutique_stock bs ON bs.produit_id = p.id
         SET p.stock_boutique = bs.quantite
         WHERE p.id = ?`,
        [item.produit_id]
      ); } catch { /* stock_boutique column may not exist */ }
    }

    // 4. If delivery, create livraison entry
    if (data.avec_livraison) {
      const livRef = generateVenteRef("LV");
      await conn.execute(
        `INSERT INTO livraisons_ventes
           (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          livRef, factureId, data.client_nom, data.client_tel ?? null,
          data.adresse_livraison ?? null, data.contact_livraison ?? null,
          data.lien_localisation ?? null, "en_attente",
        ]
      );
    }

    await conn.commit();

    // Sync client to boutique_clients after successful sale
    if (data.client_nom?.trim() && data.client_tel?.trim()) {
      await db.execute(
        `INSERT INTO boutique_clients (nom, telephone, type_client)
         SELECT ?, ?, 'particulier' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM boutique_clients WHERE telephone = ?)`,
        [data.client_nom.trim(), data.client_tel.trim(), data.client_tel.trim()]
      ).catch(() => {});
    }

    // Auto-create finance entry for paid/partial sales
    if (data.statut_paiement && data.statut_paiement !== "non_paye") {
      const montantFinance = data.statut_paiement === "acompte"
        ? (data.montant_acompte ?? 0)
        : data.total;
      if (montantFinance > 0) {
        await createFinanceEntry({
          type:          "vente",
          mode_paiement: data.mode_paiement ?? "especes",
          categorie:     "Vente boutique",
          description:   `Vente ${reference} – ${data.client_nom.trim()}`,
          montant:       montantFinance,
          date_entree:   new Date().toISOString().slice(0, 10),
        }).catch(() => {});
      }
    }

    return factureId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateFactureStatut(id: number, statut: Facture["statut"]) {
  await db.execute("UPDATE factures SET statut = ? WHERE id = ?", [statut, id]);
}

export async function updateFacture(id: number, data: {
  statut?:          Facture["statut"];
  statut_paiement?: string;
  mode_paiement?:   string;
}) {
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (data.statut !== undefined)           { sets.push("statut = ?");           params.push(data.statut); }
  if (data.statut_paiement !== undefined)  { sets.push("statut_paiement = ?");  params.push(data.statut_paiement); }
  if (data.mode_paiement !== undefined)    { sets.push("mode_paiement = ?");    params.push(data.mode_paiement); }
  if (sets.length === 0) return;
  params.push(id);
  await db.execute(`UPDATE factures SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteFacture(id: number) {
  const [[row]] = await db.execute<mysql.RowDataPacket[]>("SELECT reference FROM factures WHERE id = ?", [id]);
  const ref = (row as mysql.RowDataPacket)?.reference as string | undefined;
  await db.execute("DELETE FROM factures WHERE id = ?", [id]);
  if (ref) {
    await db.execute(
      "DELETE FROM finance_entries WHERE type = 'vente' AND description LIKE ?",
      [`Vente ${ref}%`]
    ).catch(() => {});
  }
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
  const params: (string | number | boolean | null | Buffer)[] = [];
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

/* ─── Paiements échelonnés ─── */

export interface PaymentPlan {
  id:              number;
  order_id:        number;
  nb_tranches:     number;
  montant_total:   number;
  montant_tranche: number;
  statut:          "en_cours" | "solde" | "annule";
  created_at:      string;
  reference?:      string;
  nom?:            string;
}

export interface PaymentTranche {
  id:            number;
  plan_id:       number;
  numero:        number;
  montant:       number;
  date_echeance: string;
  date_paiement: string | null;
  statut:        "en_attente" | "payee" | "en_retard";
  note:          string | null;
}

export async function createPaymentPlan(data: {
  order_id:      number;
  nb_tranches:   number;
  montant_total: number;
}): Promise<number> {
  const mt = Math.round((data.montant_total / data.nb_tranches) * 100) / 100;
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO payment_plans (order_id, nb_tranches, montant_total, montant_tranche) VALUES (?,?,?,?)`,
    [data.order_id, data.nb_tranches, data.montant_total, mt]
  );
  const planId = result.insertId;
  for (let i = 1; i <= data.nb_tranches; i++) {
    const d = new Date();
    d.setDate(d.getDate() + (i - 1) * 7);
    await db.execute(
      `INSERT INTO payment_tranches (plan_id, numero, montant, date_echeance) VALUES (?,?,?,?)`,
      [planId, i, mt, d.toISOString().split("T")[0]]
    );
  }
  return planId;
}

export async function listPaymentPlans(): Promise<PaymentPlan[]> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT pp.*, o.reference, o.nom
     FROM payment_plans pp JOIN orders o ON o.id = pp.order_id
     ORDER BY pp.created_at DESC`
  );
  return rows as PaymentPlan[];
}

export async function getPaymentPlanByOrderId(
  orderId: number
): Promise<(PaymentPlan & { tranches: PaymentTranche[] }) | null> {
  const [planRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT pp.*, o.reference, o.nom FROM payment_plans pp
     JOIN orders o ON o.id = pp.order_id WHERE pp.order_id = ? LIMIT 1`,
    [orderId]
  );
  if (!planRows.length) return null;
  const plan = planRows[0] as PaymentPlan;
  const [tranches] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM payment_tranches WHERE plan_id = ? ORDER BY numero`, [plan.id]
  );
  return { ...plan, tranches: tranches as PaymentTranche[] };
}

export async function markTranchePaid(trancheId: number, note?: string, mode_paiement?: string): Promise<void> {
  await db.execute(
    `UPDATE payment_tranches SET statut='payee', date_paiement=NOW(), note=?, mode_paiement=? WHERE id=?`,
    [note ?? null, mode_paiement ?? null, trancheId]
  );
  const [tRow] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`, [trancheId]
  );
  const planId = tRow[0]?.plan_id;
  if (!planId) return;
  const [rem] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM payment_tranches WHERE plan_id=? AND statut!='payee'`, [planId]
  );
  if (Number(rem[0]?.cnt) === 0) {
    await db.execute(`UPDATE payment_plans SET statut='solde' WHERE id=?`, [planId]);
    const [pRow] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`, [planId]
    );
    if (pRow[0]?.order_id) {
      // Use 'confirmed' (valid ENUM value)
      await db.execute(`UPDATE orders SET status='confirmed' WHERE id=?`, [pRow[0].order_id]);
      await addOrderEvent(pRow[0].order_id as number, "confirmed", "Paiement échelonné soldé — commande confirmée");
    }
  }
}

export async function markTrancheUnpaid(trancheId: number): Promise<void> {
  await db.execute(
    `UPDATE payment_tranches SET statut='en_attente', date_paiement=NULL, note=NULL WHERE id=?`,
    [trancheId]
  );
  const [tRow] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT plan_id FROM payment_tranches WHERE id=? LIMIT 1`, [trancheId]
  );
  if (tRow[0]?.plan_id) {
    await db.execute(
      `UPDATE payment_plans SET statut='en_cours' WHERE id=? AND statut='solde'`,
      [tRow[0].plan_id]
    );
  }
}

export async function cancelPaymentPlan(planId: number): Promise<void> {
  await db.execute(`UPDATE payment_plans SET statut='annule' WHERE id=?`, [planId]);
  const [pRow] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT order_id FROM payment_plans WHERE id=? LIMIT 1`, [planId]
  );
  if (pRow[0]?.order_id) {
    await db.execute(`UPDATE orders SET status='annulée' WHERE id=?`, [pRow[0].order_id]);
  }
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
  const params: (string | number | boolean | null | Buffer)[] = [];
  if (search) { conditions.push("(client_nom LIKE ? OR reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM livraisons_ventes ${where} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM livraisons_ventes ${where}`, params);
  return { items: rows as Livraison[], total: Number(cnt[0]?.cnt ?? 0) };
}

export async function updateLivraisonStatut(id: number, statut: Livraison["statut"]) {
  await db.execute("UPDATE livraisons_ventes SET statut = ? WHERE id = ?", [statut, id]);
}

export async function deleteLivraison(id: number) {
  await db.execute("DELETE FROM livraisons_ventes WHERE id = ?", [id]);
}

// ─── Finance ───────────────────────────────────────────────────────────────────

export interface FinanceEntry {
  id:             number;
  reference:      string;
  type:           "caisse" | "depense" | "rentree" | "vente";
  mode_paiement:  "especes" | "moov_money" | "tmoney" | "virement_bancaire" | null;
  categorie:      string | null;
  description:    string | null;
  montant:        number;
  date_entree:    string;
  created_at:     string;
  updated_at:     string;
}

export interface FinanceStats {
  total_recettes:   number;
  total_depenses:   number;
  solde_net:        number;
  especes:          number;
  moov_money:       number;
  tmoney:           number;
  virement_bancaire: number;
}

export async function listFinanceEntries(opts: {
  type?:   string;
  search?: string;
  limit?:  number;
  offset?: number;
} = {}): Promise<{ items: FinanceEntry[]; total: number }> {
  const { limit = 50, offset = 0, type, search } = opts;
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];
  if (type)   { conditions.push("type = ?");                                         params.push(type); }
  if (search) { conditions.push("(categorie LIKE ? OR reference LIKE ?)");           params.push(`%${search}%`, `%${search}%`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM finance_entries ${where} ORDER BY date_entree DESC, id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM finance_entries ${where}`, params);
  const items = (rows as mysql.RowDataPacket[]).map(r => ({ ...r, montant: Number(r.montant) }));
  return { items: items as FinanceEntry[], total: Number(cnt[0]?.cnt ?? 0) };
}

// Cached column check for finance_entries
let _finCols: { mode_paiement: boolean } | null = null;
async function financeEntrieCols() {
  if (_finCols) return _finCols;
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_entries'`
  );
  const names  = new Set(rows.map(r => (r.COLUMN_NAME as string).toLowerCase()));
  _finCols = { mode_paiement: names.has("mode_paiement") };
  return _finCols;
}

export async function getFinanceStats(): Promise<FinanceStats> {
  const cols = await financeEntrieCols();

  const [[totals], modes] = await Promise.all([
    db.query<mysql.RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN type IN ('caisse','rentree') THEN montant ELSE 0 END) AS recettes,
         SUM(CASE WHEN type = 'depense'             THEN montant ELSE 0 END) AS depenses
       FROM finance_entries`
    ),
    cols.mode_paiement
      ? db.query<mysql.RowDataPacket[]>(
          `SELECT mode_paiement, SUM(montant) AS total
           FROM finance_entries
           WHERE type IN ('caisse','rentree')
           GROUP BY mode_paiement`
        ).then(([rows]) => rows as mysql.RowDataPacket[])
      : Promise.resolve([] as mysql.RowDataPacket[]),
  ]);

  const modeMap: Record<string, number> = {};
  (modes as mysql.RowDataPacket[]).forEach(r => {
    if (r.mode_paiement) modeMap[r.mode_paiement as string] = Number(r.total ?? 0);
  });

  const r        = (totals as mysql.RowDataPacket[])[0];
  const recettes = Number(r?.recettes ?? 0);
  const depenses = Number(r?.depenses ?? 0);

  return {
    total_recettes:    recettes,
    total_depenses:    depenses,
    solde_net:         recettes - depenses,
    especes:           modeMap["especes"]           ?? 0,
    moov_money:        modeMap["moov_money"]        ?? 0,
    tmoney:            modeMap["tmoney"]             ?? 0,
    virement_bancaire: modeMap["virement_bancaire"] ?? 0,
  };
}

function genFinanceRef(type: string) {
  const prefix = type === "depense" ? "DEP" : type === "caisse" ? "CAI" : "ENT";
  return `${prefix}-${Date.now()}`;
}

export async function createFinanceEntry(data: {
  type:           FinanceEntry["type"];
  mode_paiement?: string;
  categorie?:     string;
  description?:   string;
  montant:        number;
  date_entree:    string;
}): Promise<number> {
  const cols      = await financeEntrieCols();
  const reference = genFinanceRef(data.type);

  if (cols.mode_paiement) {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `INSERT INTO finance_entries (reference, type, mode_paiement, categorie, description, montant, date_entree)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reference, data.type, data.mode_paiement ?? "especes", data.categorie ?? null, data.description ?? null, data.montant, data.date_entree]
    );
    return result.insertId;
  }

  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO finance_entries (reference, type, categorie, description, montant, date_entree)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [reference, data.type, data.categorie ?? null, data.description ?? null, data.montant, data.date_entree]
  );
  return result.insertId;
}

export async function updateFinanceEntry(id: number, data: {
  mode_paiement?: string;
  categorie?:     string;
  description?:   string;
  montant?:       number;
  date_entree?:   string;
}) {
  const cols   = await financeEntrieCols();
  const fields: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];
  if (cols.mode_paiement && data.mode_paiement !== undefined) { fields.push("mode_paiement = ?"); params.push(data.mode_paiement); }
  if (data.categorie     !== undefined) { fields.push("categorie = ?");     params.push(data.categorie); }
  if (data.description   !== undefined) { fields.push("description = ?");   params.push(data.description); }
  if (data.montant       !== undefined) { fields.push("montant = ?");       params.push(data.montant); }
  if (data.date_entree   !== undefined) { fields.push("date_entree = ?");   params.push(data.date_entree); }
  if (!fields.length) return;
  params.push(id);
  await db.execute(`UPDATE finance_entries SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function deleteFinanceEntry(id: number) {
  await db.execute("DELETE FROM finance_entries WHERE id = ?", [id]);
}

export async function getVentesStats(): Promise<{
  factures: number; livraisons: number;
  ca_total: number; factures_payees: number;
}> {
  const [[f], [l], [ca], [fp]] = await Promise.all([
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM factures"),
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM livraisons_ventes"),
    db.execute<mysql.RowDataPacket[]>(`
      SELECT COALESCE(SUM(
        CASE
          WHEN statut_paiement = 'paye'    THEN total
          WHEN statut_paiement = 'acompte' THEN COALESCE(montant_acompte, 0)
          ELSE 0
        END
      ), 0) AS total FROM factures WHERE statut != 'annule'`),
    db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM factures WHERE statut = 'paye'"),
  ]);
  return {
    factures:       Number((f  as mysql.RowDataPacket[])[0]?.cnt   ?? 0),
    livraisons:     Number((l  as mysql.RowDataPacket[])[0]?.cnt   ?? 0),
    ca_total:       Number((ca as mysql.RowDataPacket[])[0]?.total ?? 0),
    factures_payees:Number((fp as mysql.RowDataPacket[])[0]?.cnt   ?? 0),
  };
}

export async function getLivraisonsStats(): Promise<{
  total: number; en_attente: number; en_cours: number; livre: number;
}> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut IN ('acceptee','en_cours')) AS en_cours,
       SUM(statut = 'livre') AS livre
     FROM livraisons_ventes`
  );
  const r = (rows as mysql.RowDataPacket[])[0] ?? {};
  return {
    total:      Number(r.total      ?? 0),
    en_attente: Number(r.en_attente ?? 0),
    en_cours:   Number(r.en_cours   ?? 0),
    livre:      Number(r.livre      ?? 0),
  };
}

// ─── Fournisseurs ─────────────────────────────────────────────────────────────

export interface Fournisseur {
  id:         number;
  nom:        string;
  contact:    string | null;
  telephone:  string | null;
  email:      string | null;
  adresse:    string | null;
  note:       string | null;
  created_at: string;
}

export async function listFournisseurs(): Promise<Fournisseur[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    "SELECT * FROM fournisseurs ORDER BY nom"
  );
  return rows as Fournisseur[];
}

export async function createFournisseur(data: Omit<Fournisseur, "id" | "created_at">): Promise<number> {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, note) VALUES (?,?,?,?,?,?)`,
    [data.nom, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null]
  );
  return result.insertId;
}

export async function updateFournisseur(id: number, data: Partial<Omit<Fournisseur, "id" | "created_at">>) {
  await db.execute(
    `UPDATE fournisseurs SET nom=?, contact=?, telephone=?, email=?, adresse=?, note=? WHERE id=?`,
    [data.nom ?? null, data.contact ?? null, data.telephone ?? null, data.email ?? null, data.adresse ?? null, data.note ?? null, id]
  );
}

export async function deleteFournisseur(id: number) {
  await db.execute("DELETE FROM fournisseurs WHERE id = ?", [id]);
}

// ─── Achats ───────────────────────────────────────────────────────────────────

export interface Achat {
  id:             number;
  fournisseur_id: number | null;
  fournisseur_nom?: string;
  nom_fournisseur?: string;
  reference:      string;
  date_achat:     string;
  statut:         "en_attente" | "recu" | "valide";
  montant_total:  number;
  notes:          string | null;
  transport?:     "avion" | "bateau" | null;
}

export interface AchatItem {
  id:            number;
  achat_id:      number;
  produit_id:    number | null;
  produit_nom?:  string;
  designation:   string;
  quantite:      number;
  prix_unitaire: number;
}

export async function listAchats(limit = 50, offset = 0): Promise<Achat[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT a.*, f.nom AS fournisseur_nom
     FROM achats a
     LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id
     ORDER BY a.date_achat DESC, a.id DESC
     LIMIT ${limit} OFFSET ${offset}`
  );
  return rows as Achat[];
}

export async function countAchats(): Promise<number> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) as cnt FROM achats");
  return Number(rows[0]?.cnt ?? 0);
}

export async function getAchatStats(): Promise<{ total: number; en_attente: number; recu: number; montant_total: number }> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(statut = 'en_attente') AS en_attente,
       SUM(statut = 'recu') AS recu,
       COALESCE(SUM(montant_total), 0) AS montant_total
     FROM achats`
  );
  const r = rows[0] as mysql.RowDataPacket;
  return {
    total:        Number(r.total ?? 0),
    en_attente:   Number(r.en_attente ?? 0),
    recu:         Number(r.recu ?? 0),
    montant_total: Number(r.montant_total ?? 0),
  };
}

export async function getAchatById(id: number): Promise<{ achat: Achat; items: AchatItem[] } | null> {
  const [aRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT a.*, f.nom AS fournisseur_nom FROM achats a LEFT JOIN fournisseurs f ON f.id = a.fournisseur_id WHERE a.id = ?`, [id]
  );
  if (!aRows[0]) return null;
  const [iRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT ai.*, p.nom AS produit_nom FROM achat_items ai LEFT JOIN produits p ON p.id = ai.produit_id WHERE ai.achat_id = ?`, [id]
  );
  return { achat: aRows[0] as Achat, items: iRows as AchatItem[] };
}

export async function createAchat(data: {
  fournisseur_id: number | null;
  reference?:     string;
  date_achat:     string;
  statut:         string;
  note:           string | null;
  transport?:     string | null;
  items: Array<{ produit_id: number | null; designation: string; quantite: number; prix_unitaire: number }>;
}): Promise<number> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Auto-generate reference if not provided
    let reference = data.reference?.trim();
    if (!reference) {
      const year = new Date().getFullYear();
      const [cntRows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM achats WHERE YEAR(date_achat) = ?`, [year]
      );
      const num = (Number((cntRows[0] as mysql.RowDataPacket).cnt) + 1).toString().padStart(3, "0");
      reference = `ACH-${year}-${num}`;
    }
    const montant_total = data.items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
    // Ensure transport column exists (try/catch on ER_DUP_FIELDNAME like images_json)
    let hasTransport = false;
    try {
      await conn.execute(`ALTER TABLE achats ADD COLUMN transport VARCHAR(10) NULL`);
      hasTransport = true;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "ER_DUP_FIELDNAME" || (err?.message ?? "").includes("Duplicate column")) {
        hasTransport = true;
      }
    }
    const achatCols  = ["fournisseur_id","reference","date_achat","statut","montant_total","notes"];
    const achatVals: (string | number | null)[] = [
      data.fournisseur_id ?? null, reference, data.date_achat, data.statut, montant_total, data.note ?? null,
    ];
    if (hasTransport) { achatCols.push("transport"); achatVals.push(data.transport ?? null); }
    const [res] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO achats (${achatCols.join(",")}) VALUES (${achatCols.map(() => "?").join(",")})`,
      achatVals
    );
    const achatId = res.insertId;
    for (const item of data.items) {
      await conn.execute(
        `INSERT INTO achat_items (achat_id, produit_id, designation, quantite, prix_unitaire) VALUES (?,?,?,?,?)`,
        [achatId, item.produit_id ?? null, item.designation, item.quantite, item.prix_unitaire]
      );
    }
    await conn.commit();
    return achatId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateAchatStatut(id: number, statut: string) {
  await db.execute("UPDATE achats SET statut = ? WHERE id = ?", [statut, id]);
}

export async function deleteAchat(id: number) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute("DELETE FROM achat_items WHERE achat_id = ?", [id]);
    await conn.execute("DELETE FROM achats WHERE id = ?", [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Livreurs ──────────────────────────────────────────────────────────────────

export interface Livreur {
  id:             number;
  nom:            string;
  telephone:      string | null;
  numero_plaque:  string | null;
  code_acces:     string;
  statut:         "disponible" | "indisponible";
  created_at:     string;
}

async function ensureLivreurCols(): Promise<void> {
  try {
    await db.execute(
      "ALTER TABLE livreurs ADD COLUMN numero_plaque VARCHAR(30) NULL AFTER telephone"
    );
  } catch { /* column already exists */ }
}

export async function listLivreurs(): Promise<Livreur[]> {
  await ensureLivreurCols();
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    "SELECT * FROM livreurs ORDER BY nom ASC"
  );
  return rows as Livreur[];
}

export async function getLivreurByCode(code: string): Promise<Livreur | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM livreurs WHERE code_acces = ? LIMIT 1", [code]
  );
  return (rows[0] as Livreur) ?? null;
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createLivreur(data: { nom: string; telephone?: string; numero_plaque?: string }): Promise<Livreur> {
  let code = generateCode();
  // Ensure uniqueness
  let [existing] = await db.execute<mysql.RowDataPacket[]>("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
  while ((existing as mysql.RowDataPacket[]).length > 0) {
    code = generateCode();
    [existing] = await db.execute<mysql.RowDataPacket[]>("SELECT id FROM livreurs WHERE code_acces = ?", [code]);
  }
  const [result] = await db.execute<mysql.ResultSetHeader>(
    "INSERT INTO livreurs (nom, telephone, numero_plaque, code_acces) VALUES (?,?,?,?)",
    [data.nom, data.telephone ?? null, data.numero_plaque ?? null, code]
  );
  const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT * FROM livreurs WHERE id = ?", [result.insertId]);
  return rows[0] as Livreur;
}

export async function updateLivreur(id: number, data: { nom?: string; telephone?: string; numero_plaque?: string; statut?: Livreur["statut"] }) {
  const fields: string[] = [];
  const values: (string | number | boolean | null | Buffer)[] = [];
  if (data.nom           !== undefined) { fields.push("nom = ?");           values.push(data.nom); }
  if (data.telephone     !== undefined) { fields.push("telephone = ?");     values.push(data.telephone); }
  if (data.numero_plaque !== undefined) { fields.push("numero_plaque = ?"); values.push(data.numero_plaque); }
  if (data.statut        !== undefined) { fields.push("statut = ?");        values.push(data.statut); }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE livreurs SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteLivreur(id: number) {
  await db.execute("DELETE FROM livreurs WHERE id = ?", [id]);
}

// ─── Livraisons (enrichi) ──────────────────────────────────────────────────────

export interface LivraisonAdmin {
  id:                number;
  reference:         string;
  facture_id:        number | null;
  client_nom:        string;
  client_tel:        string | null;
  adresse:           string | null;
  contact_livraison: string | null;
  lien_localisation: string | null;
  livreur_id:        number | null;
  livreur:           string | null;
  montant_livraison: number | null;
  statut:            "en_attente" | "acceptee" | "en_cours" | "livre" | "echoue";
  note:              string | null;
  livree_le:         string | null;
  created_at:        string;
}

async function ensureLivraisonCols(): Promise<void> {
  try {
    await db.execute(
      "ALTER TABLE livraisons_ventes ADD COLUMN montant_livraison DECIMAL(10,2) NULL AFTER lien_localisation"
    );
  } catch { /* column already exists */ }
}

export async function listLivraisonsAdmin(opts: {
  limit?: number; offset?: number; search?: string; statut?: string;
} = {}): Promise<{ items: LivraisonAdmin[]; total: number }> {
  await ensureLivraisonCols();
  const { limit = 50, offset = 0, search, statut } = opts;
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];
  if (search) { conditions.push("(lv.client_nom LIKE ? OR lv.reference LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (statut) { conditions.push("lv.statut = ?"); params.push(statut); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT lv.*, li.nom AS livreur_nom
     FROM livraisons_ventes lv
     LEFT JOIN livreurs li ON li.id = lv.livreur_id
     ${where}
     ORDER BY lv.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );
  const [cnt] = await db.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM livraisons_ventes lv ${where}`, params
  );
  return {
    items: (rows as mysql.RowDataPacket[]).map(r => ({ ...r, livreur: r.livreur_nom ?? r.livreur })) as LivraisonAdmin[],
    total: Number(cnt[0]?.cnt ?? 0),
  };
}

export async function updateLivraisonAdmin(id: number, data: {
  statut?: LivraisonAdmin["statut"];
  livreur_id?: number | null;
  note?: string;
}) {
  const fields: string[] = [];
  const values: (string | number | boolean | null | Buffer)[] = [];
  if (data.statut     !== undefined) { fields.push("statut = ?");     values.push(data.statut); }
  if (data.livreur_id !== undefined) { fields.push("livreur_id = ?"); values.push(data.livreur_id); }
  if (data.note       !== undefined) { fields.push("note = ?");       values.push(data.note); }
  if (data.statut === "livre") { fields.push("livree_le = NOW()"); }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE livraisons_ventes SET ${fields.join(", ")} WHERE id = ?`, values);
}

// Called by driver: accept a delivery (atomic — only if still en_attente)
export async function accepterLivraison(livraisonId: number, livreurId: number, montantLivraison?: number): Promise<boolean> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      "SELECT id, statut FROM livraisons_ventes WHERE id = ? FOR UPDATE", [livraisonId]
    );
    const liv = rows[0] as mysql.RowDataPacket | undefined;
    if (!liv || liv.statut !== "en_attente") {
      await conn.rollback();
      return false;
    }
    const [livreurRow] = await conn.execute<mysql.RowDataPacket[]>(
      "SELECT nom FROM livreurs WHERE id = ?", [livreurId]
    );
    const nomLivreur = (livreurRow[0] as mysql.RowDataPacket)?.nom ?? null;
    await conn.execute(
      "UPDATE livraisons_ventes SET statut = 'acceptee', livreur_id = ?, livreur = ?, montant_livraison = ? WHERE id = ?",
      [livreurId, nomLivreur, montantLivraison ?? null, livraisonId]
    );
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function createManualLivraison(data: {
  client_nom:         string;
  client_tel?:        string;
  adresse?:           string;
  contact_livraison?: string;
  lien_localisation?: string;
  note?:              string;
}): Promise<number> {
  const reference = generateVenteRef("LV");
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO livraisons_ventes
       (reference, facture_id, client_nom, client_tel, adresse, contact_livraison, lien_localisation, statut, note)
     VALUES (?, NULL, ?, ?, ?, ?, ?, 'en_attente', ?)`,
    [
      reference,
      data.client_nom,
      data.client_tel   ?? null,
      data.adresse      ?? null,
      data.contact_livraison ?? null,
      data.lien_localisation ?? null,
      data.note         ?? null,
    ]
  );
  return result.insertId;
}

// For driver page: get deliveries available (en_attente) + their own accepted ones
export async function getLivraisonsForLivreur(livreurId: number): Promise<LivraisonAdmin[]> {
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT lv.*, li.nom AS livreur_nom
     FROM livraisons_ventes lv
     LEFT JOIN livreurs li ON li.id = lv.livreur_id
     WHERE lv.statut = 'en_attente'
        OR (lv.livreur_id = ? AND lv.statut NOT IN ('livre','echoue'))
     ORDER BY lv.created_at DESC`,
    [livreurId]
  );
  return (rows as mysql.RowDataPacket[]).map(r => ({ ...r, livreur: r.livreur_nom ?? r.livreur })) as LivraisonAdmin[];
}

// ─── Boutique Clients ─────────────────────────────────────────────────────────

export interface BoutiqueClient {
  id:           number;
  nom:          string;
  telephone:    string | null;
  email:        string | null;
  localisation: string | null;
  type_client:  "particulier" | "professionnel";
  solde:        number;
  notes:        string | null;
  created_at:   string;
  updated_at:   string;
}

export interface BoutiqueClientStats {
  total:          number;
  en_avance:      number;   // solde > 0
  debiteurs:      number;   // solde < 0
  solde_moyen:    number;
  segments:       { type_client: string; count: number }[];
  acquisitions:   { mois: string; count: number }[];  // last 6 months
  top_debiteurs:  BoutiqueClient[];
  top_depensiers: { id: number; nom: number; telephone: string | null; type_client: string; total_achats: number }[];
  derniers:       BoutiqueClient[];
}

async function ensureBoutiqueClientsTable(): Promise<void> {
  await db.execute(`
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
  const [[cnt]] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM boutique_clients"
  );
  if (Number((cnt as mysql.RowDataPacket).n ?? 0) === 0) {
    await db.execute(`
      INSERT INTO boutique_clients (nom, telephone, email, type_client)
      SELECT nom, telephone, email, 'particulier'
      FROM clients
      WHERE telephone IS NOT NULL AND telephone != ''
    `).catch(() => {});
  }
}

export async function listBoutiqueClients(
  limit: number,
  offset: number,
  search: string,
  filtre: "tous" | "debiteurs" | "dettes"
): Promise<BoutiqueClient[]> {
  await ensureBoutiqueClientsTable();
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];

  if (search) {
    conditions.push("(nom LIKE ? OR telephone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filtre === "debiteurs") {
    conditions.push("solde < 0");
  } else if (filtre === "dettes") {
    conditions.push("solde > 0");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT * FROM boutique_clients ${where} ORDER BY nom ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows as BoutiqueClient[];
}

export async function countBoutiqueClients(
  search: string,
  filtre: "tous" | "debiteurs" | "dettes"
): Promise<number> {
  const conditions: string[] = [];
  const params: (string | number | boolean | null | Buffer)[] = [];

  if (search) {
    conditions.push("(nom LIKE ? OR telephone LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (filtre === "debiteurs") {
    conditions.push("solde < 0");
  } else if (filtre === "dettes") {
    conditions.push("solde > 0");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM boutique_clients ${where}`,
    params
  );
  return (rows[0] as mysql.RowDataPacket).cnt as number;
}

export async function getBoutiqueClientById(id: number): Promise<BoutiqueClient | null> {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM boutique_clients WHERE id = ?", [id]
  );
  return (rows[0] as BoutiqueClient) ?? null;
}

export async function createBoutiqueClient(data: Partial<BoutiqueClient>): Promise<number> {
  const [result] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO boutique_clients (nom, telephone, email, localisation, type_client, solde, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nom ?? "",
      data.telephone ?? null,
      data.email ?? null,
      data.localisation ?? null,
      data.type_client ?? "particulier",
      data.solde ?? 0,
      data.notes ?? null,
    ]
  );
  return result.insertId;
}

export async function updateBoutiqueClient(id: number, data: Partial<BoutiqueClient>): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | boolean | null | Buffer)[] = [];

  if (data.nom          !== undefined) { fields.push("nom = ?");          values.push(data.nom); }
  if (data.telephone    !== undefined) { fields.push("telephone = ?");    values.push(data.telephone); }
  if (data.email        !== undefined) { fields.push("email = ?");        values.push(data.email); }
  if (data.localisation !== undefined) { fields.push("localisation = ?"); values.push(data.localisation); }
  if (data.type_client  !== undefined) { fields.push("type_client = ?");  values.push(data.type_client); }
  if (data.solde        !== undefined) { fields.push("solde = ?");        values.push(data.solde); }
  if (data.notes        !== undefined) { fields.push("notes = ?");        values.push(data.notes); }

  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE boutique_clients SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteBoutiqueClient(id: number): Promise<void> {
  await db.execute("DELETE FROM boutique_clients WHERE id = ?", [id]);
}

export async function getBoutiqueClientsStats(): Promise<BoutiqueClientStats> {
  const [[kpis], [segments], [acquisitions], [topDebiteurs], [topDepensiers], [derniers]] =
    await Promise.all([
      // KPIs
      db.query<mysql.RowDataPacket[]>(
        `SELECT
           COUNT(*) AS total,
           SUM(solde > 0) AS en_avance,
           SUM(solde < 0) AS debiteurs,
           ROUND(AVG(solde), 2) AS solde_moyen
         FROM boutique_clients`
      ),
      // Segment distribution
      db.query<mysql.RowDataPacket[]>(
        `SELECT type_client, COUNT(*) AS count
         FROM boutique_clients
         GROUP BY type_client`
      ),
      // New acquisitions last 6 months
      db.query<mysql.RowDataPacket[]>(
        `SELECT DATE_FORMAT(created_at, '%b') AS mois,
                COUNT(*) AS count
         FROM boutique_clients
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY YEAR(created_at), MONTH(created_at), mois
         ORDER BY YEAR(created_at), MONTH(created_at)`
      ),
      // Top debiteurs (solde le plus négatif)
      db.query<mysql.RowDataPacket[]>(
        `SELECT id, nom, telephone, type_client, solde
         FROM boutique_clients
         WHERE solde < 0
         ORDER BY solde ASC
         LIMIT 5`
      ),
      // Top dépensiers (solde le plus positif = en avance = ont payé le plus)
      db.query<mysql.RowDataPacket[]>(
        `SELECT id, nom, telephone, type_client, solde AS total_achats
         FROM boutique_clients
         WHERE solde > 0
         ORDER BY solde DESC
         LIMIT 5`
      ),
      // Derniers clients ajoutés
      db.query<mysql.RowDataPacket[]>(
        `SELECT * FROM boutique_clients ORDER BY created_at DESC LIMIT 8`
      ),
    ]);

  const kpi = kpis[0] as mysql.RowDataPacket;
  return {
    total:          Number(kpi?.total ?? 0),
    en_avance:      Number(kpi?.en_avance ?? 0),
    debiteurs:      Number(kpi?.debiteurs ?? 0),
    solde_moyen:    Number(kpi?.solde_moyen ?? 0),
    segments:       segments as { type_client: string; count: number }[],
    acquisitions:   acquisitions as { mois: string; count: number }[],
    top_debiteurs:  topDebiteurs as BoutiqueClient[],
    top_depensiers: topDepensiers as { id: number; nom: number; telephone: string | null; type_client: string; total_achats: number }[],
    derniers:       derniers as BoutiqueClient[],
  };
}

// ─── VITRINE — Fidélité, Parrainage, Newsletter, Comptes clients ──────────────

export async function listLoyaltyClients() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
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
  return rows as {
    telephone: string; nom: string | null;
    total_points: number; last_date: string; nb_transactions: number;
  }[];
}

export async function getLoyaltyHistory(telephone: string) {
  const digits = telephone.replace(/\D/g, "").slice(-8);
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM loyalty_points
     WHERE RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', ''), 8) = ?
     ORDER BY created_at DESC LIMIT 50`,
    [digits]
  );
  return rows as { id: number; telephone: string; points: number; reason: string; created_at: string }[];
}

export async function addLoyaltyPointsManual(telephone: string, points: number, reason: string) {
  await db.execute(
    `INSERT INTO loyalty_points (telephone, points, reason, created_at) VALUES (?, ?, ?, NOW())`,
    [telephone, points, reason]
  );
}

export async function listReferrals() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM referrals ORDER BY uses_count DESC, created_at DESC`
  );
  return rows as {
    id: number; nom: string; telephone: string; code: string;
    uses_count: number; created_at: string;
  }[];
}

export async function listNewsletterSubscribers() {
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC`
  );
  return rows as { id: number; email: string; subscribed_at: string }[];
}

export async function deleteNewsletterSubscriber(id: number) {
  await db.execute(`DELETE FROM newsletter_subscribers WHERE id = ?`, [id]);
}

export async function listSiteClients() {
  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT id, nom, email, telephone,
             google_id IS NOT NULL AS via_google,
             password IS NOT NULL  AS via_password,
             statut, created_at
      FROM clients
      WHERE password IS NOT NULL OR google_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    return rows as {
      id: number; nom: string; email: string | null; telephone: string | null;
      via_google: number; via_password: number; statut: string; created_at: string;
    }[];
  } catch {
    return [];
  }
}

export async function getLoyaltyStats() {
  try {
    const [[r]] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(DISTINCT telephone) AS nb_clients,
        SUM(CASE WHEN points > 0 THEN points ELSE 0 END) AS total_distribues,
        ABS(SUM(CASE WHEN points < 0 THEN points ELSE 0 END)) AS total_echanges
      FROM loyalty_points
    `);
    return {
      nb_clients:       Number(r?.nb_clients ?? 0),
      total_distribues: Number(r?.total_distribues ?? 0),
      total_echanges:   Number(r?.total_echanges ?? 0),
    };
  } catch { return { nb_clients: 0, total_distribues: 0, total_echanges: 0 }; }
}

// ─── Marques ─────────────────────────────────────────────────────────────────

export interface AdminMarque {
  id:          number;
  nom:         string;
  description: string;
  nb_produits: number;
}

async function ensureMarquesTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS marques (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      nom         VARCHAR(255) NOT NULL,
      description TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Check column existence before ALTER to support MySQL < 8.0.3
  const [cols] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'produits'
       AND COLUMN_NAME  = 'marque_id'`
  );
  if (Number((cols as mysql.RowDataPacket[])[0]?.cnt ?? 0) === 0) {
    await db.execute(`ALTER TABLE produits ADD COLUMN marque_id INT NULL`).catch(() => {});
  }
}

export async function listAdminMarques(): Promise<AdminMarque[]> {
  await ensureMarquesTable();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(`
    SELECT m.id, m.nom, COALESCE(m.description, '') AS description,
           COUNT(p.id) AS nb_produits
    FROM marques m
    LEFT JOIN produits p ON p.marque_id = m.id
    GROUP BY m.id
    ORDER BY m.nom
  `);
  return (rows as mysql.RowDataPacket[]).map(r => ({
    id:          Number(r.id),
    nom:         String(r.nom),
    description: String(r.description ?? ""),
    nb_produits: Number(r.nb_produits ?? 0),
  }));
}

export async function createMarque(data: { nom: string; description: string }) {
  await ensureMarquesTable();
  const [res] = await db.execute<mysql.ResultSetHeader>(
    `INSERT INTO marques (nom, description) VALUES (?, ?)`,
    [data.nom, data.description || null]
  );
  return res.insertId;
}

export async function updateMarque(id: number, data: { nom: string; description: string }) {
  await db.execute(
    `UPDATE marques SET nom = ?, description = ? WHERE id = ?`,
    [data.nom, data.description || null, id]
  );
}

export async function deleteMarque(id: number) {
  await db.execute(`DELETE FROM marques WHERE id = ?`, [id]);
}
