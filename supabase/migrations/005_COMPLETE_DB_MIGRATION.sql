-- ============================================
-- MIGRATION COMPLÈTE DE LA BASE DE DONNÉES
-- ============================================
-- Cette migration corrige toutes les incohérences identifiées
-- et ajoute toutes les tables/colonnes manquantes
-- ============================================
-- Usage: Exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. PROFILES - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
    
    -- Remplir depuis auth.users
    UPDATE public.profiles p
    SET email = au.email
    FROM auth.users au
    WHERE p.id = au.id AND p.email IS NULL;
  END IF;
  
  -- Full name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
    
    -- Copier depuis display_name si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name'
    ) THEN
      UPDATE public.profiles
      SET full_name = display_name
      WHERE full_name IS NULL AND display_name IS NOT NULL;
    END IF;
  END IF;
  
  -- First name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN first_name text;
  END IF;
  
  -- Last name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text;
  END IF;
  
  -- Phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
  
  -- Avatar URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Index sur email pour performances
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- ============================================
-- 2. COURSES - Ajouter colonnes manquantes
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
  
  -- Owner ID (si différent de creator_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis creator_id si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'creator_id'
    ) THEN
      UPDATE public.courses
      SET owner_id = creator_id
      WHERE owner_id IS NULL AND creator_id IS NOT NULL;
    END IF;
  END IF;
  
  -- Created by (alias pour creator_id si nécessaire)
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
  END IF;
  
  -- Cover image
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN cover_image text;
  END IF;
  
  -- Modules count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'modules_count'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN modules_count integer DEFAULT 0;
  END IF;
  
  -- Duration minutes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN duration_minutes integer;
  END IF;
  
  -- Duration label
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'duration_label'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN duration_label text;
  END IF;
  
  -- Category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN category text;
  END IF;
END $$;

-- Indexes pour courses
CREATE INDEX IF NOT EXISTS courses_org_id_idx ON public.courses (org_id);
CREATE INDEX IF NOT EXISTS courses_owner_id_idx ON public.courses (owner_id);

-- ============================================
-- 3. PATHS - Ajouter colonnes manquantes
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
  
  -- Owner ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paths' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.paths ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis creator_id si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'paths' AND column_name = 'creator_id'
    ) THEN
      UPDATE public.paths
      SET owner_id = creator_id
      WHERE owner_id IS NULL AND creator_id IS NOT NULL;
    END IF;
  END IF;
  
  -- S'assurer que creator_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'paths' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE public.paths ADD COLUMN creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis owner_id si existe maintenant
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'paths' AND column_name = 'owner_id'
    ) THEN
      UPDATE public.paths
      SET creator_id = owner_id
      WHERE creator_id IS NULL AND owner_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Indexes pour paths
CREATE INDEX IF NOT EXISTS paths_org_id_idx ON public.paths (org_id);
CREATE INDEX IF NOT EXISTS paths_owner_id_idx ON public.paths (owner_id);

-- ============================================
-- 4. RESOURCES - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Org ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- Created by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Owner ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis created_by si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'created_by'
    ) THEN
      UPDATE public.resources
      SET owner_id = created_by
      WHERE owner_id IS NULL AND created_by IS NOT NULL;
    END IF;
  END IF;
  
  -- Kind (ENUM resource_kind si n'existe pas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'kind'
  ) THEN
    -- Créer l'ENUM si nécessaire
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_kind') THEN
        CREATE TYPE resource_kind AS ENUM ('document', 'video', 'audio', 'link', 'image', 'other');
      END IF;
    END $$;
    
    ALTER TABLE public.resources ADD COLUMN kind resource_kind;
  END IF;
  
  -- Published (boolean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'published'
  ) THEN
    ALTER TABLE public.resources ADD COLUMN published boolean DEFAULT false;
  END IF;
  
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
  
  -- Status (si utilisé au lieu de published)
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

-- Indexes pour resources
CREATE INDEX IF NOT EXISTS resources_org_id_idx ON public.resources (org_id);
CREATE INDEX IF NOT EXISTS resources_created_by_idx ON public.resources (created_by);
CREATE INDEX IF NOT EXISTS resources_published_idx ON public.resources (published);

