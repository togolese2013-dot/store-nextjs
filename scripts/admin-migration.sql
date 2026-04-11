-- ============================================================
--  Admin migration — run once against your MySQL database
-- ============================================================

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  nom          VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('super_admin','admin','editor') DEFAULT 'admin',
  actif        TINYINT(1) DEFAULT 1,
  created_at   DATETIME DEFAULT NOW(),
  last_login   DATETIME NULL
);

-- Key-value settings store
CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(120) PRIMARY KEY,
  `value`    TEXT,
  `category` VARCHAR(60) DEFAULT 'general',
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- Delivery zones (replaces hardcoded list in checkout)
CREATE TABLE IF NOT EXISTS delivery_zones (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  nom        VARCHAR(150) NOT NULL,
  fee        INT DEFAULT 0,
  actif      TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0
);

-- Seed default delivery zones
INSERT IGNORE INTO delivery_zones (nom, fee, sort_order) VALUES
  ('Lomé (Tokoin / Adidogomé / Bè)',   1000,  1),
  ('Lomé (Agoè / Cacaveli / Wété)',    1500,  2),
  ('Kpalimé',                          5000,  3),
  ('Atakpamé',                         6000,  4),
  ('Sokodé',                           8000,  5),
  ('Kara',                             9000,  6),
  ('Dapaong',                          12000, 7),
  ('Autre ville / À préciser',         0,     8);

-- Seed default settings
INSERT IGNORE INTO settings (`key`, `value`, `category`) VALUES
  ('site_name',              'Togolese Shop',   'general'),
  ('site_tagline',           'Boutique Premium au Togo', 'general'),
  ('whatsapp_number',        '22890000000',     'contact'),
  ('whatsapp_numbers',       '[]',              'contact'),
  ('wa_phone_number_id',     '',                'whatsapp_api'),
  ('wa_access_token',        '',                'whatsapp_api'),
  ('wa_webhook_verify_token','',                'whatsapp_api'),
  ('wa_business_account_id', '',                'whatsapp_api'),
  ('theme_primary',          '#0A2463',         'theme'),
  ('theme_accent',           '#F4623A',         'theme'),
  ('theme_font',             'Montserrat',      'theme'),
  ('hero_slide_1_title',     'Électronique Premium', 'hero'),
  ('hero_slide_1_subtitle',  'Les meilleurs produits tech livrés chez vous', 'hero'),
  ('hero_slide_1_cta',       'Voir les produits', 'hero'),
  ('announcement_bar',       '🚚 Livraison rapide à Lomé · Paiement à la livraison ✅', 'general');

-- WhatsApp messages inbox
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  wa_message_id VARCHAR(120) UNIQUE,
  from_number   VARCHAR(30),
  to_number     VARCHAR(30),
  contact_name  VARCHAR(100),
  direction     ENUM('in','out') DEFAULT 'in',
  type          VARCHAR(20) DEFAULT 'text',
  content       TEXT,
  media_url     VARCHAR(500),
  status        VARCHAR(30) DEFAULT 'received',
  read_at       DATETIME NULL,
  created_at    DATETIME DEFAULT NOW()
);

-- Orders (created when checkout form is submitted)
CREATE TABLE IF NOT EXISTS orders (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  reference       VARCHAR(30) UNIQUE NOT NULL,
  nom             VARCHAR(100),
  telephone       VARCHAR(30),
  adresse         TEXT,
  zone_livraison  VARCHAR(150),
  delivery_fee    INT DEFAULT 0,
  note            TEXT,
  items           JSON,
  subtotal        INT DEFAULT 0,
  total           INT DEFAULT 0,
  status          ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  created_at      DATETIME DEFAULT NOW(),
  updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- Customer reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
  nom        VARCHAR(100),
  rating     TINYINT DEFAULT 5,
  comment    TEXT,
  approved   TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  code       VARCHAR(50) UNIQUE NOT NULL,
  type       ENUM('percent','fixed') DEFAULT 'percent',
  valeur     DECIMAL(10,2) DEFAULT 0,
  min_order  INT DEFAULT 0,
  max_uses   INT DEFAULT 0,
  uses_count INT DEFAULT 0,
  expires_at DATETIME NULL,
  actif      TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT NOW()
);
