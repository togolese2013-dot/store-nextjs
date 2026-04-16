-- ============================================================
-- Migration : Système livraisons + livreurs
-- À exécuter : mysql -u USER -p DATABASE < scripts/livraisons-migration.sql
-- ============================================================

-- 1. Champs ventes v2 sur la table factures (idempotent)
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS avec_livraison       TINYINT(1)      DEFAULT 0        AFTER total,
  ADD COLUMN IF NOT EXISTS adresse_livraison     VARCHAR(500)    NULL             AFTER avec_livraison,
  ADD COLUMN IF NOT EXISTS contact_livraison     VARCHAR(255)    NULL             AFTER adresse_livraison,
  ADD COLUMN IF NOT EXISTS lien_localisation     VARCHAR(500)    NULL             AFTER contact_livraison,
  ADD COLUMN IF NOT EXISTS mode_paiement         VARCHAR(50)     NULL             AFTER lien_localisation,
  ADD COLUMN IF NOT EXISTS statut_paiement       VARCHAR(50)     NULL             AFTER mode_paiement,
  ADD COLUMN IF NOT EXISTS montant_acompte       DECIMAL(12,2)   NULL             AFTER statut_paiement;

-- 2. Table livreurs
CREATE TABLE IF NOT EXISTS livreurs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(255)  NOT NULL,
  telephone   VARCHAR(50)   NULL,
  code_acces  VARCHAR(30)   NOT NULL UNIQUE COMMENT 'Code unique pour accéder à la page livreur',
  statut      ENUM('disponible','indisponible') NOT NULL DEFAULT 'disponible',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Table livraisons_ventes (crée si elle n'existe pas encore)
CREATE TABLE IF NOT EXISTS livraisons_ventes (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  reference           VARCHAR(60)   NOT NULL UNIQUE,
  facture_id          INT           NULL,
  client_nom          VARCHAR(255)  NOT NULL,
  client_tel          VARCHAR(50)   NULL,
  adresse             VARCHAR(500)  NULL,
  contact_livraison   VARCHAR(255)  NULL,
  lien_localisation   VARCHAR(500)  NULL,
  livreur_id          INT           NULL,
  livreur             VARCHAR(255)  NULL COMMENT 'Nom dénormalisé du livreur',
  statut              ENUM('en_attente','acceptee','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente',
  note                TEXT          NULL,
  livree_le           DATETIME      NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (facture_id)  REFERENCES factures(id)  ON DELETE SET NULL,
  FOREIGN KEY (livreur_id)  REFERENCES livreurs(id)  ON DELETE SET NULL
);

-- 4. Si la table existe déjà, ajouter les colonnes manquantes (idempotent)
ALTER TABLE livraisons_ventes
  ADD COLUMN IF NOT EXISTS livreur_id        INT           NULL AFTER livreur,
  ADD COLUMN IF NOT EXISTS contact_livraison VARCHAR(255)  NULL AFTER adresse,
  ADD COLUMN IF NOT EXISTS lien_localisation VARCHAR(500)  NULL AFTER contact_livraison;

-- Ajouter la valeur 'acceptee' à l'enum statut si elle n'existe pas
-- (MySQL ne permet pas ADD IF NOT EXISTS sur ENUM, on fait un MODIFY)
ALTER TABLE livraisons_ventes
  MODIFY COLUMN statut ENUM('en_attente','acceptee','en_cours','livre','echoue') NOT NULL DEFAULT 'en_attente';
