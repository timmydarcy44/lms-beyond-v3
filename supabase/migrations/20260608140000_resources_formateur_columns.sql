-- Colonnes manquantes sur l'instance Supabase (publication, HTML, propriété formateur)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS html_content text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.resources SET status = 'draft' WHERE status IS NULL;
UPDATE public.resources SET published = false WHERE published IS NULL;

-- Backfill propriété depuis creator_id existant
UPDATE public.resources
SET created_by = creator_id, owner_id = creator_id
WHERE creator_id IS NOT NULL
  AND (created_by IS NULL OR owner_id IS NULL);

CREATE INDEX IF NOT EXISTS resources_created_by_idx ON public.resources (created_by);
CREATE INDEX IF NOT EXISTS resources_published_idx ON public.resources (published);
CREATE INDEX IF NOT EXISTS resources_status_idx ON public.resources (status);
