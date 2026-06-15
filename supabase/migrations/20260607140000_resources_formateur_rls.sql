-- Autoriser les formateurs (org_memberships + profils) à créer/modifier leurs ressources
DROP POLICY IF EXISTS resources_owner_write ON public.resources;

CREATE POLICY resources_owner_write ON public.resources
  FOR ALL
  USING (
    created_by = auth.uid()
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin', 'instructor', 'formateur')
    )
    OR (
      org_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = resources.org_id
          AND om.role IN ('admin', 'instructor', 'formateur', 'tutor', 'trainer', 'staff', 'owner')
      )
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin', 'instructor', 'formateur')
    )
    OR (
      org_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = resources.org_id
          AND om.role IN ('admin', 'instructor', 'formateur', 'tutor', 'trainer', 'staff', 'owner')
      )
    )
  );
