-- Référentiel métiers EDGE + métier cible sur le profil particulier

CREATE TABLE IF NOT EXISTS public.career_profiles (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  sector text NOT NULL,
  description text NOT NULL,
  key_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  soft_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  behavioral_expectations jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  typical_challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_missions jsonb NOT NULL DEFAULT '[]'::jsonb,
  useful_qualities jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_formations jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_career_slug text;

COMMENT ON COLUMN public.profiles.target_career_slug IS
  'Slug du métier cible (career_profiles.slug) pour l''analyse Profil EDGE.';

CREATE INDEX IF NOT EXISTS career_profiles_sector_idx ON public.career_profiles (sector);
CREATE INDEX IF NOT EXISTS profiles_target_career_slug_idx ON public.profiles (target_career_slug);
