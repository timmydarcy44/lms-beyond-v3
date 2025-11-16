-- ============================================
-- VÉRIFICATION : Table formations vs courses
-- ============================================
-- Ce script vérifie si la table "formations" est utilisée ou obsolète
-- et compare avec la table "courses" qui est le système actuel

-- ============================================
-- 1. VÉRIFIER L'EXISTENCE DES TABLES
-- ============================================
SELECT 
  'TABLE_EXISTENCE' as "Type",
  table_name as "Table",
  CASE 
    WHEN table_name = 'courses' THEN '✓ Table principale utilisée'
    WHEN table_name = 'formations' THEN '⚠ Table ancienne (potentiellement obsolète)'
    ELSE '?'
  END as "Statut"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'formations')
ORDER BY table_name;

-- ============================================
-- 2. COMPARER LA STRUCTURE DES COLONNES
-- ============================================
-- Colonnes de la table courses
SELECT 
  'COURSES_COLUMNS' as "Type",
  column_name as "Colonne",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'courses'
ORDER BY ordinal_position;

-- Colonnes de la table formations (si elle existe)
SELECT 
  'FORMATIONS_COLUMNS' as "Type",
  column_name as "Colonne",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'formations'
ORDER BY ordinal_position;

-- ============================================
-- 3. COMPTER LES ENREGISTREMENTS
-- ============================================
SELECT 
  'RECORDS_COUNT' as "Type",
  'courses' as "Table",
  COUNT(*) as "Nombre d'enregistrements"
FROM courses;

SELECT 
  'RECORDS_COUNT' as "Type",
  'formations' as "Table",
  COUNT(*) as "Nombre d'enregistrements"
FROM formations
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'formations'
);

-- ============================================
-- 4. VÉRIFIER LES COLONNES CRITIQUES
-- ============================================
-- Vérifier si courses a creator_id/owner_id
SELECT 
  'COURSES_OWNERSHIP' as "Type",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'creator_id'
    ) THEN '✓ A creator_id'
    ELSE '❌ PAS de creator_id'
  END as "Creator_ID",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'owner_id'
    ) THEN '✓ A owner_id'
    ELSE '❌ PAS de owner_id'
    END as "Owner_ID"
FROM information_schema.tables
WHERE table_name = 'courses';

-- Vérifier si formations a creator_id/owner_id/author_id
SELECT 
  'FORMATIONS_OWNERSHIP' as "Type",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'formations' AND column_name = 'creator_id'
    ) THEN '✓ A creator_id'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'formations' AND column_name = 'owner_id'
    ) THEN '✓ A owner_id'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'formations' AND column_name = 'author_id'
    ) THEN '✓ A author_id'
    ELSE '❌ PAS de colonne d ownership'
  END as "Colonne_Ownership"
FROM information_schema.tables
WHERE table_name = 'formations';

-- ============================================
-- 5. VÉRIFIER LES RÉFÉRENCES/RELATIONS
-- ============================================
-- Vérifier si d'autres tables référencent formations
SELECT 
  'FORMATIONS_REFERENCES' as "Type",
  tc.table_name as "Table_Referencante",
  kcu.column_name as "Colonne_FK",
  ccu.table_name as "Table_Referencee",
  CASE 
    WHEN ccu.table_name = 'formations' THEN '⚠ Référence à formations'
    ELSE 'OK'
  END as "Statut"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'formations';

-- Vérifier si d'autres tables référencent courses
SELECT 
  'COURSES_REFERENCES' as "Type",
  COUNT(*) as "Nombre_de_References"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'courses';

-- ============================================
-- 6. VÉRIFIER LES RLS POLICIES
-- ============================================
SELECT 
  'RLS_POLICIES_COURSES' as "Type",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'courses';

SELECT 
  'RLS_POLICIES_FORMATIONS' as "Type",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'formations';

-- ============================================
-- 7. RÉSUMÉ ET RECOMMANDATION
-- ============================================
DO $$
DECLARE
  courses_count INTEGER;
  formations_count INTEGER;
  formations_exists BOOLEAN;
  courses_has_creator BOOLEAN;
  formations_has_creator BOOLEAN;
BEGIN
  -- Compter les enregistrements
  SELECT COUNT(*) INTO courses_count FROM courses;
  
  formations_exists := EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'formations'
  );
  
  IF formations_exists THEN
    SELECT COUNT(*) INTO formations_count FROM formations;
  ELSE
    formations_count := 0;
  END IF;
  
  -- Vérifier les colonnes d'ownership
  courses_has_creator := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name IN ('creator_id', 'owner_id')
  );
  
  IF formations_exists THEN
    formations_has_creator := EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'formations' 
      AND column_name IN ('creator_id', 'owner_id', 'author_id')
    );
  ELSE
    formations_has_creator := FALSE;
  END IF;
  
  -- Afficher le résumé
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RÉSUMÉ : formations vs courses';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Table courses : % enregistrements', courses_count;
  RAISE NOTICE '  → Has creator/owner_id : %', courses_has_creator;
  IF formations_exists THEN
    RAISE NOTICE 'Table formations : % enregistrements', formations_count;
    RAISE NOTICE '  → Has creator/owner/author_id : %', formations_has_creator;
  ELSE
    RAISE NOTICE 'Table formations : N''EXISTE PAS';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE 'RECOMMANDATION :';
  IF formations_exists AND formations_count > 0 THEN
    RAISE NOTICE '⚠ La table formations existe et contient des données';
    IF NOT formations_has_creator THEN
      RAISE NOTICE '❌ formations n''a PAS de colonne d''ownership → INUTILISABLE';
      RAISE NOTICE '→ Migrer les données de formations vers courses si nécessaire';
    ELSE
      RAISE NOTICE '✓ formations a une colonne d''ownership → Potentiellement utilisable';
    END IF;
  ELSIF formations_exists AND formations_count = 0 THEN
    RAISE NOTICE '⚠ La table formations existe mais est VIDE';
    RAISE NOTICE '→ Peut être supprimée ou archivée';
  ELSIF NOT formations_exists THEN
    RAISE NOTICE '✓ La table formations n''existe pas → OK';
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE 'SYSTÈME ACTUEL :';
  RAISE NOTICE '→ Le code utilise UNIQUEMENT la table courses';
  RAISE NOTICE '→ formations est ignorée dans getFormateurAssignableContent()';
  RAISE NOTICE '→ Toutes les nouvelles formations vont dans courses';
END $$;



