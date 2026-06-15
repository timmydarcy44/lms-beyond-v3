-- Colonne description manquante sur certaines instances (PGRST204 à la création)
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.resources.description IS 'Résumé pédagogique affiché dans le catalogue';

-- Valeur html pour les ressources intégrées (complète 20260607120000_resources_html_content.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_kind') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'resource_kind' AND e.enumlabel = 'html'
    ) THEN
      ALTER TYPE resource_kind ADD VALUE 'html';
    END IF;
  END IF;
END $$;
