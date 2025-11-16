-- ============================================
-- VÉRIFIER LA STRUCTURE DE drive_consigne
-- ============================================

-- 1. Vérifier si drive_consigne est une table, une vue, ou un alias
SELECT 
  'TABLE_TYPE' as "Type",
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND (table_name = 'drive_consigne' OR table_name = 'drive_documents')
ORDER BY table_name, table_type;

-- 2. Si drive_consigne est une vue, voir sa définition
SELECT 
  'VIEW_DEFINITION' as "Type",
  table_name as "view_name",
  view_definition
FROM information_schema.views
WHERE table_schema = 'public' 
  AND table_name = 'drive_consigne';

-- 3. Vérifier s'il y a des synonymes ou alias
SELECT 
  'ALIASES' as "Type",
  schemaname,
  tablename,
  attname as "alias_name"
FROM pg_attribute
WHERE attrelid = 'public.drive_consigne'::regclass
  AND attnum > 0
  AND NOT attisdropped;

-- 4. Vérifier les colonnes réelles de drive_consigne (si c'est une table)
SELECT 
  'DRIVE_CONSIGNE_COLUMNS' as "Type",
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_consigne'
ORDER BY ordinal_position;

-- 5. Vérifier les colonnes réelles de drive_documents
SELECT 
  'DRIVE_DOCUMENTS_COLUMNS' as "Type",
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_documents'
ORDER BY ordinal_position;

-- 6. Vérifier toutes les politiques RLS sur drive_consigne (y compris celles qui pourraient causer récursion)
SELECT 
  'ALL_POLICIES' as "Type",
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('drive_consigne', 'drive_documents')
ORDER BY tablename, policyname;




