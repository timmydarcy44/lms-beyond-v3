-- Beyond Connect - Tables complètes pour le SaaS de CV numérique et recrutement
-- Design: Interface blanche avec accents bleu foncé PSG (#003087)

-- ============================================
-- 1. TABLES POUR LES UTILISATEURS (CV NUMÉRIQUE)
-- ============================================

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

-- Table pour les compétences
CREATE TABLE IF NOT EXISTS public.beyond_connect_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- "technique", "soft skills", "langues", etc.
  level TEXT, -- "débutant", "intermédiaire", "avancé", "expert"
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

-- Table pour les projets/portfolios
CREATE TABLE IF NOT EXISTS public.beyond_connect_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  start_date DATE,
  end_date DATE,
  technologies TEXT[], -- Array de technologies
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les langues
CREATE TABLE IF NOT EXISTS public.beyond_connect_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL, -- "A1", "A2", "B1", "B2", "C1", "C2", "Natif"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- ============================================
-- 2. TABLES POUR LES ENTREPRISES/PROFESSIONNELS
-- ============================================

-- Table pour les entreprises (organisations qui utilisent Beyond Connect pour le recrutement)
CREATE TABLE IF NOT EXISTS public.beyond_connect_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size TEXT, -- "startup", "pme", "etme", "grande_entreprise"
  website TEXT,
  logo_url TEXT,
  is_premium BOOLEAN DEFAULT false, -- Accès au matching
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les offres d'emploi
CREATE TABLE IF NOT EXISTS public.beyond_connect_job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.beyond_connect_companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL, -- Description de l'annonce (missions, responsabilités, etc.)
  company_presentation TEXT, -- Présentation de l'entreprise
  contract_type TEXT NOT NULL CHECK (contract_type IN ('stage', 'alternance', 'cdi', 'cdd', 'freelance', 'interim')),
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT DEFAULT 'EUR',
  hours_per_week INTEGER, -- Nombre d'heures par semaine
  required_skills TEXT[], -- Array de compétences requises
  required_soft_skills TEXT[], -- Array des soft skills requises (IDs des dimensions)
  required_experience TEXT, -- "junior", "mid", "senior"
  required_education TEXT, -- "bac", "bac+2", "bac+3", "bac+5", etc.
  benefits TEXT[], -- Array de bénéfices
  application_deadline DATE,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les candidatures
CREATE TABLE IF NOT EXISTS public.beyond_connect_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_offer_id UUID NOT NULL REFERENCES public.beyond_connect_job_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected')),
  match_score NUMERIC, -- Score de matching (0-100) si premium
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  notes TEXT, -- Notes internes de l'entreprise
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_offer_id, user_id)
);

