-- =====================================================
-- Script d'optimisation Disk IO - Création d'index
-- =====================================================
-- Ce script crée les index nécessaires pour réduire
-- la consommation de Disk IO sur Supabase
-- =====================================================

-- Index pour catalog_items (utilisé très fréquemment)
-- Utiliser created_by qui existe toujours (creator_id peut ne pas exister)
CREATE INDEX IF NOT EXISTS idx_catalog_items_created_by_active 
ON catalog_items(created_by, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_catalog_items_content_type 
ON catalog_items(item_type, is_active);

CREATE INDEX IF NOT EXISTS idx_catalog_items_created_by_type 
ON catalog_items(created_by, item_type, is_active);

-- Index sur creator_id si la colonne existe (optionnel)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'creator_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_active 
    ON catalog_items(creator_id, is_active) 
    WHERE is_active = true;
    
    CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_type 
    ON catalog_items(creator_id, item_type, is_active);
  END IF;
END $$;

-- Index pour catalog_access (vérifications d'accès fréquentes)
CREATE INDEX IF NOT EXISTS idx_catalog_access_user_item 
ON catalog_access(user_id, catalog_item_id, access_status);

CREATE INDEX IF NOT EXISTS idx_catalog_access_org_item 
ON catalog_access(organization_id, catalog_item_id, access_status)
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_access_item_status 
ON catalog_access(catalog_item_id, access_status);

-- Index pour profiles (recherche par email fréquente)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Note: profiles n'a pas de colonne org_id directement
-- Les organisations sont gérées via org_memberships
-- Index pour org_memberships (recherche par user_id)
CREATE INDEX IF NOT EXISTS idx_org_memberships_user 
ON org_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org 
ON org_memberships(org_id);

-- Index pour resources (recherche par creator)
-- Vérifier si creator_id existe avant de créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'creator_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_resources_creator 
    ON resources(creator_id);
  END IF;
END $$;

-- Index pour resources category (vérifier si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_resources_category 
    ON resources(category)
    WHERE category IS NOT NULL;
  END IF;
END $$;

-- Index pour tests (recherche par creator)
-- Vérifier si creator_id existe avant de créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tests' AND column_name = 'creator_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tests_creator 
    ON tests(creator_id);
  END IF;
END $$;

-- Index pour tests category (vérifier si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tests' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tests_category 
    ON tests(category)
    WHERE category IS NOT NULL;
  END IF;
END $$;

-- Index pour courses (recherche par creator)
-- Vérifier si creator_id existe avant de créer l'index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'creator_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_courses_creator 
    ON courses(creator_id);
  END IF;
END $$;

-- Index pour courses category (vérifier si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_courses_category 
    ON courses(category)
    WHERE category IS NOT NULL;
  END IF;
END $$;

-- Index pour beyond_connect (si utilisé)
CREATE INDEX IF NOT EXISTS idx_beyond_connect_skills_user 
ON beyond_connect_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_beyond_connect_experiences_user 
ON beyond_connect_experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_beyond_connect_education_user 
ON beyond_connect_education(user_id);

-- Index pour mental_health (si utilisé)
CREATE INDEX IF NOT EXISTS idx_mental_health_assessments_user 
ON mental_health_assessments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mental_health_questionnaires_org 
ON mental_health_questionnaires(org_id, is_active)
WHERE is_active = true;

-- Vérifier les index créés
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'catalog_items',
    'catalog_access',
    'profiles',
    'resources',
    'tests',
    'courses'
  )
ORDER BY tablename, indexname;

