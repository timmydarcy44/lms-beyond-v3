-- Mise à jour de la structure CMS pour supporter les grilles/sections
-- Cette migration convertit le contenu JSONB pour supporter Sections > Colonnes > Blocs

-- Ajouter une colonne pour le type de contenu (legacy ou grid)
ALTER TABLE public.cms_pages 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'legacy' CHECK (content_type IN ('legacy', 'grid'));

-- Mettre à jour les pages existantes
UPDATE public.cms_pages 
SET content_type = 'legacy' 
WHERE content_type IS NULL;

-- La colonne content reste en JSONB pour supporter les deux formats
-- Format legacy: Block[]
-- Format grid: Section[]


