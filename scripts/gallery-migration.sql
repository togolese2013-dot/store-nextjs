-- Migration: Galerie d'images produit
-- Ajoute une colonne JSON pour stocker plusieurs images par produit

ALTER TABLE produits ADD COLUMN images_json JSON NULL AFTER image_url;

-- Exemple de données existantes (copier image_url vers images_json pour les produits qui en ont)
-- UPDATE produits SET images_json = JSON_ARRAY(image_url) WHERE image_url IS NOT NULL AND image_url != '';