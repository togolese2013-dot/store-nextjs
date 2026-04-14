-- ============================================================
-- Stock Boutique — Migration dédiée
-- Exécuter sur votre base MySQL cloud (Railway / PlanetScale)
-- ============================================================

-- Table 1 : stock courant par produit
CREATE TABLE IF NOT EXISTS boutique_stock (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  produit_id    INT NOT NULL,
  quantite      INT NOT NULL DEFAULT 0,
  seuil_alerte  INT NOT NULL DEFAULT 5,        -- en dessous = "stock faible"
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_produit (produit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2 : journal de tous les mouvements de stock
CREATE TABLE IF NOT EXISTS boutique_mouvements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  produit_id    INT NOT NULL,
  type          ENUM('entree','sortie','retrait','ajustement') NOT NULL,
  quantite      INT NOT NULL,                  -- toujours positif ; le type détermine le sens
  motif         VARCHAR(500)  DEFAULT NULL,
  ref_commande  VARCHAR(100)  DEFAULT NULL,    -- référence CMD pour les retraits client
  admin_id      INT           DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_produit    (produit_id),
  KEY idx_type       (type),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initialisation : charger le stock depuis produits.stock_boutique
-- (ignorer les doublons si déjà peuplé)
-- --------------------------------------------------------
INSERT INTO boutique_stock (produit_id, quantite)
SELECT id, GREATEST(0, COALESCE(stock_boutique, 0))
FROM produits
ON DUPLICATE KEY UPDATE quantite = VALUES(quantite);
