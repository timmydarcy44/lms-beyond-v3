-- ============================================
-- CORRIGER LE SCHÉMA DE LEARNING_SESSIONS
-- ============================================
-- Uniformiser les colonnes pour utiliser duration_seconds
-- au lieu de duration_minutes (cohérent avec le code)
-- ============================================

BEGIN;

-- Ajouter duration_seconds et duration_active_seconds si elles n'existent pas
DO $$
BEGIN
  -- Ajouter duration_seconds si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'duration_seconds'
  ) THEN
    -- Si duration_minutes existe, la convertir en seconds
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'learning_sessions' 
        AND column_name = 'duration_minutes'
    ) THEN
      ALTER TABLE public.learning_sessions 
        ADD COLUMN duration_seconds integer DEFAULT 0;
      
      -- Convertir les données existantes
      UPDATE public.learning_sessions
      SET duration_seconds = COALESCE(duration_minutes, 0) * 60
      WHERE duration_seconds IS NULL OR duration_seconds = 0;
      
      RAISE NOTICE 'Colonne duration_seconds ajoutée et données migrées depuis duration_minutes';
    ELSE
      ALTER TABLE public.learning_sessions 
        ADD COLUMN duration_seconds integer NOT NULL DEFAULT 0;
      RAISE NOTICE 'Colonne duration_seconds ajoutée';
    END IF;
  END IF;
  
  -- Ajouter duration_active_seconds si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'duration_active_seconds'
  ) THEN
    -- Si active_duration_minutes existe, la convertir en seconds
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'learning_sessions' 
        AND column_name = 'active_duration_minutes'
    ) THEN
      ALTER TABLE public.learning_sessions 
        ADD COLUMN duration_active_seconds integer DEFAULT 0;
      
      -- Convertir les données existantes
      UPDATE public.learning_sessions
      SET duration_active_seconds = COALESCE(active_duration_minutes, 0) * 60
      WHERE duration_active_seconds IS NULL OR duration_active_seconds = 0;
      
      RAISE NOTICE 'Colonne duration_active_seconds ajoutée et données migrées depuis active_duration_minutes';
    ELSE
      ALTER TABLE public.learning_sessions 
        ADD COLUMN duration_active_seconds integer NOT NULL DEFAULT 0;
      RAISE NOTICE 'Colonne duration_active_seconds ajoutée';
    END IF;
  END IF;
  
  -- Ajouter content_type et content_id si la table utilise course_id/path_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'content_type'
  ) THEN
    ALTER TABLE public.learning_sessions 
      ADD COLUMN content_type text CHECK (content_type IN ('path', 'course', 'resource', 'test'));
    
    -- Déduire content_type depuis course_id ou path_id
    UPDATE public.learning_sessions
    SET content_type = CASE 
      WHEN course_id IS NOT NULL THEN 'course'
      WHEN path_id IS NOT NULL THEN 'path'
      ELSE 'course'
    END
    WHERE content_type IS NULL;
    
    RAISE NOTICE 'Colonne content_type ajoutée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'content_id'
  ) THEN
    ALTER TABLE public.learning_sessions 
      ADD COLUMN content_id uuid;
    
    -- Copier course_id ou path_id dans content_id
    UPDATE public.learning_sessions
    SET content_id = COALESCE(course_id, path_id)
    WHERE content_id IS NULL;
    
    RAISE NOTICE 'Colonne content_id ajoutée';
  END IF;
  
  -- Ajouter started_at si elle n'existe pas (utiliser created_at comme fallback)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.learning_sessions 
      ADD COLUMN started_at timestamptz NOT NULL DEFAULT now();
    
    -- Copier depuis created_at si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'learning_sessions' 
        AND column_name = 'created_at'
    ) THEN
      UPDATE public.learning_sessions
      SET started_at = created_at
      WHERE started_at IS NULL;
    END IF;
    
    RAISE NOTICE 'Colonne started_at ajoutée';
  END IF;
  
  -- Ajouter metadata si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'learning_sessions' 
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.learning_sessions 
      ADD COLUMN metadata jsonb;
    
    RAISE NOTICE 'Colonne metadata ajoutée';
  END IF;
END $$;

COMMIT;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SCHÉMA LEARNING_SESSIONS CORRIGÉ';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Les colonnes sont maintenant uniformisées avec duration_seconds';
END $$;