-- ============================================
-- 5. TESTS - Ajouter colonnes manquantes
-- ============================================
DO $$
BEGIN
  -- Org ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- Creator ID
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
  
  -- Owner ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.tests ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    
    -- Copier depuis creator_id si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'creator_id'
    ) THEN
      UPDATE public.tests
      SET owner_id = creator_id
      WHERE owner_id IS NULL AND creator_id IS NOT NULL;
    END IF;
  END IF;
  
  -- Published (boolean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'published'
  ) THEN
    -- Si status existe, mapper draft -> false, published -> true
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'status'
    ) THEN
      ALTER TABLE public.tests ADD COLUMN published boolean;
      UPDATE public.tests SET published = (status = 'published');
    ELSE
      ALTER TABLE public.tests ADD COLUMN published boolean DEFAULT false;
    END IF;
  END IF;
END $$;

-- Indexes pour tests
CREATE INDEX IF NOT EXISTS tests_org_id_idx ON public.tests (org_id);
CREATE INDEX IF NOT EXISTS tests_creator_id_idx ON public.tests (creator_id);
CREATE INDEX IF NOT EXISTS tests_published_idx ON public.tests (published);

-- ============================================
-- 6. ENROLLMENTS - Corriger learner_id/user_id
-- ============================================
DO $$
BEGIN
  -- Si user_id existe mais pas learner_id, créer learner_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'learner_id'
  ) THEN
    ALTER TABLE public.enrollments ADD COLUMN learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Copier les données
    UPDATE public.enrollments SET learner_id = user_id WHERE learner_id IS NULL;
    
    -- Rendre learner_id NOT NULL si possible
    ALTER TABLE public.enrollments ALTER COLUMN learner_id SET NOT NULL;
  END IF;
  
  -- Si les deux existent, garder learner_id et supprimer user_id (ou les garder en sync)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'learner_id'
  ) THEN
    -- S'assurer que learner_id est synchronisé avec user_id
    UPDATE public.enrollments 
    SET learner_id = user_id 
    WHERE learner_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 7. CRÉER TABLES MANQUANTES - ORGANIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter logo si la table existe déjà mais sans cette colonne
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organizations'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'logo'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN logo text;
    RAISE NOTICE 'Colonne logo ajoutée à la table organizations';
  END IF;
END $$;

-- ============================================
-- 8. CRÉER TABLES MANQUANTES - ORG_MEMBERSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'instructor', 'learner', 'tutor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_memberships_user_id_idx ON public.org_memberships (user_id);
CREATE INDEX IF NOT EXISTS org_memberships_org_id_idx ON public.org_memberships (org_id);
CREATE INDEX IF NOT EXISTS org_memberships_user_org_idx ON public.org_memberships (user_id, org_id);

-- ============================================
-- 9. CRÉER TABLES MANQUANTES - GROUPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS groups_org_id_idx ON public.groups (org_id);

-- ============================================
-- 10. CRÉER TABLES MANQUANTES - GROUP_MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members (group_id);

