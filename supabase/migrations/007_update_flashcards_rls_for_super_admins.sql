-- Migration 007: Update flashcards RLS policies to allow super admins
-- ===================================================================
-- This migration updates the flashcards_write policy to include super admins
-- Super admins should have full access to all flashcards

-- Drop existing flashcards_write policy if it exists
DROP POLICY IF EXISTS flashcards_write ON public.flashcards;

-- Recreate flashcards_write policy with super admin support
DO $$
BEGIN
  -- Check if creator_id exists in courses table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'courses' 
      AND column_name = 'creator_id'
  ) THEN
    -- Policy with creator_id check + super admin
    CREATE POLICY flashcards_write ON public.flashcards
      FOR ALL 
      USING (
        -- Super admin check (either via role or super_admins table)
        public.user_has_role(auth.uid(), array['super_admin'])
        OR EXISTS (
          SELECT 1 FROM public.super_admins sa
          WHERE sa.user_id = auth.uid()
            AND sa.is_active = TRUE
        )
        -- Original conditions: course creator or admin/instructor
        OR EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = flashcards.course_id
            AND (
              c.creator_id = auth.uid()
              OR public.user_has_role(auth.uid(), array['admin','instructor'])
            )
        )
      )
      WITH CHECK (
        -- Super admin check (either via role or super_admins table)
        public.user_has_role(auth.uid(), array['super_admin'])
        OR EXISTS (
          SELECT 1 FROM public.super_admins sa
          WHERE sa.user_id = auth.uid()
            AND sa.is_active = TRUE
        )
        -- Original conditions: course creator or admin/instructor
        OR EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = flashcards.course_id
            AND (
              c.creator_id = auth.uid()
              OR public.user_has_role(auth.uid(), array['admin','instructor'])
            )
        )
      );
  ELSE
    -- Fallback policy if creator_id doesn't exist: role check + super admin
    CREATE POLICY flashcards_write ON public.flashcards
      FOR ALL 
      USING (
        -- Super admin check (either via role or super_admins table)
        public.user_has_role(auth.uid(), array['super_admin'])
        OR EXISTS (
          SELECT 1 FROM public.super_admins sa
          WHERE sa.user_id = auth.uid()
            AND sa.is_active = TRUE
        )
        -- Original condition: admin/instructor
        OR public.user_has_role(auth.uid(), array['admin','instructor'])
      )
      WITH CHECK (
        -- Super admin check (either via role or super_admins table)
        public.user_has_role(auth.uid(), array['super_admin'])
        OR EXISTS (
          SELECT 1 FROM public.super_admins sa
          WHERE sa.user_id = auth.uid()
            AND sa.is_active = TRUE
        )
        -- Original condition: admin/instructor
        OR public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  END IF;
END $$;

-- Note: flashcards_read policy already allows all authenticated users (using true)
-- so super admins already have read access. No changes needed for read policy.

