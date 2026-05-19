-- Soft skills results dedicated to employees (does not override learner table)

CREATE TABLE IF NOT EXISTS public.soft_skills_resultats_salarie (
  learner_id uuid PRIMARY KEY,
  answers jsonb NOT NULL,
  scores jsonb NOT NULL,
  total_score integer NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now()
);

