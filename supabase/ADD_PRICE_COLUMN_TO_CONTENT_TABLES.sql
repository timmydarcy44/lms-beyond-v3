-- Ajouter la colonne price aux tables resources, tests et paths si elle n'existe pas

-- 1. Ajouter price à resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE resources ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
    COMMENT ON COLUMN resources.price IS 'Prix de la ressource en euros';
  END IF;
END $$;

-- 2. Ajouter price à tests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tests' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE tests ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
    COMMENT ON COLUMN tests.price IS 'Prix du test en euros';
  END IF;
END $$;

-- 3. Ajouter price à paths
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'paths' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE paths ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
    COMMENT ON COLUMN paths.price IS 'Prix du parcours en euros';
  END IF;
END $$;

-- 4. Ajouter price à courses (modules) si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE courses ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
    COMMENT ON COLUMN courses.price IS 'Prix du module/cours en euros';
  END IF;
END $$;









