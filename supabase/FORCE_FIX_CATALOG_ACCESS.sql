-- Script FORCÉ pour corriger catalog_access et permettre user_id (B2C)
-- Ce script force la suppression de toutes les contraintes et les recrée correctement

-- 1. Supprimer TOUTES les contraintes qui pourraient bloquer
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les contraintes CHECK
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.catalog_access'::regclass
        AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE public.catalog_access DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
    
    -- Supprimer toutes les contraintes UNIQUE
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.catalog_access'::regclass
        AND contype = 'u'
    ) LOOP
        EXECUTE 'ALTER TABLE public.catalog_access DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Supprimer tous les index uniques qui pourraient bloquer
DROP INDEX IF EXISTS catalog_access_user_item_unique;
DROP INDEX IF EXISTS catalog_access_org_item_unique;
DROP INDEX IF EXISTS catalog_access_organization_id_catalog_item_id_key;

-- 3. Ajouter la colonne user_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_access'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.catalog_access
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. FORCER la suppression de NOT NULL sur organization_id
ALTER TABLE public.catalog_access
ALTER COLUMN organization_id DROP NOT NULL;

-- 5. Créer l'index pour user_id
CREATE INDEX IF NOT EXISTS idx_catalog_access_user ON public.catalog_access(user_id);

-- 6. Créer les index uniques partiels
CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_user_item_unique 
  ON public.catalog_access(user_id, catalog_item_id) 
  WHERE user_id IS NOT NULL AND organization_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_org_item_unique 
  ON public.catalog_access(organization_id, catalog_item_id) 
  WHERE organization_id IS NOT NULL AND user_id IS NULL;

-- 7. Ajouter la contrainte CHECK pour s'assurer qu'on a soit organization_id, soit user_id
ALTER TABLE public.catalog_access
DROP CONSTRAINT IF EXISTS catalog_access_org_or_user_check;

ALTER TABLE public.catalog_access
ADD CONSTRAINT catalog_access_org_or_user_check 
CHECK (
  (organization_id IS NOT NULL AND user_id IS NULL) OR 
  (organization_id IS NULL AND user_id IS NOT NULL)
);

-- 8. Mettre à jour les RLS policies
DROP POLICY IF EXISTS "catalog_access_select_user" ON public.catalog_access;
CREATE POLICY "catalog_access_select_user"
  ON public.catalog_access
  FOR SELECT
  USING (user_id = auth.uid());

-- 9. Vérification finale
DO $$
DECLARE
    org_nullable BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- Vérifier si organization_id est nullable
    SELECT is_nullable = 'YES' INTO org_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_access'
      AND column_name = 'organization_id';
    
    -- Vérifier si user_id existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'catalog_access'
          AND column_name = 'user_id'
    ) INTO user_exists;
    
    RAISE NOTICE 'organization_id nullable: %', org_nullable;
    RAISE NOTICE 'user_id exists: %', user_exists;
END $$;

