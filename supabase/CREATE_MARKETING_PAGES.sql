-- Créer les pages marketing dans le CMS
-- Pages: lms, catalogue, fonctionnalites, pourquoi-beyond

-- S'assurer que la colonne content_type existe
ALTER TABLE public.cms_pages 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'grid' CHECK (content_type IN ('legacy', 'grid'));

-- Page "Pourquoi Beyond"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'pourquoi-beyond',
  'Pourquoi choisir Beyond',
  'Pourquoi choisir Beyond - Une approche humaine de l''apprentissage',
  'Découvrez pourquoi Beyond révolutionne l''apprentissage en plaçant le bien-être et l''humain au cœur de la formation.',
  'Pourquoi choisir Beyond',
  'Une approche qui place l''humain au centre',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Page "La plateforme LMS"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'lms',
  'La plateforme Beyond',
  'La plateforme Beyond - LMS nouvelle génération',
  'Découvrez notre plateforme LMS pensée pour le cerveau humain, avec des fonctionnalités innovantes et une approche centrée sur le bien-être.',
  'La plateforme Beyond',
  'Un LMS pensé pour le cerveau humain',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Page "Catalogue"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'catalogue',
  'Catalogue de formations',
  'Catalogue de formations Beyond - Formations en ligne',
  'Explorez notre catalogue de formations en ligne, conçues pour développer vos compétences et votre bien-être.',
  'Catalogue de formations',
  'Développez vos compétences à votre rythme',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Page "Fonctionnalités"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'fonctionnalites',
  'Fonctionnalités Beyond',
  'Fonctionnalités Beyond - Innovation et bien-être',
  'Découvrez toutes les fonctionnalités innovantes de Beyond : Beyond Care, Beyond Play, Pomodoro, Mode Focus et bien plus.',
  'Fonctionnalités Beyond',
  'Innovation au service de l''apprentissage',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Pages pour les sections du menu déroulant

-- Page "Suivi de santé mentale"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'suivi-sante-mentale',
  'Suivi de santé mentale - Beyond Care',
  'Suivi de santé mentale - Beyond Care | Beyond LMS',
  'Découvrez comment Beyond Care permet de suivre l''équilibre mental grâce à des questionnaires intelligents, l''analyse des tendances et des alertes préventives.',
  'Suivi de santé mentale',
  'Beyond Care : votre équilibre mental au cœur de l''apprentissage',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Page "Apprentissage immersif"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'apprentissage-immersif',
  'Apprentissage immersif - Beyond Play',
  'Apprentissage immersif - Beyond Play | Beyond LMS',
  'Plongez dans l''apprentissage immersif avec Beyond Play : simulations réalistes, scénarios interactifs, feedback en temps réel et gamification avancée.',
  'Apprentissage immersif',
  'Beyond Play : apprendre par immersion, émotions et scénarios',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

-- Page "Productivité"
INSERT INTO cms_pages (slug, title, meta_title, meta_description, h1, h2, content_type, is_published, created_at, updated_at)
VALUES (
  'productivite',
  'Productivité - Méthodes d''apprentissage',
  'Productivité - Méthodes d''apprentissage | Beyond LMS',
  'Optimisez votre productivité avec la méthode Pomodoro, le mode Focus, l''accessibilité DYS et la neuro-adaptation.',
  'Productivité',
  'Des outils pour apprendre efficacement et dans le calme',
  'grid',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  h1 = EXCLUDED.h1,
  h2 = EXCLUDED.h2,
  content_type = EXCLUDED.content_type,
  updated_at = NOW();

