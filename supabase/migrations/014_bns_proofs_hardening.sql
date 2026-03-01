BEGIN;

-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add tenant_id to bns_proofs if missing
ALTER TABLE public.bns_proofs
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Proof metadata required by builder
ALTER TABLE public.bns_proofs
  ADD COLUMN IF NOT EXISTS recognition_goal text,
  ADD COLUMN IF NOT EXISTS final_deliverable text;

CREATE INDEX IF NOT EXISTS bns_proofs_tenant_id_idx ON public.bns_proofs (tenant_id);
CREATE INDEX IF NOT EXISTS bns_proofs_created_by_idx ON public.bns_proofs (created_by);

-- Resources attached to proof steps/nodes (reusable)

-- Drop FKs that reference public.profiles and re-add against auth.users
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'bns_proofs'
    AND pg_constraint.contype = 'f'
    AND pg_constraint.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = pg_class.oid AND attname = 'created_by')
    ];
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bns_proofs DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'bns_proofs'
    AND pg_constraint.contype = 'f'
    AND pg_constraint.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = pg_class.oid AND attname = 'updated_by')
    ];
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bns_proofs DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.bns_proofs
  ADD CONSTRAINT bns_proofs_created_by_fk
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.bns_proofs
  ADD CONSTRAINT bns_proofs_updated_by_fk
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'bns_proof_plan_versions'
    AND pg_constraint.contype = 'f'
    AND pg_constraint.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = pg_class.oid AND attname = 'published_by')
    ];
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bns_proof_plan_versions DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.bns_proof_plan_versions
  ADD CONSTRAINT bns_proof_plan_versions_published_by_fk
  FOREIGN KEY (published_by) REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
  JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
  WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'bns_user_proof_validations'
    AND pg_constraint.contype = 'f'
    AND pg_constraint.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = pg_class.oid AND attname = 'validator_id')
    ];
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bns_user_proof_validations DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.bns_user_proof_validations
  ADD CONSTRAINT bns_user_proof_validations_validator_fk
  FOREIGN KEY (validator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS hardening
ALTER TABLE public.bns_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_proof_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bns_user_proof_validations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS bns_proofs_read_published ON public.bns_proofs;
DROP POLICY IF EXISTS bns_proofs_admin_all ON public.bns_proofs;
DROP POLICY IF EXISTS bns_proof_steps_admin_all ON public.bns_proof_steps;
DROP POLICY IF EXISTS bns_proof_nodes_admin_all ON public.bns_proof_nodes;
DROP POLICY IF EXISTS bns_proof_plan_versions_read ON public.bns_proof_plan_versions;
DROP POLICY IF EXISTS bns_proof_plan_versions_admin_all ON public.bns_proof_plan_versions;
DROP POLICY IF EXISTS bns_user_proof_enrollments_owner ON public.bns_user_proof_enrollments;
DROP POLICY IF EXISTS bns_user_proof_enrollments_owner_write ON public.bns_user_proof_enrollments;
DROP POLICY IF EXISTS bns_user_proof_enrollments_owner_update ON public.bns_user_proof_enrollments;
DROP POLICY IF EXISTS bns_user_proof_enrollments_admin_all ON public.bns_user_proof_enrollments;
DROP POLICY IF EXISTS bns_user_proof_artifacts_owner ON public.bns_user_proof_artifacts;
DROP POLICY IF EXISTS bns_user_proof_artifacts_admin_all ON public.bns_user_proof_artifacts;
DROP POLICY IF EXISTS bns_user_proof_validations_owner_read ON public.bns_user_proof_validations;
DROP POLICY IF EXISTS bns_user_proof_validations_admin_all ON public.bns_user_proof_validations;

-- Helpers
-- Super admin check
CREATE POLICY bns_proofs_read_published ON public.bns_proofs
  FOR SELECT
  USING (is_published = true);

CREATE POLICY bns_proofs_select_owner ON public.bns_proofs
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','instructor')
      )
      AND (
        created_by = auth.uid()
        OR (
          tenant_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.org_memberships om
            WHERE om.org_id = bns_proofs.tenant_id AND om.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY bns_proofs_admin_all ON public.bns_proofs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

CREATE POLICY bns_proofs_insert_owner ON public.bns_proofs
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','instructor')
      )
      AND created_by = auth.uid()
      AND (
        tenant_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.org_memberships om
          WHERE om.org_id = bns_proofs.tenant_id AND om.user_id = auth.uid()
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

CREATE POLICY bns_proofs_update_owner ON public.bns_proofs
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','instructor')
      )
      AND (
        created_by = auth.uid()
        OR (
          tenant_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.org_memberships om
            WHERE om.org_id = bns_proofs.tenant_id AND om.user_id = auth.uid()
          )
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','instructor')
      )
      AND (
        created_by = auth.uid()
        OR (
          tenant_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.org_memberships om
            WHERE om.org_id = bns_proofs.tenant_id AND om.user_id = auth.uid()
          )
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

CREATE POLICY bns_proofs_delete_owner ON public.bns_proofs
  FOR DELETE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('admin','instructor')
      )
      AND (
        created_by = auth.uid()
        OR (
          tenant_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.org_memberships om
            WHERE om.org_id = bns_proofs.tenant_id AND om.user_id = auth.uid()
          )
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Steps: access if user can access parent proof
CREATE POLICY bns_proof_steps_owner ON public.bns_proof_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_proof_steps.proof_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND (
              p.created_by = auth.uid()
              OR (
                p.tenant_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.org_memberships om
                  WHERE om.org_id = p.tenant_id AND om.user_id = auth.uid()
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_proof_steps.proof_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND (
              p.created_by = auth.uid()
              OR (
                p.tenant_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.org_memberships om
                  WHERE om.org_id = p.tenant_id AND om.user_id = auth.uid()
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  );

-- Nodes: access if user can access parent proof
CREATE POLICY bns_proof_nodes_owner ON public.bns_proof_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_proof_steps s
      JOIN public.bns_proofs p ON p.id = s.proof_id
      WHERE s.id = bns_proof_nodes.proof_step_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND (
              p.created_by = auth.uid()
              OR (
                p.tenant_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.org_memberships om
                  WHERE om.org_id = p.tenant_id AND om.user_id = auth.uid()
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bns_proof_steps s
      JOIN public.bns_proofs p ON p.id = s.proof_id
      WHERE s.id = bns_proof_nodes.proof_step_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND (
              p.created_by = auth.uid()
              OR (
                p.tenant_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.org_memberships om
                  WHERE om.org_id = p.tenant_id AND om.user_id = auth.uid()
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  );

-- Plan versions: public read if proof is published, insert only owner/super admin
CREATE POLICY bns_proof_plan_versions_read ON public.bns_proof_plan_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_proof_plan_versions.proof_id
        AND p.is_published = true
    )
  );

CREATE POLICY bns_proof_plan_versions_insert_owner ON public.bns_proof_plan_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_proof_plan_versions.proof_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND (
              p.created_by = auth.uid()
              OR (
                p.tenant_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.org_memberships om
                  WHERE om.org_id = p.tenant_id AND om.user_id = auth.uid()
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  );

-- Enrollments: owner or super admin; instructor/admin if proof is theirs
CREATE POLICY bns_user_proof_enrollments_owner_read ON public.bns_user_proof_enrollments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.bns_proofs p
      WHERE p.id = bns_user_proof_enrollments.proof_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND p.created_by = auth.uid()
          )
        )
    )
  );

CREATE POLICY bns_user_proof_enrollments_owner_insert ON public.bns_user_proof_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY bns_user_proof_enrollments_owner_update ON public.bns_user_proof_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Artifacts: owner or super admin or proof creator
CREATE POLICY bns_user_proof_artifacts_owner ON public.bns_user_proof_artifacts
  FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      JOIN public.bns_proofs p ON p.id = e.proof_id
      WHERE e.id = bns_user_proof_artifacts.enrollment_id
        AND (
          EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid()
              AND pr.role IN ('admin','instructor')
          )
          AND p.created_by = auth.uid()
        )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

-- Validations: user read own, admin/instructor write if proof is theirs
CREATE POLICY bns_user_proof_validations_owner_read ON public.bns_user_proof_validations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      WHERE e.id = bns_user_proof_validations.enrollment_id
        AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

CREATE POLICY bns_user_proof_validations_admin_write ON public.bns_user_proof_validations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      JOIN public.bns_proofs p ON p.id = e.proof_id
      WHERE e.id = bns_user_proof_validations.enrollment_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND p.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  );

CREATE POLICY bns_user_proof_validations_admin_update ON public.bns_user_proof_validations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      JOIN public.bns_proofs p ON p.id = e.proof_id
      WHERE e.id = bns_user_proof_validations.enrollment_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND p.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bns_user_proof_enrollments e
      JOIN public.bns_proofs p ON p.id = e.proof_id
      WHERE e.id = bns_user_proof_validations.enrollment_id
        AND (
          (
            EXISTS (
              SELECT 1 FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role IN ('admin','instructor')
            )
            AND p.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.super_admins sa
            WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
          )
        )
    )
  );

-- Resources: admin/instructor access if creator or tenant member, super admin full
CREATE POLICY bns_proof_resources_owner_read ON public.bns_proof_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
    AND (
      created_by = auth.uid()
      OR (
        tenant_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.org_memberships om
          WHERE om.org_id = bns_proof_resources.tenant_id AND om.user_id = auth.uid()
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

CREATE POLICY bns_proof_resources_owner_write ON public.bns_proof_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
    AND (
      created_by = auth.uid()
      OR (
        tenant_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.org_memberships om
          WHERE om.org_id = bns_proof_resources.tenant_id AND om.user_id = auth.uid()
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
    AND (
      created_by = auth.uid()
      OR (
        tenant_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.org_memberships om
          WHERE om.org_id = bns_proof_resources.tenant_id AND om.user_id = auth.uid()
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
  );

COMMIT;

