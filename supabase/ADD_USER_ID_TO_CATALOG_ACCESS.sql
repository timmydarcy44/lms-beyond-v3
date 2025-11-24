-- Ajouter la colonne user_id à catalog_access pour les accès B2C (utilisateurs individuels)
-- Cette migration permet d'utiliser catalog_access pour les deux cas : B2B (organization_id) et B2C (user_id)

DO $$
BEGIN
  -- Ajouter la colonne user_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_access'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.catalog_access
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Créer un index pour les recherches par user_id
    CREATE INDEX IF NOT EXISTS idx_catalog_access_user ON public.catalog_access(user_id);
    
    -- Modifier organization_id pour qu'il soit nullable (car on peut avoir soit organization_id, soit user_id)
    ALTER TABLE public.catalog_access
    ALTER COLUMN organization_id DROP NOT NULL;
    
    -- Supprimer l'ancienne contrainte UNIQUE
    ALTER TABLE public.catalog_access
    DROP CONSTRAINT IF EXISTS catalog_access_organization_id_catalog_item_id_key;
    
    -- Créer une contrainte unique pour (user_id, catalog_item_id) quand user_id est présent
    -- et pour (organization_id, catalog_item_id) quand organization_id est présent
    -- Note: PostgreSQL ne supporte pas directement les contraintes conditionnelles UNIQUE,
    -- donc on utilise un index unique partiel
    CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_user_item_unique 
      ON public.catalog_access(user_id, catalog_item_id) 
      WHERE user_id IS NOT NULL AND organization_id IS NULL;
    
    CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_org_item_unique 
      ON public.catalog_access(organization_id, catalog_item_id) 
      WHERE organization_id IS NOT NULL AND user_id IS NULL;
  END IF;
END $$;

-- Ajouter une contrainte pour s'assurer qu'on a soit organization_id, soit user_id (mais pas les deux)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalog_access_org_or_user_check'
  ) THEN
    ALTER TABLE public.catalog_access
    ADD CONSTRAINT catalog_access_org_or_user_check 
    CHECK (
      (organization_id IS NOT NULL AND user_id IS NULL) OR 
      (organization_id IS NULL AND user_id IS NOT NULL)
    );
  END IF;
END $$;

-- Mettre à jour les RLS policies pour permettre aux utilisateurs de voir leurs propres accès
DROP POLICY IF EXISTS "catalog_access_select_user" ON public.catalog_access;
CREATE POLICY "catalog_access_select_user"
  ON public.catalog_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Commentaires
COMMENT ON COLUMN public.catalog_access.user_id IS 'ID de l''utilisateur pour les accès B2C (utilisateurs individuels). Si présent, organization_id doit être NULL.';
COMMENT ON COLUMN public.catalog_access.organization_id IS 'ID de l''organisation pour les accès B2B. Si présent, user_id doit être NULL.';

