-- Migration ventes v2
-- Adds livraison flag, payment method and payment status to factures table
-- Run once: mysql -u USER -p DATABASE < scripts/ventes-v2-migration.sql

ALTER TABLE factures ADD COLUMN IF NOT EXISTS avec_livraison  TINYINT(1)  NOT NULL DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS mode_paiement   VARCHAR(50) DEFAULT NULL;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(30) DEFAULT NULL;
