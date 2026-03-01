BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.bns_proofs
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS expected_outcome text,
  ADD COLUMN IF NOT EXISTS expected_proof text;

CREATE TABLE IF NOT EXISTS public.bns_proof_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  trigger_label text,
  final_validation_type text,
  final_validation_prompt text,
  final_validation_rules jsonb,
  is_published boolean NOT NULL DEFAULT false,
  tenant_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bns_proof_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.bns_proof_paths(id) ON DELETE CASCADE,
  proof_id uuid NOT NULL REFERENCES public.bns_proofs(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bns_proof_path_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.bns_proof_paths(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bns_proof_paths_slug_idx ON public.bns_proof_paths (slug);
CREATE INDEX IF NOT EXISTS bns_proof_paths_created_by_idx ON public.bns_proof_paths (created_by);
CREATE INDEX IF NOT EXISTS bns_proof_path_steps_path_idx ON public.bns_proof_path_steps (path_id);
CREATE INDEX IF NOT EXISTS bns_proof_path_steps_proof_idx ON public.bns_proof_path_steps (proof_id);

ALTER TABLE public.bns_proof_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_path_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bns_proof_paths_read_published ON public.bns_proof_paths;
DROP POLICY IF EXISTS bns_proof_paths_admin_all ON public.bns_proof_paths;
DROP POLICY IF EXISTS bns_proof_path_steps_admin_all ON public.bns_proof_path_steps;
DROP POLICY IF EXISTS bns_proof_path_versions_read ON public.bns_proof_path_versions;
DROP POLICY IF EXISTS bns_proof_path_versions_admin_all ON public.bns_proof_path_versions;

CREATE POLICY bns_proof_paths_read_published ON public.bns_proof_paths
  FOR SELECT
  USING (is_published = true);

CREATE POLICY bns_proof_paths_admin_all ON public.bns_proof_paths
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  );

CREATE POLICY bns_proof_path_steps_admin_all ON public.bns_proof_path_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  );

CREATE POLICY bns_proof_path_versions_read ON public.bns_proof_path_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_proof_paths p
      WHERE p.id = bns_proof_path_versions.path_id
        AND p.is_published = true
    )
  );

CREATE POLICY bns_proof_path_versions_admin_all ON public.bns_proof_path_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  );

COMMIT;

