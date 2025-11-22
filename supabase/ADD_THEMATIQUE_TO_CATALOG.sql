-- Ajouter le champ thématique à catalog_items si category n'est pas suffisant
-- On peut utiliser category pour thématique, mais on ajoute aussi un champ séparé pour plus de clarté

-- Si le champ thématique n'existe pas, on peut utiliser category
-- Sinon, on ajoute une colonne thématique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' 
    AND column_name = 'thematique'
  ) THEN
    ALTER TABLE catalog_items ADD COLUMN thematique TEXT;
    
    -- Si category existe et thematique est vide, copier category vers thematique
    UPDATE catalog_items 
    SET thematique = category 
    WHERE thematique IS NULL AND category IS NOT NULL;
  END IF;
END $$;

-- Index pour les recherches par thématique
CREATE INDEX IF NOT EXISTS idx_catalog_items_thematique ON catalog_items(thematique) WHERE thematique IS NOT NULL;

COMMENT ON COLUMN catalog_items.thematique IS 'Thématique du contenu (RH, BTS, Commerce, Marketing, Communication, etc.)';








