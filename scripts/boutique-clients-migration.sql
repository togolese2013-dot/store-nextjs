-- ============================================================
-- Boutique Clients — Migration
-- Separate client base for in-store (boutique) management
-- Run once on your database
-- ============================================================

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
  INDEX idx_telephone (telephone),
  INDEX idx_solde     (solde),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
