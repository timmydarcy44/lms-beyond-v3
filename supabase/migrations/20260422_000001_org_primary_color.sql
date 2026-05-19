-- Add multi-tenant branding fields to organizations
BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_color text;

-- Backfill logo_url from legacy logo column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'logo'
  ) THEN
    UPDATE public.organizations
    SET logo_url = COALESCE(NULLIF(logo_url, ''), NULLIF(logo, ''))
    WHERE COALESCE(NULLIF(logo_url, ''), '') = '';
  END IF;
END $$;

COMMIT;

