-- ============================================================
-- Migration : Catégories, CRM, Entrepôts, Hero
-- Projet    : Togolese Shop (store-nextjs)
-- Date      : 2026-04-11
-- Compatible MySQL 8
-- ============================================================

-- ─── 1. Table categories (si absente) ────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(120) NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. Table clients (CRM) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  telephone   VARCHAR(30)  NOT NULL,
  nom         VARCHAR(120) DEFAULT '',
  email       VARCHAR(120) DEFAULT '',
  adresse     TEXT,
  ville       VARCHAR(80)  DEFAULT '',
  tags        JSON,
  statut      ENUM('normal','vip','blacklist') DEFAULT 'normal',
  notes       TEXT,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_telephone (telephone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. Colonnes client_id + entrepot_id dans orders ─────────
-- MySQL 8 ne supporte pas ADD COLUMN IF NOT EXISTS,
-- on utilise une procédure pour vérifier avant d'ajouter.

DROP PROCEDURE IF EXISTS _add_col;
DELIMITER $$
CREATE PROCEDURE _add_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'client_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN client_id INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'entrepot_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN entrepot_id INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_client_id'
  ) THEN
    ALTER TABLE orders ADD INDEX idx_client_id (client_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_entrepot_id'
  ) THEN
    ALTER TABLE orders ADD INDEX idx_entrepot_id (entrepot_id);
  END IF;
END$$
DELIMITER ;
CALL _add_col();
DROP PROCEDURE IF EXISTS _add_col;

-- ─── 4. Table entrepôts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS entrepots (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(120) NOT NULL,
  adresse     TEXT,
  telephone   VARCHAR(30)  DEFAULT '',
  responsable VARCHAR(120) DEFAULT '',
  actif       TINYINT(1)   DEFAULT 1,
  sort_order  INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. Table stocks par entrepôt ────────────────────────────
CREATE TABLE IF NOT EXISTS produit_stocks (
  produit_id  INT NOT NULL,
  entrepot_id INT NOT NULL,
  stock       INT DEFAULT 0,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (produit_id, entrepot_id),
  INDEX idx_entrepot (entrepot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 6. Clés hero dans settings (si absentes) ────────────────
INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('hero_slide_1_title',    'Capturez chaque moment parfait'),
  ('hero_slide_1_subtitle', 'Caméras, drones et accessoires de qualité professionnelle. Livraison rapide à Lomé.'),
  ('hero_slide_1_cta',      'Découvrir le catalogue'),
  ('hero_slide_1_image',    '/hero_1.png'),
  ('hero_slide_1_gradient', 'from-[#0A2463] via-[#1E3A8A] to-[#1e40af]'),
  ('hero_slide_2_title',    'Les bonnes affaires sont ici'),
  ('hero_slide_2_subtitle', 'Jusqu''à -50% sur des centaines de produits.'),
  ('hero_slide_2_cta',      'Voir les promotions'),
  ('hero_slide_2_image',    '/hero_2.png'),
  ('hero_slide_2_gradient', 'from-[#1a0533] via-[#3b0764] to-[#4c0d99]'),
  ('hero_slide_3_title',    'Son cristallin, expérience ultime'),
  ('hero_slide_3_subtitle', 'Les meilleurs casques et accessoires gaming. Qualité garantie.'),
  ('hero_slide_3_cta',      'Explorer l''audio'),
  ('hero_slide_3_image',    '/hero_3.png'),
  ('hero_slide_3_gradient', 'from-[#0c1445] via-[#1a2570] to-[#0A2463]');

-- ─── 7. Vérification ─────────────────────────────────────────
SELECT 'clients'        AS table_name, COUNT(*) AS total FROM clients        UNION ALL
SELECT 'entrepots'      AS table_name, COUNT(*) AS total FROM entrepots       UNION ALL
SELECT 'produit_stocks' AS table_name, COUNT(*) AS total FROM produit_stocks;
