-- ============================================================
-- Ventes — Migration (Factures, Devis, Livraisons)
-- Exécuter sur votre base MySQL cloud
-- ============================================================

-- Table 1 : Factures
CREATE TABLE IF NOT EXISTS factures (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reference     VARCHAR(50)  NOT NULL UNIQUE,
  client_nom    VARCHAR(255) NOT NULL,
  client_tel    VARCHAR(50)  DEFAULT NULL,
  client_email  VARCHAR(255) DEFAULT NULL,
  items         JSON         NOT NULL,
  sous_total    DECIMAL(15,2) NOT NULL DEFAULT 0,
  remise        DECIMAL(15,2) NOT NULL DEFAULT 0,
  total         DECIMAL(15,2) NOT NULL DEFAULT 0,
  statut        ENUM('brouillon','valide','paye','annule') NOT NULL DEFAULT 'brouillon',
  note          TEXT         DEFAULT NULL,
  admin_id      INT          DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_statut     (statut),
  KEY idx_client     (client_nom),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2 : Devis
CREATE TABLE IF NOT EXISTS devis (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reference     VARCHAR(50)  NOT NULL UNIQUE,
  client_nom    VARCHAR(255) NOT NULL,
  client_tel    VARCHAR(50)  DEFAULT NULL,
  client_email  VARCHAR(255) DEFAULT NULL,
  items         JSON         NOT NULL,
  sous_total    DECIMAL(15,2) NOT NULL DEFAULT 0,
  remise        DECIMAL(15,2) NOT NULL DEFAULT 0,
  total         DECIMAL(15,2) NOT NULL DEFAULT 0,
  statut        ENUM('brouillon','envoye','accepte','refuse','expire') NOT NULL DEFAULT 'brouillon',
  valide_jusqu  DATE         DEFAULT NULL,
  note          TEXT         DEFAULT NULL,
  admin_id      INT          DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_statut     (statut),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3 : Livraisons
CREATE TABLE IF NOT EXISTS livraisons (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reference     VARCHAR(50)  NOT NULL UNIQUE,
  facture_id    INT          DEFAULT NULL,
  client_nom    VARCHAR(255) NOT NULL,
  client_tel    VARCHAR(50)  DEFAULT NULL,
  adresse       TEXT         DEFAULT NULL,
  statut        ENUM('en_attente','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente',
  livreur       VARCHAR(255) DEFAULT NULL,
  note          TEXT         DEFAULT NULL,
  livree_le     TIMESTAMP    DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_statut     (statut),
  KEY idx_facture_id (facture_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
