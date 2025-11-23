-- Table pour les articles de blog
-- Cette table stocke les articles de blog de Jessica Contentin

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu de l'article
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  
  -- Images
  cover_image_url TEXT,
  
  -- Métadonnées
  author TEXT DEFAULT 'Jessica Contentin',
  published_at TIMESTAMPTZ,
  reading_time INTEGER, -- Temps de lecture estimé en minutes
  
  -- Statut
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Relations
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pour améliorer les performances
  CONSTRAINT unique_slug UNIQUE(slug)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_creator ON blog_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = true;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- RLS (Row Level Security) - Politique pour permettre la lecture publique des articles publiés
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les articles publiés
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- Politique : Seul le créateur peut modifier ses articles
CREATE POLICY "Creators can manage their own blog posts"
  ON blog_posts
  FOR ALL
  USING (auth.uid() = creator_id);

-- Commentaires pour la documentation
COMMENT ON TABLE blog_posts IS 'Table pour stocker les articles de blog de Jessica Contentin';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly version du titre (ex: "mon-premier-article")';
COMMENT ON COLUMN blog_posts.reading_time IS 'Temps de lecture estimé en minutes';
COMMENT ON COLUMN blog_posts.is_featured IS 'Article mis en avant sur la page d''accueil du blog';

