-- ============================================
-- AJOUTER LA COLONNE user_id À notifications SI MANQUANTE
-- ============================================

-- 1. Vérifier la structure actuelle
SELECT 
  json_build_object(
    'type', 'CURRENT_COLUMNS',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications';

-- 2. Ajouter la colonne user_id si elle n'existe pas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.notifications 
      ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
      
      -- Si la table a des données, on ne peut pas rendre NOT NULL sans valeur par défaut
      -- Pour l'instant, on laisse nullable ou on met une valeur par défaut
      RAISE NOTICE 'Colonne user_id ajoutée à notifications';
    ELSE
      RAISE NOTICE 'Colonne user_id existe déjà';
    END IF;
  ELSE
    RAISE NOTICE 'Table notifications n''existe pas';
  END IF;
END $$;

-- 3. Vérifier après ajout
SELECT 
  json_build_object(
    'type', 'AFTER_ADD',
    'columns', COALESCE(
      json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable
        )
        ORDER BY ordinal_position
      ),
      '[]'::json
    )
  ) as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications';




