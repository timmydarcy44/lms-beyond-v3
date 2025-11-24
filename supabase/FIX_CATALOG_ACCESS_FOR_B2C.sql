-- Script pour permettre l'utilisation de catalog_access avec user_id (B2C)
-- Ce script rend organization_id nullable et ajoute user_id

-- 1. Ajouter la colonne user_id si elle n'existe pas
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
    
    -- Créer un index pour les recherches par user_id
    CREATE INDEX IF NOT EXISTS idx_catalog_access_user ON public.catalog_access(user_id);
  END IF;
END $$;

-- 2. Supprimer la contrainte NOT NULL sur organization_id
DO $$
BEGIN
  -- Vérifier si organization_id a une contrainte NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_access'
      AND column_name = 'organization_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.catalog_access
    ALTER COLUMN organization_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Supprimer l'ancienne contrainte UNIQUE si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalog_access_organization_id_catalog_item_id_key'
  ) THEN
    ALTER TABLE public.catalog_access
    DROP CONSTRAINT catalog_access_organization_id_catalog_item_id_key;
  END IF;
END $$;

-- 4. Créer les index uniques partiels
DROP INDEX IF EXISTS catalog_access_user_item_unique;
CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_user_item_unique 
  ON public.catalog_access(user_id, catalog_item_id) 
  WHERE user_id IS NOT NULL AND organization_id IS NULL;

DROP INDEX IF EXISTS catalog_access_org_item_unique;
CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_org_item_unique 
  ON public.catalog_access(organization_id, catalog_item_id) 
  WHERE organization_id IS NOT NULL AND user_id IS NULL;

-- 5. Ajouter la contrainte CHECK pour s'assurer qu'on a soit organization_id, soit user_id
DO $$
BEGIN
  -- Supprimer la contrainte si elle existe déjà
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalog_access_org_or_user_check'
  ) THEN
    ALTER TABLE public.catalog_access
    DROP CONSTRAINT catalog_access_org_or_user_check;
  END IF;
  
  -- Créer la nouvelle contrainte
  ALTER TABLE public.catalog_access
  ADD CONSTRAINT catalog_access_org_or_user_check 
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR 
    (organization_id IS NULL AND user_id IS NOT NULL)
  );
END $$;

-- 6. Mettre à jour les RLS policies
DROP POLICY IF EXISTS "catalog_access_select_user" ON public.catalog_access;
CREATE POLICY "catalog_access_select_user"
  ON public.catalog_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Commentaires
COMMENT ON COLUMN public.catalog_access.user_id IS 'ID de l''utilisateur pour les accès B2C (utilisateurs individuels). Si présent, organization_id doit être NULL.';
COMMENT ON COLUMN public.catalog_access.organization_id IS 'ID de l''organisation pour les accès B2B. Si présent, user_id doit être NULL.';

