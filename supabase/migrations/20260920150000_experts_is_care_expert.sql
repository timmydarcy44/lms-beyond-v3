-- Experts visibles dans EDGE Care (liste apprenant).
ALTER TABLE public.experts
  ADD COLUMN IF NOT EXISTS is_care_expert boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.experts.is_care_expert IS
  'Si true, l''expert apparaît dans EDGE Care (coché depuis /super).';

CREATE INDEX IF NOT EXISTS experts_is_care_expert_idx
  ON public.experts (is_care_expert)
  WHERE is_care_expert = true AND is_active = true;
