-- Soft skills results dedicated to employees (does not override learner table)

CREATE TABLE IF NOT EXISTS public.soft_skills_resultats_salarie (
  learner_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  scores jsonb NOT NULL,
  total_score integer NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.soft_skills_resultats_salarie ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "soft_skills_resultats_salarie_own" ON public.soft_skills_resultats_salarie;
CREATE POLICY "soft_skills_resultats_salarie_own"
  ON public.soft_skills_resultats_salarie
  FOR ALL
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soft_skills_resultats_salarie TO authenticated;
GRANT ALL ON public.soft_skills_resultats_salarie TO service_role;
