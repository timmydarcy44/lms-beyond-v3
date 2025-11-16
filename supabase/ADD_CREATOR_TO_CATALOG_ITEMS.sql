-- Ajouter creator_id à catalog_items pour lier chaque item à son Super Admin
-- =========================================================================

-- 1. Ajouter la colonne creator_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE catalog_items ADD COLUMN creator_id UUID REFERENCES public.profiles(id);
    
    -- Remplir creator_id avec les Super Admins existants basé sur les courses créés
    -- Pour les items existants, on essaie de trouver le créateur via le course associé
    -- content_id est de type UUID, donc on compare directement
    UPDATE catalog_items ci
    SET creator_id = (
      SELECT c.creator_id
      FROM courses c
      WHERE c.id = ci.content_id
        AND ci.item_type = 'module'
      LIMIT 1
    )
    WHERE ci.creator_id IS NULL
      AND ci.content_id IS NOT NULL
      AND ci.item_type = 'module';
    
    -- Pour les autres types, utiliser le premier super admin trouvé (à ajuster manuellement si nécessaire)
    UPDATE catalog_items ci
    SET creator_id = (
      SELECT sa.user_id
      FROM super_admins sa
      WHERE sa.is_active = TRUE
      ORDER BY sa.created_at
      LIMIT 1
    )
    WHERE ci.creator_id IS NULL;
    
    RAISE NOTICE 'Colonne creator_id ajoutée et remplie';
  ELSE
    RAISE NOTICE 'Colonne creator_id existe déjà';
  END IF;
END $$;

-- 2. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_id ON catalog_items(creator_id);

-- 3. Vérifier les résultats
SELECT 
  'CATALOG ITEMS PAR CREATOR' as "Info",
  p.email as creator_email,
  COUNT(*) as item_count
FROM catalog_items ci
LEFT JOIN profiles p ON p.id = ci.creator_id
GROUP BY p.email, ci.creator_id
ORDER BY item_count DESC;

