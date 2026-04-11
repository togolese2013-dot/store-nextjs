-- ============================================================
-- Migration : Ventes boutique, Stock, Factures, Proformats
-- ============================================================

-- Ventes en boutique physique
CREATE TABLE IF NOT EXISTS ventes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reference       VARCHAR(50) NOT NULL UNIQUE,
  client_nom      VARCHAR(255),
  client_telephone VARCHAR(50),
  total           INT NOT NULL DEFAULT 0,       -- FCFA
  remise          INT NOT NULL DEFAULT 0,       -- FCFA
  montant_recu    INT NOT NULL DEFAULT 0,       -- FCFA
  monnaie         INT NOT NULL DEFAULT 0,       -- FCFA rendu
  statut          ENUM('validee','annulee') NOT NULL DEFAULT 'validee',
  note            TEXT,
  vendeur_id      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_statut (statut)
);

-- Lignes de vente
CREATE TABLE IF NOT EXISTS vente_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  vente_id        INT NOT NULL,
  produit_id      INT NOT NULL,
  produit_nom     VARCHAR(255) NOT NULL,
  produit_ref     VARCHAR(100),
  variante_nom    VARCHAR(255),
  quantite        INT NOT NULL DEFAULT 1,
  prix_unitaire   INT NOT NULL,
  total           INT NOT NULL,
  KEY idx_vente_id (vente_id),
  KEY idx_produit_id (produit_id)
);

-- Stock boutique physique (séparé du stock en ligne)
CREATE TABLE IF NOT EXISTS stock_boutique (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  produit_id      INT NOT NULL UNIQUE,
  quantite        INT NOT NULL DEFAULT 0,
  seuil_alerte    INT NOT NULL DEFAULT 5,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_produit_id (produit_id)
);

-- Mouvements de stock boutique
CREATE TABLE IF NOT EXISTS stock_mouvements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  produit_id      INT NOT NULL,
  type            ENUM('entree','retrait','vente') NOT NULL,
  quantite        INT NOT NULL,
  stock_apres     INT NOT NULL DEFAULT 0,
  reference       VARCHAR(100),                 -- référence vente ou bon
  note            TEXT,
  user_id         INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_produit_id (produit_id),
  KEY idx_type (type),
  KEY idx_created_at (created_at)
);

-- Proformats / devis
CREATE TABLE IF NOT EXISTS proformats (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reference       VARCHAR(50) NOT NULL UNIQUE,
  client_nom      VARCHAR(255) NOT NULL,
  client_telephone VARCHAR(50),
  client_adresse  TEXT,
  client_email    VARCHAR(255),
  items           JSON NOT NULL,               -- [{produit_nom, quantite, prix_unitaire, total}]
  sous_total      INT NOT NULL DEFAULT 0,
  remise          INT NOT NULL DEFAULT 0,
  total           INT NOT NULL DEFAULT 0,
  validite_jours  INT NOT NULL DEFAULT 30,
  note            TEXT,
  statut          ENUM('actif','accepte','expire','annule') NOT NULL DEFAULT 'actif',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_statut (statut),
  INDEX idx_created_at (created_at)
);
