-- =====================================================
-- Script pour s'assurer que creator_id existe dans catalog_items
-- =====================================================
-- Ce script ajoute creator_id si elle n'existe pas
-- et la remplit avec created_by si nécessaire
-- =====================================================

-- Ajouter creator_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'creator_id'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE catalog_items 
    ADD COLUMN creator_id UUID REFERENCES public.profiles(id);
    
    -- Remplir creator_id avec created_by pour les items existants
    UPDATE catalog_items 
    SET creator_id = created_by
    WHERE creator_id IS NULL AND created_by IS NOT NULL;
    
    RAISE NOTICE 'Colonne creator_id ajoutée et remplie depuis created_by';
  ELSE
    RAISE NOTICE 'Colonne creator_id existe déjà';
    
    -- S'assurer que creator_id est rempli pour les items où elle est NULL
    UPDATE catalog_items 
    SET creator_id = created_by
    WHERE creator_id IS NULL AND created_by IS NOT NULL;
    
    RAISE NOTICE 'Colonne creator_id mise à jour pour les valeurs NULL';
  END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_id 
ON catalog_items(creator_id)
WHERE creator_id IS NOT NULL;

-- Vérifier les résultats
SELECT 
  'CATALOG ITEMS PAR CREATOR' as "Info",
  p.email as creator_email,
  COUNT(*) as item_count
FROM catalog_items ci
LEFT JOIN profiles p ON p.id = COALESCE(ci.creator_id, ci.created_by)
GROUP BY p.email, COALESCE(ci.creator_id, ci.created_by)
ORDER BY item_count DESC;