-- ============================================
-- 11. CRÉER TABLES MANQUANTES - CONTENT_ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('course', 'path', 'resource', 'test')),
  content_id uuid NOT NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (learner_id IS NOT NULL AND group_id IS NULL) OR
    (learner_id IS NULL AND group_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS content_assignments_learner_id_idx ON public.content_assignments (learner_id);
CREATE INDEX IF NOT EXISTS content_assignments_group_id_idx ON public.content_assignments (group_id);
CREATE INDEX IF NOT EXISTS content_assignments_content_idx ON public.content_assignments (content_type, content_id);

-- ============================================
-- 12. CRÉER TABLES MANQUANTES - ANALYTICS
-- ============================================

-- Login events
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_idx ON public.login_events (user_id);
CREATE INDEX IF NOT EXISTS login_events_created_at_idx ON public.login_events (created_at);

-- Learning sessions
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

CREATE INDEX IF NOT EXISTS learning_sessions_user_id_idx ON public.learning_sessions (user_id);
CREATE INDEX IF NOT EXISTS learning_sessions_created_at_idx ON public.learning_sessions (created_at);

-- Course progress
CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS course_progress_user_id_idx ON public.course_progress (user_id);
CREATE INDEX IF NOT EXISTS course_progress_course_id_idx ON public.course_progress (course_id);

-- Path progress
CREATE TABLE IF NOT EXISTS public.path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES public.paths(id) ON DELETE CASCADE,
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

CREATE INDEX IF NOT EXISTS path_progress_user_id_idx ON public.path_progress (user_id);
CREATE INDEX IF NOT EXISTS path_progress_path_id_idx ON public.path_progress (path_id);

-- Resource views
CREATE TABLE IF NOT EXISTS public.resource_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_views_user_id_idx ON public.resource_views (user_id);
CREATE INDEX IF NOT EXISTS resource_views_resource_id_idx ON public.resource_views (resource_id);

-- Test attempts
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  score integer,
  max_score integer,
  passed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_attempts_user_id_idx ON public.test_attempts (user_id);
CREATE INDEX IF NOT EXISTS test_attempts_test_id_idx ON public.test_attempts (test_id);

-- ============================================
-- 13. CRÉER TABLES MANQUANTES - PATH RELATIONS
-- ============================================

-- Path courses
CREATE TABLE IF NOT EXISTS public.path_courses (
  path_id uuid NOT NULL REFERENCES public.paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, course_id)
);

CREATE INDEX IF NOT EXISTS path_courses_path_id_idx ON public.path_courses (path_id);

-- Path tests
CREATE TABLE IF NOT EXISTS public.path_tests (
  path_id uuid NOT NULL REFERENCES public.paths(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, test_id)
);

CREATE INDEX IF NOT EXISTS path_tests_path_id_idx ON public.path_tests (path_id);

-- Path resources (déjà créé peut-être, vérifier)
CREATE TABLE IF NOT EXISTS public.path_resources (
  path_id uuid NOT NULL REFERENCES public.paths(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, resource_id)
);

CREATE INDEX IF NOT EXISTS path_resources_path_id_idx ON public.path_resources (path_id);

-- ============================================
-- 14. CRÉER TABLES MANQUANTES - DRIVE
-- ============================================

-- Drive folders
CREATE TABLE IF NOT EXISTS public.drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.drive_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_folders_user_id_idx ON public.drive_folders (user_id);
CREATE INDEX IF NOT EXISTS drive_folders_parent_id_idx ON public.drive_folders (parent_id);

-- Drive documents
CREATE TABLE IF NOT EXISTS public.drive_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.drive_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  url text,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_documents_user_id_idx ON public.drive_documents (user_id);
CREATE INDEX IF NOT EXISTS drive_documents_folder_id_idx ON public.drive_documents (folder_id);

-- ============================================
-- 15. SUPER ADMINS (si pas déjà créé)
-- ============================================
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS super_admins_user_id_idx ON public.super_admins (user_id);

-- ============================================
-- 16. RLS POLICIES DE BASE (si manquantes)
-- ============================================
-- Note: Les RLS policies détaillées sont dans d'autres scripts
-- On active juste RLS si nécessaire

DO $$
BEGIN
  -- Organizations
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'organizations') THEN
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Org memberships
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'org_memberships') THEN
    ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Groups
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'groups') THEN
    ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Group members
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'group_members') THEN
    ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Content assignments
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'content_assignments') THEN
    ALTER TABLE public.content_assignments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Analytics tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_events') 
     AND NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'login_events') THEN
    ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_sessions')
     AND NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'learning_sessions') THEN
    ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_progress')
     AND NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'course_progress') THEN
    ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'path_progress')
     AND NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'path_progress') THEN
    ALTER TABLE public.path_progress ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

COMMIT;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION TERMINÉE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Toutes les tables et colonnes manquantes ont été créées/ajoutées.';
  RAISE NOTICE 'Pensez à exécuter les scripts RLS pour configurer les policies.';
END $$;

