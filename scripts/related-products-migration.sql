-- Migration: Produits liés / recommandations
-- Crée une table pour associer manuellement des produits similaires ou complémentaires

CREATE TABLE IF NOT EXISTS produits_liés (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produit_id INT NOT NULL,
  produit_lié_id INT NOT NULL,
  type ENUM('similaire', 'complementaire', 'upsell') DEFAULT 'similaire',
  ordre INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_lié_id) REFERENCES produits(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_association (produit_id, produit_lié_id),
  INDEX idx_produit (produit_id),
  INDEX idx_produit_lié (produit_lié_id)
);

-- Exemple d'insertion :
-- INSERT INTO produits_liés (produit_id, produit_lié_id, type, ordre) VALUES
-- (1, 2, 'similaire', 1),
-- (1, 3, 'complementaire', 2),
-- (1, 4, 'upsell', 3);