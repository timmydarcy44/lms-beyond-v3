-- Étendre resources_type_check pour html et pdf (ressources formateur)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'resources'
      AND constraint_name = 'resources_type_check'
  ) THEN
    ALTER TABLE public.resources DROP CONSTRAINT resources_type_check;
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_type_check
      CHECK (type IN ('guide', 'fiche', 'audio', 'video', 'autre', 'html', 'pdf'));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'resources'
      AND constraint_name = 'resources_resource_type_check'
  ) THEN
    ALTER TABLE public.resources DROP CONSTRAINT resources_resource_type_check;
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_resource_type_check
      CHECK (resource_type IN ('guide', 'fiche', 'audio', 'video', 'autre', 'html', 'pdf'));
  END IF;
END $$;
