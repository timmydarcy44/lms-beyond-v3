-- Remplacer "Conseil" par "Bac+2" dans toutes les catégories
-- =========================================================================

-- 1. Mettre à jour catalog_items (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'category'
  ) THEN
    UPDATE catalog_items 
    SET category = 'Bac+2'
    WHERE category = 'Conseil';
    RAISE NOTICE 'catalog_items mis à jour';
  ELSE
    RAISE NOTICE 'catalog_items: colonne category n''existe pas';
  END IF;
END $$;

-- 2. Mettre à jour courses (builder_snapshot) - c'est la source principale
UPDATE courses
SET builder_snapshot = jsonb_set(
  builder_snapshot::jsonb,
  '{general,category}',
  '"Bac+2"'
)
WHERE builder_snapshot::jsonb->'general'->>'category' = 'Conseil';

-- 3. Mettre à jour courses.category (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'category'
  ) THEN
    UPDATE courses
    SET category = 'Bac+2'
    WHERE category = 'Conseil';
    RAISE NOTICE 'courses.category mis à jour';
  ELSE
    RAISE NOTICE 'courses: colonne category n''existe pas';
  END IF;
END $$;

-- 4. Mettre à jour tests (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tests' AND column_name = 'category'
  ) THEN
    UPDATE tests
    SET category = 'Bac+2'
    WHERE category = 'Conseil';
    RAISE NOTICE 'tests mis à jour';
  ELSE
    RAISE NOTICE 'tests: colonne category n''existe pas';
  END IF;
END $$;

-- 5. Mettre à jour resources (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'category'
  ) THEN
    UPDATE resources
    SET category = 'Bac+2'
    WHERE category = 'Conseil';
    RAISE NOTICE 'resources mis à jour';
  ELSE
    RAISE NOTICE 'resources: colonne category n''existe pas';
  END IF;
END $$;

-- 6. Vérifier les résultats
DO $$
DECLARE
  catalog_count INTEGER := 0;
  courses_snapshot_count INTEGER := 0;
  courses_column_count INTEGER := 0;
  tests_count INTEGER := 0;
  resources_count INTEGER := 0;
BEGIN
  -- Vérifier catalog_items
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_items' AND column_name = 'category'
  ) THEN
    SELECT COUNT(*) INTO catalog_count
    FROM catalog_items
    WHERE category = 'Bac+2';
  END IF;
  
  -- Vérifier courses (builder_snapshot)
  SELECT COUNT(*) INTO courses_snapshot_count
  FROM courses
  WHERE builder_snapshot::jsonb->'general'->>'category' = 'Bac+2';
  
  -- Vérifier courses (category column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'category'
  ) THEN
    SELECT COUNT(*) INTO courses_column_count
    FROM courses
    WHERE category = 'Bac+2';
  END IF;
  
  -- Vérifier tests
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tests' AND column_name = 'category'
  ) THEN
    SELECT COUNT(*) INTO tests_count
    FROM tests
    WHERE category = 'Bac+2';
  END IF;
  
  -- Vérifier resources
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'category'
  ) THEN
    SELECT COUNT(*) INTO resources_count
    FROM resources
    WHERE category = 'Bac+2';
  END IF;
  
  -- Afficher les résultats
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Résultats de la migration "Conseil" -> "Bac+2"';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CATALOG ITEMS: %', catalog_count;
  RAISE NOTICE 'COURSES (builder_snapshot): %', courses_snapshot_count;
  RAISE NOTICE 'COURSES (category column): %', courses_column_count;
  RAISE NOTICE 'TESTS: %', tests_count;
  RAISE NOTICE 'RESOURCES: %', resources_count;
  RAISE NOTICE '========================================';
END $$;

