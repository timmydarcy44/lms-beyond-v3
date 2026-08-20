-- Idempotent: aligne organization_features + branding org + storage org-logos
-- À exécuter dans le SQL Editor Supabase (ou via migrations).

BEGIN;

-- ─── organizations.logo_url ─────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_color text;

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

-- ─── organization_features (créer ou compléter) ─────────────────────
CREATE TABLE IF NOT EXISTS public.organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, feature_key)
);

ALTER TABLE public.organization_features
  ADD COLUMN IF NOT EXISTS enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enabled_by UUID,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- FK enabled_by (si absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'organization_features'
      AND constraint_name = 'organization_features_enabled_by_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.organization_features
        ADD CONSTRAINT organization_features_enabled_by_fkey
        FOREIGN KEY (enabled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'FK enabled_by skipped: %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS organization_features_org_id_idx
  ON public.organization_features (org_id);
CREATE INDEX IF NOT EXISTS organization_features_feature_key_idx
  ON public.organization_features (feature_key);
CREATE INDEX IF NOT EXISTS organization_features_enabled_idx
  ON public.organization_features (org_id, is_enabled)
  WHERE is_enabled = true;

CREATE OR REPLACE FUNCTION update_organization_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organization_features_updated_at ON public.organization_features;
CREATE TRIGGER organization_features_updated_at
  BEFORE UPDATE ON public.organization_features
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_features_updated_at();

ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their organization features" ON public.organization_features;
CREATE POLICY "Admins can view their organization features"
  ON public.organization_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.org_id = organization_features.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage all features" ON public.organization_features;
CREATE POLICY "Super admins can manage all features"
  ON public.organization_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid()
        AND sa.is_active = true
    )
  );

DROP FUNCTION IF EXISTS public.has_feature(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.has_feature(
  p_org_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_features
    WHERE org_id = p_org_id
      AND feature_key = p_feature_key
      AND is_enabled = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_organization_features(UUID);
CREATE OR REPLACE FUNCTION public.get_organization_features(
  p_org_id UUID
)
RETURNS TABLE (
  feature_key TEXT,
  is_enabled BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    of.feature_key,
    of.is_enabled,
    of.expires_at
  FROM public.organization_features of
  WHERE of.org_id = p_org_id
    AND of.is_enabled = true
    AND (of.expires_at IS NULL OR of.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Storage: buckets + policies org-logos ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = COALESCE(storage.buckets.file_size_limit, 5242880),
    allowed_mime_types = COALESCE(
      storage.buckets.allowed_mime_types,
      ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
    );

-- Lecture publique logos org
DROP POLICY IF EXISTS "Org logos are publicly accessible" ON storage.objects;
CREATE POLICY "Org logos are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('avatars', 'Avatar')
  AND (storage.foldername(name))[1] = 'org-logos'
);

-- Upload/update/delete org-logos pour utilisateurs authentifiés (super-admin API = service role bypass)
DROP POLICY IF EXISTS "Authenticated users can upload org logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('avatars', 'Avatar')
  AND (storage.foldername(name))[1] = 'org-logos'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update org logos" ON storage.objects;
CREATE POLICY "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('avatars', 'Avatar')
  AND (storage.foldername(name))[1] = 'org-logos'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete org logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete org logos"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('avatars', 'Avatar')
  AND (storage.foldername(name))[1] = 'org-logos'
  AND auth.role() = 'authenticated'
);

COMMIT;
