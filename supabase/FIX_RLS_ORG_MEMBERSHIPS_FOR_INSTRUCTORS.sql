-- ============================================
-- Script pour permettre aux formateurs de voir leurs apprenants
-- ============================================
-- Problème : La policy actuelle org_memberships_self permet seulement
-- de voir ses propres membreships, pas ceux des autres dans la même organisation.
-- Solution : Ajouter une policy qui permet aux formateurs (instructor)
-- de voir les membreships des apprenants (learner) dans leurs organisations.
-- ============================================

-- Vérifier et créer la policy pour les formateurs
DO $$
BEGIN
  -- Policy pour que les formateurs puissent voir les apprenants de leurs organisations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'org_memberships' 
      AND policyname = 'org_memberships_instructor_read_learners'
  ) THEN
    CREATE POLICY org_memberships_instructor_read_learners ON public.org_memberships
      FOR SELECT
      USING (
        -- Le formateur peut voir les membreships des apprenants dans les mêmes organisations
        EXISTS (
          SELECT 1 FROM public.org_memberships om_instructor
          WHERE om_instructor.org_id = org_memberships.org_id
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
        AND org_memberships.role = 'learner'
      );
    
    RAISE NOTICE 'Policy org_memberships_instructor_read_learners créée';
  ELSE
    RAISE NOTICE 'Policy org_memberships_instructor_read_learners existe déjà';
  END IF;
  
  -- Policy pour que les formateurs puissent voir tous les membreships de leurs organisations (y compris autres formateurs)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'org_memberships' 
      AND policyname = 'org_memberships_instructor_read_org'
  ) THEN
    CREATE POLICY org_memberships_instructor_read_org ON public.org_memberships
      FOR SELECT
      USING (
        -- Le formateur peut voir tous les membreships dans ses organisations
        EXISTS (
          SELECT 1 FROM public.org_memberships om_instructor
          WHERE om_instructor.org_id = org_memberships.org_id
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
      );
    
    RAISE NOTICE 'Policy org_memberships_instructor_read_org créée';
  ELSE
    RAISE NOTICE 'Policy org_memberships_instructor_read_org existe déjà';
  END IF;
END $$;

-- Policy pour permettre aux formateurs de lire les profils des apprenants de leurs organisations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'profiles_instructor_read_learners'
  ) THEN
    CREATE POLICY profiles_instructor_read_learners ON public.profiles
      FOR SELECT
      USING (
        -- Un formateur peut lire les profils des apprenants dans ses organisations
        EXISTS (
          SELECT 1 FROM public.org_memberships om_learner
          JOIN public.org_memberships om_instructor 
            ON om_learner.org_id = om_instructor.org_id
          WHERE om_learner.user_id = profiles.id
            AND om_learner.role = 'learner'
            AND om_instructor.user_id = auth.uid()
            AND om_instructor.role = 'instructor'
        )
      );
    
    RAISE NOTICE 'Policy profiles_instructor_read_learners créée';
  ELSE
    RAISE NOTICE 'Policy profiles_instructor_read_learners existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  'Résumé des policies' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('org_memberships', 'profiles')
  AND policyname LIKE '%instructor%'
ORDER BY tablename, policyname;