-- Table pour les CVthèques (jeunes suivis par une entreprise)
CREATE TABLE IF NOT EXISTS public.beyond_connect_cv_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.beyond_connect_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT, -- Notes de l'entreprise sur ce profil
  tags TEXT[], -- Tags personnalisés
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Table pour les matchings (premium uniquement)
CREATE TABLE IF NOT EXISTS public.beyond_connect_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.beyond_connect_companies(id) ON DELETE CASCADE,
  job_offer_id UUID REFERENCES public.beyond_connect_job_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  skills_match NUMERIC, -- Score de matching des compétences
  experience_match NUMERIC, -- Score de matching de l'expérience
  education_match NUMERIC, -- Score de matching de la formation
  details JSONB, -- Détails du matching
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les préférences de visibilité du profil
CREATE TABLE IF NOT EXISTS public.beyond_connect_profile_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false, -- Profil visible publiquement
  is_searchable BOOLEAN DEFAULT true, -- Apparaît dans les recherches
  allow_contact BOOLEAN DEFAULT true, -- Permet aux entreprises de contacter
  show_contact_info BOOLEAN DEFAULT false, -- Affiche les infos de contact
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS beyond_connect_experiences_user_idx ON public.beyond_connect_experiences(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_education_user_idx ON public.beyond_connect_education(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_skills_user_idx ON public.beyond_connect_skills(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_certifications_user_idx ON public.beyond_connect_certifications(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_projects_user_idx ON public.beyond_connect_projects(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_languages_user_idx ON public.beyond_connect_languages(user_id);

CREATE INDEX IF NOT EXISTS beyond_connect_companies_org_idx ON public.beyond_connect_companies(organization_id);
CREATE INDEX IF NOT EXISTS beyond_connect_job_offers_company_idx ON public.beyond_connect_job_offers(company_id);
CREATE INDEX IF NOT EXISTS beyond_connect_job_offers_active_idx ON public.beyond_connect_job_offers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS beyond_connect_applications_job_idx ON public.beyond_connect_applications(job_offer_id);
CREATE INDEX IF NOT EXISTS beyond_connect_applications_user_idx ON public.beyond_connect_applications(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_cv_library_company_idx ON public.beyond_connect_cv_library(company_id);
CREATE INDEX IF NOT EXISTS beyond_connect_cv_library_user_idx ON public.beyond_connect_cv_library(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_matches_company_idx ON public.beyond_connect_matches(company_id);
CREATE INDEX IF NOT EXISTS beyond_connect_matches_user_idx ON public.beyond_connect_matches(user_id);
CREATE INDEX IF NOT EXISTS beyond_connect_matches_score_idx ON public.beyond_connect_matches(match_score DESC);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE public.beyond_connect_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_cv_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beyond_connect_profile_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour les données utilisateur (CV)
DO $$
BEGIN
  -- Experiences
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_experiences' AND policyname = 'users_manage_own_experiences') THEN
    CREATE POLICY users_manage_own_experiences ON public.beyond_connect_experiences
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Education
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_education' AND policyname = 'users_manage_own_education') THEN
    CREATE POLICY users_manage_own_education ON public.beyond_connect_education
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Skills
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_skills' AND policyname = 'users_manage_own_skills') THEN
    CREATE POLICY users_manage_own_skills ON public.beyond_connect_skills
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Certifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_certifications' AND policyname = 'users_manage_own_certifications') THEN
    CREATE POLICY users_manage_own_certifications ON public.beyond_connect_certifications
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Projects
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_projects' AND policyname = 'users_manage_own_projects') THEN
    CREATE POLICY users_manage_own_projects ON public.beyond_connect_projects
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Languages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_languages' AND policyname = 'users_manage_own_languages') THEN
    CREATE POLICY users_manage_own_languages ON public.beyond_connect_languages
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Profile settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_profile_settings' AND policyname = 'users_manage_own_settings') THEN
    CREATE POLICY users_manage_own_settings ON public.beyond_connect_profile_settings
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies pour les entreprises (lecture publique des offres actives, gestion par les membres de l'organisation)
DO $$
BEGIN
  -- Companies: Les membres de l'organisation peuvent gérer leur entreprise
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_companies' AND policyname = 'org_members_manage_company') THEN
    CREATE POLICY org_members_manage_company ON public.beyond_connect_companies
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.org_memberships
          WHERE user_id = auth.uid()
            AND org_id = organization_id
            AND role IN ('admin', 'instructor')
        )
      );
  END IF;

  -- Job offers: Lecture publique des offres actives, gestion par les membres de l'organisation
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_job_offers' AND policyname = 'public_read_active_jobs') THEN
    CREATE POLICY public_read_active_jobs ON public.beyond_connect_job_offers
      FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_job_offers' AND policyname = 'org_members_manage_jobs') THEN
    CREATE POLICY org_members_manage_jobs ON public.beyond_connect_job_offers
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.beyond_connect_companies bc
          JOIN public.org_memberships om ON om.org_id = bc.organization_id
          WHERE bc.id = company_id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'instructor')
        )
      );
  END IF;

  -- Applications: Les candidats voient leurs candidatures, les entreprises voient les candidatures à leurs offres
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_applications' AND policyname = 'users_see_own_applications') THEN
    CREATE POLICY users_see_own_applications ON public.beyond_connect_applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_applications' AND policyname = 'companies_see_their_applications') THEN
    CREATE POLICY companies_see_their_applications ON public.beyond_connect_applications
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.beyond_connect_job_offers jo
          JOIN public.beyond_connect_companies bc ON bc.id = jo.company_id
          JOIN public.org_memberships om ON om.org_id = bc.organization_id
          WHERE jo.id = job_offer_id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'instructor')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_applications' AND policyname = 'users_create_applications') THEN
    CREATE POLICY users_create_applications ON public.beyond_connect_applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_applications' AND policyname = 'companies_update_applications') THEN
    CREATE POLICY companies_update_applications ON public.beyond_connect_applications
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.beyond_connect_job_offers jo
          JOIN public.beyond_connect_companies bc ON bc.id = jo.company_id
          JOIN public.org_memberships om ON om.org_id = bc.organization_id
          WHERE jo.id = job_offer_id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'instructor')
        )
      );
  END IF;

  -- CV Library: Les entreprises gèrent leur CVthèque
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_cv_library' AND policyname = 'companies_manage_cv_library') THEN
    CREATE POLICY companies_manage_cv_library ON public.beyond_connect_cv_library
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.beyond_connect_companies bc
          JOIN public.org_memberships om ON om.org_id = bc.organization_id
          WHERE bc.id = company_id
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'instructor')
        )
      );
  END IF;

  -- Matches: Les entreprises premium voient leurs matchings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beyond_connect_matches' AND policyname = 'premium_companies_see_matches') THEN
    CREATE POLICY premium_companies_see_matches ON public.beyond_connect_matches
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.beyond_connect_companies bc
          JOIN public.org_memberships om ON om.org_id = bc.organization_id
          WHERE bc.id = company_id
            AND bc.is_premium = true
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'instructor')
        )
      );
  END IF;
