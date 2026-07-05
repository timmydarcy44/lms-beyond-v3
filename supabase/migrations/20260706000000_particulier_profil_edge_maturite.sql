-- Profil EDGE Particulier : maturité globale (projet pro, expériences, diplômes enrichis)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_project jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.professional_project IS
  'Projet professionnel EDGE : objectif, metier_vise, secteur, mobilite, disponibilite.';

ALTER TABLE public.experiences_pro
  ADD COLUMN IF NOT EXISTS poste text,
  ADD COLUMN IF NOT EXISTS competences_developpees jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.diplomes
  ADD COLUMN IF NOT EXISTS diploma_type text,
  ADD COLUMN IF NOT EXISTS niveau text,
  ADD COLUMN IF NOT EXISTS description text;
