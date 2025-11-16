-- ============================================
-- RENDRE consigne_id NULLABLE DANS drive_folders
-- ============================================

-- Vérifier si consigne_id existe et est NOT NULL
DO $$
BEGIN
  -- Vérifier si la colonne existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'drive_folders'
      AND column_name = 'consigne_id'
  ) THEN
    -- Vérifier si elle est NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drive_folders'
        AND column_name = 'consigne_id'
        AND is_nullable = 'NO'
    ) THEN
      -- Rendre la colonne nullable
      ALTER TABLE public.drive_folders
        ALTER COLUMN consigne_id DROP NOT NULL;
      
      RAISE NOTICE 'Column "consigne_id" in drive_folders is now nullable';
    ELSE
      RAISE NOTICE 'Column "consigne_id" in drive_folders is already nullable';
    END IF;
  ELSE
    RAISE NOTICE 'Column "consigne_id" does not exist in drive_folders';
  END IF;
END $$;



