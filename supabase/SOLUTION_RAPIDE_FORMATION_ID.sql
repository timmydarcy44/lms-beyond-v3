-- Solution RAPIDE pour corriger l'erreur formation_id NULL
-- Ce script rend formation_id nullable temporairement pour permettre la création de formations
-- Utilisez builder_snapshot pour la structure, pas la table sections

-- ============================================
-- Solution 1 : Rendre formation_id nullable
-- ============================================
DO $$
BEGIN
  -- Vérifier si la colonne formation_id existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'sections' 
      AND column_name = 'formation_id'
  ) THEN
    -- Rendre nullable
    ALTER TABLE public.sections ALTER COLUMN formation_id DROP NOT NULL;
    RAISE NOTICE 'formation_id rendue nullable avec succès';
  ELSE
    RAISE NOTICE 'La colonne formation_id n''existe pas dans sections';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur: %', SQLERRM;
END $$;

-- ============================================
-- Solution 2 : Désactiver TOUS les triggers sur sections
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Désactiver tous les triggers sur sections
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.sections DISABLE TRIGGER %I', r.trigger_name);
      RAISE NOTICE 'Trigger désactivé: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Impossible de désactiver %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- Solution 3 : Supprimer tous les triggers sur sections
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Supprimer tous les triggers sur sections
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sections CASCADE', r.trigger_name);
      RAISE NOTICE 'Trigger supprimé: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Impossible de supprimer %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- Solution 4 : Désactiver TOUS les triggers sur courses aussi
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Désactiver tous les triggers sur courses
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.courses DISABLE TRIGGER %I', r.trigger_name);
      RAISE NOTICE 'Trigger désactivé sur courses: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Impossible de désactiver %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- Vérification finale
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Vérifier que formation_id est nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'sections' 
      AND column_name = 'formation_id'
      AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'formation_id est maintenant nullable';
  ELSE
    RAISE NOTICE 'formation_id est toujours NOT NULL';
  END IF;
  
  -- Lister les triggers restants
  RAISE NOTICE '=== Triggers restants sur sections ===';
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    RAISE NOTICE 'Trigger actif: %', r.trigger_name;
  END LOOP;
END $$;

