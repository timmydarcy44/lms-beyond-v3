-- Ajouter le champ target_audience pour distinguer les formations pour pro vs apprenants
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'pro' 
CHECK (target_audience IN ('pro', 'apprenant', 'all'));

-- Commentaire
COMMENT ON COLUMN catalog_items.target_audience IS 'Cible: pro (CFA, entreprises, formateurs), apprenant (étudiants), all (tous)';

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_catalog_items_target_audience ON catalog_items(target_audience);









