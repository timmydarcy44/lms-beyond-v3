ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS career_goal text,
  ADD COLUMN IF NOT EXISTS career_goal_other text;

COMMENT ON COLUMN public.profiles.career_goal IS 'Objectif métier particulier EDGE (ex: commercial_vente, needs_help)';
COMMENT ON COLUMN public.profiles.career_goal_other IS 'Précision libre si career_goal = other';
