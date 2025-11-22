-- Table pour stocker les pages du site
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  h1 TEXT,
  h2 TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb, -- Structure drag and drop
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON public.cms_pages(is_published);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_cms_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cms_pages_updated_at ON public.cms_pages;
CREATE TRIGGER cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_pages_updated_at();

-- RLS Policies
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Seuls les super admins peuvent lire/écrire
CREATE POLICY "Super admins can manage CMS pages"
  ON public.cms_pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Table pour stocker les médias (images, vidéos) du CMS
CREATE TABLE IF NOT EXISTS public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' ou 'video'
  mime_type TEXT,
  file_size BIGINT,
  width INTEGER, -- Pour les images
  height INTEGER, -- Pour les images
  duration INTEGER, -- Pour les vidéos (en secondes)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cms_media_type ON public.cms_media(file_type);
CREATE INDEX IF NOT EXISTS idx_cms_media_created_by ON public.cms_media(created_by);

-- RLS Policies pour les médias
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage CMS media"
  ON public.cms_media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );







