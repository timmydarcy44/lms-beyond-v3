-- ============================================
-- Script pour ajouter la colonne updated_at à la table paths
-- ============================================

DO $$
BEGIN
  -- Ajouter updated_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'paths' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.paths 
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
    
    RAISE NOTICE 'Colonne updated_at ajoutée à la table paths.';
  ELSE
    RAISE NOTICE 'La colonne updated_at existe déjà dans la table paths.';
  END IF;
END $$;

-- Si la fonction n'existe pas, la créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Fonction update_updated_at_column créée.';
  END IF;
END $$;

-- Créer un trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_paths_updated_at ON public.paths;

CREATE TRIGGER update_paths_updated_at
  BEFORE UPDATE ON public.paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✓ Script terminé. La colonne updated_at est maintenant disponible et sera mise à jour automatiquement.';
END $$;

