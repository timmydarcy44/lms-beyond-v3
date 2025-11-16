-- ============================================
-- CORRECTIONS BASÉES SUR L'AUDIT
-- ============================================
-- Ce script corrige les colonnes manquantes identifiées par l'audit
-- Usage: Exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. COURSES - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Org ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
    
    -- Index pour performance
    CREATE INDEX IF NOT EXISTS courses_org_id_idx ON public.courses (org_id);
  END IF;
  
  -- Created by (alias pour creator_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis creator_id si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'creator_id'
    ) THEN
      UPDATE public.courses
      SET created_by = creator_id
      WHERE created_by IS NULL AND creator_id IS NOT NULL;
    END IF;
    
    -- Index pour performance
    CREATE INDEX IF NOT EXISTS courses_created_by_idx ON public.courses (created_by);
  END IF;
END $$;

-- ============================================
-- 2. PATHS - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Org ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paths' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.paths ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
    
    -- Index pour performance
    CREATE INDEX IF NOT EXISTS paths_org_id_idx ON public.paths (org_id);
  END IF;
END $$;

-- ============================================
-- 3. RESOURCES - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN slug text;
    
    -- Générer des slugs basiques si nécessaire
    UPDATE public.resources
    SET slug = 'resource-' || substr(id::text, 1, 8)
    WHERE slug IS NULL OR slug = '';
    
    -- Index pour performance
    CREATE INDEX IF NOT EXISTS resources_slug_idx ON public.resources (slug);
  END IF;
  
  -- Status (pour compatibilité avec published)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN status text DEFAULT 'draft';
    
    -- Synchroniser avec published si existe
    UPDATE public.resources
    SET status = CASE WHEN published THEN 'published' ELSE 'draft' END
    WHERE status = 'draft';
  END IF;
END $$;

-- ============================================
-- 4. TESTS - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Creator ID (alias pour created_by)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis created_by si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'created_by'
    ) THEN
      UPDATE public.tests
      SET creator_id = created_by
      WHERE creator_id IS NULL AND created_by IS NOT NULL;
    END IF;
    
    -- Index pour performance
    CREATE INDEX IF NOT EXISTS tests_creator_id_idx ON public.tests (creator_id);
  END IF;
END $$;

-- ============================================
-- 5. ENROLLMENTS - Synchroniser learner_id et user_id
-- ============================================
DO $$
BEGIN
  -- Si les deux colonnes existent, s'assurer qu'elles sont synchronisées
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'learner_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id'
  ) THEN
    -- Synchroniser user_id avec learner_id où user_id est NULL
    UPDATE public.enrollments
    SET user_id = learner_id
    WHERE user_id IS NULL AND learner_id IS NOT NULL;
    
    -- Synchroniser learner_id avec user_id où learner_id est NULL (mais learner_id est NOT NULL, donc ne devrait pas arriver)
    -- On garde les deux colonnes pour compatibilité
  END IF;
END $$;

-- ============================================
-- 6. LEARNING_SESSIONS - Créer la table si elle n'existe pas
-- ============================================
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  path_id uuid REFERENCES public.paths(id) ON DELETE SET NULL,
  duration_minutes integer DEFAULT 0,
  active_duration_minutes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Indexes pour learning_sessions
CREATE INDEX IF NOT EXISTS learning_sessions_user_id_idx ON public.learning_sessions (user_id);
CREATE INDEX IF NOT EXISTS learning_sessions_course_id_idx ON public.learning_sessions (course_id);
CREATE INDEX IF NOT EXISTS learning_sessions_path_id_idx ON public.learning_sessions (path_id);
CREATE INDEX IF NOT EXISTS learning_sessions_created_at_idx ON public.learning_sessions (created_at);

-- Activer RLS si nécessaire
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'learning_sessions') THEN
    ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

COMMIT;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CORRECTIONS TERMINÉES';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Toutes les colonnes manquantes ont été ajoutées.';
  RAISE NOTICE 'La table learning_sessions a été créée si nécessaire.';
  RAISE NOTICE 'Les données ont été synchronisées.';
END $$;