END $$;

-- ============================================
-- 5. VUES POUR AGRÉGER LES DONNÉES
-- ============================================

-- Vue pour agréger les badges de l'utilisateur
-- Création conditionnelle selon les colonnes existantes dans la table badges
DO $$
DECLARE
  v_badges_exists BOOLEAN;
  v_user_badges_exists BOOLEAN;
  v_has_code BOOLEAN;
  v_has_label BOOLEAN;
  v_has_description BOOLEAN;
  v_sql TEXT;
BEGIN
  -- Vérifier si les tables existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'badges'
  ) INTO v_badges_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_badges'
  ) INTO v_user_badges_exists;
  
  -- Si les tables n'existent pas, créer une vue vide
  IF NOT v_badges_exists OR NOT v_user_badges_exists THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.beyond_connect_user_badges AS SELECT NULL::uuid as user_id, NULL::uuid as badge_id, NULL::timestamptz as earned_at WHERE false';
    RAISE NOTICE 'Tables badges ou user_badges n''existent pas. Vue beyond_connect_user_badges créée vide.';
    RETURN;
  END IF;
  
  -- Vérifier quelles colonnes existent dans la table badges
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'code'
  ) INTO v_has_code;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'label'
  ) INTO v_has_label;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'description'
  ) INTO v_has_description;
  
  -- Construire la requête SELECT dynamiquement
  v_sql := 'CREATE OR REPLACE VIEW public.beyond_connect_user_badges AS SELECT ub.user_id, b.id as badge_id';
  
  IF v_has_code THEN
    v_sql := v_sql || ', b.code';
  END IF;
  
  IF v_has_label THEN
    v_sql := v_sql || ', b.label';
  END IF;
  
  IF v_has_description THEN
    v_sql := v_sql || ', b.description';
  END IF;
  
  v_sql := v_sql || ', ub.earned_at FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id';
  
  -- Exécuter la requête
  EXECUTE v_sql;
  
  RAISE NOTICE 'Vue beyond_connect_user_badges créée avec succès. Colonnes: code=%, label=%, description=%', v_has_code, v_has_label, v_has_description;
END $$;

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

-- Vue pour les profils complets (pour les entreprises)
CREATE OR REPLACE VIEW public.beyond_connect_user_profiles AS
SELECT 
  p.id as user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.avatar_url,
  ps.is_public,
  ps.is_searchable,
  ps.allow_contact,
  ps.show_contact_info,
  (SELECT COUNT(*) FROM public.beyond_connect_experiences WHERE user_id = p.id) as experiences_count,
  (SELECT COUNT(*) FROM public.beyond_connect_education WHERE user_id = p.id) as education_count,
  (SELECT COUNT(*) FROM public.beyond_connect_skills WHERE user_id = p.id) as skills_count,
  (SELECT COUNT(*) FROM public.beyond_connect_certifications WHERE user_id = p.id) as certifications_count,
  (SELECT COUNT(*) FROM public.beyond_connect_projects WHERE user_id = p.id) as projects_count,
  (SELECT COUNT(*) FROM public.beyond_connect_languages WHERE user_id = p.id) as languages_count,
  (SELECT COUNT(*) FROM public.beyond_connect_user_badges WHERE user_id = p.id) as badges_count
FROM public.profiles p
LEFT JOIN public.beyond_connect_profile_settings ps ON ps.user_id = p.id;

-- ============================================
-- 6. COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.beyond_connect_experiences IS 'Expériences professionnelles des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_education IS 'Formations et diplômes des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_skills IS 'Compétences des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_certifications IS 'Certifications des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_projects IS 'Projets et portfolios des utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_languages IS 'Langues maîtrisées par les utilisateurs pour Beyond Connect';
COMMENT ON TABLE public.beyond_connect_companies IS 'Entreprises utilisant Beyond Connect pour le recrutement';
COMMENT ON TABLE public.beyond_connect_job_offers IS 'Offres d''emploi déposées par les entreprises';
COMMENT ON TABLE public.beyond_connect_applications IS 'Candidatures des utilisateurs aux offres d''emploi';
COMMENT ON TABLE public.beyond_connect_cv_library IS 'CVthèque : jeunes suivis par une entreprise';
COMMENT ON TABLE public.beyond_connect_matches IS 'Matchings entre offres et profils (premium uniquement)';
COMMENT ON TABLE public.beyond_connect_profile_settings IS 'Paramètres de visibilité des profils utilisateurs';

