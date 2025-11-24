-- Tables pour Beyond Connect - CV numérique
-- Permet aux utilisateurs de gérer leurs expériences, diplômes, badges, résultats de tests, etc.

-- Table pour les expériences professionnelles
CREATE TABLE IF NOT EXISTS public.beyond_connect_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les diplômes et formations
CREATE TABLE IF NOT EXISTS public.beyond_connect_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  field_of_study TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les compétences (skills)
CREATE TABLE IF NOT EXISTS public.beyond_connect_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- ex: "technique", "soft skills", "langues", etc.
  level TEXT, -- ex: "débutant", "intermédiaire", "avancé", "expert"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Table pour les certifications
CREATE TABLE IF NOT EXISTS public.beyond_connect_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour lier les open badges (référence vers user_badges existante)
-- On utilisera une vue pour agréger les badges depuis user_badges

-- Table pour lier les résultats de tests (référence vers test_attempts existante)
-- On utilisera une vue pour agréger les résultats depuis test_attempts

-- Table pour les projets/portfolios
CREATE TABLE IF NOT EXISTS public.beyond_connect_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  start_date DATE,
  end_date DATE,
  technologies TEXT[], -- Array de technologies utilisées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les langues
CREATE TABLE IF NOT EXISTS public.beyond_connect_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL, -- ex: "A1", "A2", "B1", "B2", "C1", "C2", "Natif"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS beyond_connect_experiences_user_idx ON public.beyond_connect_experiences(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_education_user_idx ON public.beyond_connect_education(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_skills_user_idx ON public.beyond_connect_skills(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_certifications_user_idx ON public.beyond_connect_certifications(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_projects_user_idx ON public.beyond_connect_projects(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_languages_user_idx ON public.beyond_connect_languages(user_id);

-- RLS Policies
ALTER TABLE public.beyond_connect_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_languages ENABLE ROW LEVEL SECURITY;

-- Policies : les utilisateurs peuvent voir et modifier uniquement leurs propres données
DO $$
BEGIN
  -- Experiences
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_experiences' AND policyname = 'users_manage_own_experiences'
  ) THEN
    CREATE POLICY users_manage_own_experiences ON public.beyond_connect_experiences
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Education
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_education' AND policyname = 'users_manage_own_education'
  ) THEN
    CREATE POLICY users_manage_own_education ON public.beyond_connect_education
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Skills
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_skills' AND policyname = 'users_manage_own_skills'
  ) THEN
    CREATE POLICY users_manage_own_skills ON public.beyond_connect_skills
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Certifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_certifications' AND policyname = 'users_manage_own_certifications'
  ) THEN
    CREATE POLICY users_manage_own_certifications ON public.beyond_connect_certifications
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Projects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_projects' AND policyname = 'users_manage_own_projects'
  ) THEN
    CREATE POLICY users_manage_own_projects ON public.beyond_connect_projects
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Languages
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_languages' AND policyname = 'users_manage_own_languages'
  ) THEN
    CREATE POLICY users_manage_own_languages ON public.beyond_connect_languages
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Vue pour agréger les badges de l'utilisateur
CREATE OR REPLACE VIEW public.beyond_connect_user_badges AS
SELECT 
  ub.user_id,
  b.id as badge_id,
  b.code,
  b.label,
  b.description,
  ub.earned_at
FROM public.user_badges ub
JOIN public.badges b ON b.id = ub.badge_id;

-- Vue pour agréger les résultats de tests de l'utilisateur
CREATE OR REPLACE VIEW public.beyond_connect_test_results AS
SELECT 
  ta.user_id,
  ta.test_id,
  t.title as test_title,
  ta.score,
  ta.status,
  ta.started_at,
  ta.completed_at
FROM public.test_attempts ta
JOIN public.tests t ON t.id = ta.test_id
WHERE ta.status = 'passed' OR ta.status = 'completed';

-- Commentaires pour documentation
COMMENT ON TABLE public.beyond_connect_experiences IS 'Expériences professionnelles des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_education IS 'Formations et diplômes des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_skills IS 'Compétences des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_certifications IS 'Certifications des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_projects IS 'Projets et portfolios des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_languages IS 'Langues maîtrisées par les utilisateurs pour Beyond Connect';


