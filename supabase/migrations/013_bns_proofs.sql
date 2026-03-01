BEGIN;

-- BNS proofs (master data)
CREATE TABLE IF NOT EXISTS public.bns_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  is_published boolean NOT NULL DEFAULT false,
  latest_plan_version_id uuid,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Steps for a proof (builder model)
CREATE TABLE IF NOT EXISTS public.bns_proof_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id uuid NOT NULL REFERENCES public.bns_proofs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  step_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Nodes (content modules) inside a step
CREATE TABLE IF NOT EXISTS public.bns_proof_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_step_id uuid NOT NULL REFERENCES public.bns_proof_steps(id) ON DELETE CASCADE,
  node_type text NOT NULL DEFAULT 'content',
  title text,
  description text,
  content_type text,
  content_id uuid,
  rules jsonb,
  config jsonb,
  node_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Published plan snapshots (immutable)
CREATE TABLE IF NOT EXISTS public.bns_proof_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id uuid NOT NULL REFERENCES public.bns_proofs(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User enrollments to a proof
CREATE TABLE IF NOT EXISTS public.bns_user_proof_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_id uuid NOT NULL REFERENCES public.bns_proofs(id) ON DELETE CASCADE,
  plan_version_id uuid REFERENCES public.bns_proof_plan_versions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  current_step_index integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User artifacts (deliverables)
CREATE TABLE IF NOT EXISTS public.bns_user_proof_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.bns_user_proof_enrollments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.bns_proof_steps(id) ON DELETE SET NULL,
  artifact_type text NOT NULL DEFAULT 'link',
  title text,
  url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Human validations
CREATE TABLE IF NOT EXISTS public.bns_user_proof_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.bns_user_proof_enrollments(id) ON DELETE CASCADE,
  validator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK link to latest plan version (added after table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'bns_proofs'
      AND constraint_name = 'bns_proofs_latest_plan_version_fk'
  ) THEN
    ALTER TABLE public.bns_proofs
      ADD CONSTRAINT bns_proofs_latest_plan_version_fk
      FOREIGN KEY (latest_plan_version_id)
      REFERENCES public.bns_proof_plan_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS bns_proofs_slug_idx ON public.bns_proofs (slug);
CREATE INDEX IF NOT EXISTS bns_proof_steps_proof_id_idx ON public.bns_proof_steps (proof_id);
CREATE INDEX IF NOT EXISTS bns_proof_nodes_step_id_idx ON public.bns_proof_nodes (proof_step_id);
CREATE INDEX IF NOT EXISTS bns_proof_plan_versions_proof_id_idx ON public.bns_proof_plan_versions (proof_id);
CREATE INDEX IF NOT EXISTS bns_user_proof_enrollments_user_idx ON public.bns_user_proof_enrollments (user_id);
CREATE INDEX IF NOT EXISTS bns_user_proof_enrollments_proof_idx ON public.bns_user_proof_enrollments (proof_id);
CREATE INDEX IF NOT EXISTS bns_user_proof_artifacts_enrollment_idx ON public.bns_user_proof_artifacts (enrollment_id);

-- Enable RLS
ALTER TABLE public.bns_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_validations ENABLE ROW LEVEL SECURITY;

-- Admin check helper (inline expression)
-- public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])

-- Proofs: public read published, admin write
DROP POLICY IF EXISTS bns_proofs_read_published ON public.bns_proofs;
CREATE POLICY bns_proofs_read_published ON public.bns_proofs
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS bns_proofs_admin_all ON public.bns_proofs;
CREATE POLICY bns_proofs_admin_all ON public.bns_proofs
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Steps: admin only
DROP POLICY IF EXISTS bns_proof_steps_admin_all ON public.bns_proof_steps;
CREATE POLICY bns_proof_steps_admin_all ON public.bns_proof_steps
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Nodes: admin only
DROP POLICY IF EXISTS bns_proof_nodes_admin_all ON public.bns_proof_nodes;
CREATE POLICY bns_proof_nodes_admin_all ON public.bns_proof_nodes
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Plan versions: public read for published proofs, admin write
DROP POLICY IF EXISTS bns_proof_plan_versions_read ON public.bns_proof_plan_versions;
CREATE POLICY bns_proof_plan_versions_read ON public.bns_proof_plan_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_proof_plan_versions.proof_id
        AND p.is_published = true
    )
  );

DROP POLICY IF EXISTS bns_proof_plan_versions_admin_all ON public.bns_proof_plan_versions;
CREATE POLICY bns_proof_plan_versions_admin_all ON public.bns_proof_plan_versions
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Enrollments: user owns rows, admin can read/write
DROP POLICY IF EXISTS bns_user_proof_enrollments_owner ON public.bns_user_proof_enrollments;
CREATE POLICY bns_user_proof_enrollments_owner ON public.bns_user_proof_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS bns_user_proof_enrollments_owner_write ON public.bns_user_proof_enrollments;
CREATE POLICY bns_user_proof_enrollments_owner_write ON public.bns_user_proof_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS bns_user_proof_enrollments_owner_update ON public.bns_user_proof_enrollments;
CREATE POLICY bns_user_proof_enrollments_owner_update ON public.bns_user_proof_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS bns_user_proof_enrollments_admin_all ON public.bns_user_proof_enrollments;
CREATE POLICY bns_user_proof_enrollments_admin_all ON public.bns_user_proof_enrollments
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Artifacts: user owns rows, admin can read/write
DROP POLICY IF EXISTS bns_user_proof_artifacts_owner ON public.bns_user_proof_artifacts;
CREATE POLICY bns_user_proof_artifacts_owner ON public.bns_user_proof_artifacts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS bns_user_proof_artifacts_admin_all ON public.bns_user_proof_artifacts;
CREATE POLICY bns_user_proof_artifacts_admin_all ON public.bns_user_proof_artifacts
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Validations: user can read own, admin can write
DROP POLICY IF EXISTS bns_user_proof_validations_owner_read ON public.bns_user_proof_validations;
CREATE POLICY bns_user_proof_validations_owner_read ON public.bns_user_proof_validations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      WHERE e.id = bns_user_proof_validations.enrollment_id
        AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS bns_user_proof_validations_admin_all ON public.bns_user_proof_validations;
CREATE POLICY bns_user_proof_validations_admin_all ON public.bns_user_proof_validations
  FOR ALL
  USING (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    public.user_has_role(auth.uid(), array['super_admin','admin','instructor'])
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

COMMIT;

