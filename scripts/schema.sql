-- ============================================================
-- Togolese Shop — Schéma MySQL complet
-- À exécuter une seule fois sur ta base cloud (Railway, etc.)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Catégories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Produits ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produits (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reference      VARCHAR(100) NOT NULL UNIQUE,
  nom            VARCHAR(255) NOT NULL,
  description    TEXT,
  categorie_id   INT,
  prix_unitaire  DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock_boutique INT NOT NULL DEFAULT 0,
  remise         DECIMAL(5,2) NOT NULL DEFAULT 0,
  neuf           TINYINT(1) NOT NULL DEFAULT 1,
  actif          TINYINT(1) NOT NULL DEFAULT 1,
  image_url      VARCHAR(500),
  images_json    JSON,
  variations_json JSON,
  date_creation  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Commandes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reference      VARCHAR(30) NOT NULL UNIQUE,
  nom            VARCHAR(255),
  telephone      VARCHAR(20) NOT NULL,
  adresse        TEXT,
  zone_livraison VARCHAR(100),
  delivery_fee   DECIMAL(15,2) NOT NULL DEFAULT 0,
  note           TEXT,
  items          JSON NOT NULL,
  subtotal       DECIMAL(15,2) NOT NULL DEFAULT 0,
  total          DECIMAL(15,2) NOT NULL DEFAULT 0,
  status         ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status     (status),
  INDEX idx_created_at (created_at),
  INDEX idx_telephone  (telephone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Événements de commande (timeline) ──────────────────────
CREATE TABLE IF NOT EXISTS order_events (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  status     VARCHAR(50) NOT NULL,
  note       TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Admin Users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','livreur') NOT NULL DEFAULT 'manager',
  actif         TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login    TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Zones de livraison ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_zones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nom        VARCHAR(100) NOT NULL,
  prix       DECIMAL(15,2) NOT NULL DEFAULT 0,
  actif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Paramètres du site (clé/valeur) ────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(100) PRIMARY KEY,
  `value`    TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Coupons de réduction ───────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(50) NOT NULL UNIQUE,
  type        ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  valeur      DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order   DECIMAL(15,2) NOT NULL DEFAULT 0,
  uses_limit  INT NOT NULL DEFAULT 0,
  uses_count  INT NOT NULL DEFAULT 0,
  expires_at  DATETIME NULL,
  actif       TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Avis produits ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  nom        VARCHAR(100) NOT NULL,
  note       TINYINT NOT NULL DEFAULT 5,
  comment    TEXT,
  approved   TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES produits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CRM Clients ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nom        VARCHAR(255) NOT NULL,
  telephone  VARCHAR(20) NOT NULL UNIQUE,
  email      VARCHAR(150),
  adresse    TEXT,
  statut     ENUM('normal','vip','blacklist') NOT NULL DEFAULT 'normal',
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── WhatsApp messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  wa_id       VARCHAR(100) NOT NULL UNIQUE,
  from_number VARCHAR(20) NOT NULL,
  to_number   VARCHAR(20) NOT NULL,
  body        TEXT NOT NULL,
  direction   ENUM('in','out') NOT NULL DEFAULT 'in',
  type        VARCHAR(30) NOT NULL DEFAULT 'text',
  status      VARCHAR(30),
  read_at     TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_from (from_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Entrepôts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entrepots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nom        VARCHAR(100) NOT NULL,
  adresse    TEXT,
  actif      TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Stocks par entrepôt ────────────────────────────────────
CREATE TABLE IF NOT EXISTS produit_stocks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produit_id  INT NOT NULL,
  entrepot_id INT NOT NULL,
  quantite    INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_produit_entrepot (produit_id, entrepot_id),
  FOREIGN KEY (produit_id)  REFERENCES produits(id)  ON DELETE CASCADE,
  FOREIGN KEY (entrepot_id) REFERENCES entrepots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Produits liés (recommandations) ────────────────────────
CREATE TABLE IF NOT EXISTS produits_lies (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  produit_id   INT NOT NULL,
  lie_id       INT NOT NULL,
  type         ENUM('similaire','complementaire','upsell') NOT NULL DEFAULT 'similaire',
  sort_order   INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_lien (produit_id, lie_id),
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
  FOREIGN KEY (lie_id)     REFERENCES produits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Compte admin par défaut ────────────────────────────────
-- Mot de passe : "admin123" (bcrypt) — À CHANGER IMMÉDIATEMENT
INSERT IGNORE INTO admin_users (nom, email, password_hash, role)
VALUES (
  'Administrateur',
  'admin@togolese.net',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);
