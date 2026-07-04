-- Profil comportemental EDGE : objectif détaillé + relance profil incomplet

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objective_details jsonb,
  ADD COLUMN IF NOT EXISTS profile_incomplete_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.objective_details IS
  'Champs objectif contextualisés (alternance, emploi, reconversion, freelance, autre) — rempli après le test DISC.';

COMMENT ON COLUMN public.profiles.profile_incomplete_reminder_sent_at IS
  'Horodatage de la dernière relance email pour profil EDGE incomplet (IDMC / soft skills manquants).';

UPDATE public.open_badges
SET name = 'Profil comportemental EDGE',
    description = COALESCE(
      NULLIF(description, ''),
      'Badge obtenu après le test comportemental EDGE et la définition de votre objectif professionnel.'
    )
WHERE id = 'a1000001-0000-4000-8000-000000000001'
   OR name = 'Diagnostic Commercial';
