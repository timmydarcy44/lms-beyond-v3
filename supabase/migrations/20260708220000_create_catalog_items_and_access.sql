-- Tables catalogue B2B/B2C (manquantes sur certains projets Supabase Jessica/Beyond)
-- Requis pour le CRM Jessica, assignation formations et mon-compte.

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  item_type TEXT NOT NULL CHECK (item_type IN ('module', 'ressource', 'test', 'parcours')),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  category TEXT,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  target_audience TEXT DEFAULT 'all',
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  stripe_checkout_url TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_content_type
  ON public.catalog_items(content_id, item_type);

CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_active
  ON public.catalog_items(creator_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_catalog_items_created_by_active
  ON public.catalog_items(created_by, is_active)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.catalog_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_status TEXT NOT NULL DEFAULT 'manually_granted'
    CHECK (access_status IN ('purchased', 'manually_granted', 'free', 'pending_payment', 'revoked')),
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  grant_reason TEXT,
  purchase_amount NUMERIC(10, 2),
  purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_access_org_or_user_check CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL)
    OR (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_user_item_unique
  ON public.catalog_access(user_id, catalog_item_id)
  WHERE user_id IS NOT NULL AND organization_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS catalog_access_org_item_unique
  ON public.catalog_access(organization_id, catalog_item_id)
  WHERE organization_id IS NOT NULL AND user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_access_user_item
  ON public.catalog_access(user_id, catalog_item_id, access_status);

CREATE INDEX IF NOT EXISTS idx_catalog_access_org_item
  ON public.catalog_access(organization_id, catalog_item_id, access_status)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_items_public_read ON public.catalog_items;
CREATE POLICY catalog_items_public_read ON public.catalog_items
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS catalog_items_service_all ON public.catalog_items;
CREATE POLICY catalog_items_service_all ON public.catalog_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS catalog_access_select_user ON public.catalog_access;
CREATE POLICY catalog_access_select_user ON public.catalog_access
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS catalog_access_service_all ON public.catalog_access;
CREATE POLICY catalog_access_service_all ON public.catalog_access
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.catalog_items IS 'Vitrine catalogue LMS (modules, ressources, tests, parcours)';
COMMENT ON TABLE public.catalog_access IS 'Droits d''accès B2B (org) ou B2C (user) sur un catalog_item';
