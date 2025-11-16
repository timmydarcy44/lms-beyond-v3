-- ============================================
-- VÉRIFIER LA STRUCTURE DE notifications
-- ============================================

-- 1. Vérifier si la table existe
SELECT 
  json_build_object(
    'type', 'TABLE_EXISTS',
    'exists', EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'notifications'
    )
  ) as result;

-- 2. Lister toutes les colonnes de notifications
SELECT 
  json_build_object(
    'type', 'COLUMNS',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable,
          'column_default', column_default
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications';




