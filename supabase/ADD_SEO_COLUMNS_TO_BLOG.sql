-- Ajouter les colonnes SEO à la table blog_posts

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT;

-- Commentaires pour la documentation
COMMENT ON COLUMN blog_posts.meta_title IS 'Titre optimisé pour les moteurs de recherche (50-60 caractères)';
COMMENT ON COLUMN blog_posts.meta_description IS 'Description optimisée pour les moteurs de recherche (150-160 caractères)';
COMMENT ON COLUMN blog_posts.cover_image_alt IS 'Texte alternatif pour l''image de couverture (accessibilité et SEO)';

