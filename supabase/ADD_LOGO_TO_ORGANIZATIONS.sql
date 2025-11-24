-- ============================================
-- AJOUTER LA COLONNE LOGO À ORGANIZATIONS
-- ============================================
-- Ce script ajoute la colonne logo si elle n'existe pas
-- Usage: Exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- Ajouter la colonne logo si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'logo'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN logo text;
    
    RAISE NOTICE 'Colonne logo ajoutée à la table organizations';
  ELSE
    RAISE NOTICE 'La colonne logo existe déjà dans la table organizations';
  END IF;
END $$;

COMMIT;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'COLONNE LOGO AJOUTÉE';
  RAISE NOTICE '============================================';
END $$;









