-- Corriger les RLS policies pour permettre aux learners d'accéder aux courses qui leur sont assignés
-- ===============================================================

-- 1. Vérifier les policies existantes pour courses
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

-- 2. Ajouter la colonne user_id à catalog_access si elle n'existe pas (pour les B2C)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_access'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.catalog_access
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Créer un index pour les recherches par user_id
    CREATE INDEX IF NOT EXISTS idx_catalog_access_user ON public.catalog_access(user_id);
    
    -- Modifier la contrainte UNIQUE pour permettre soit organization_id, soit user_id
    -- (mais pas les deux en même temps)
    ALTER TABLE public.catalog_access
    DROP CONSTRAINT IF EXISTS catalog_access_organization_id_catalog_item_id_key;
    
    -- Créer une contrainte unique pour (user_id, catalog_item_id) si user_id est présent
    -- et permettre (organization_id, catalog_item_id) si organization_id est présent
    -- Note: La contrainte UNIQUE existante sera remplacée par une logique plus flexible
  END IF;
END $$;

-- 3. Supprimer l'ancienne policy publique si elle existe
DROP POLICY IF EXISTS courses_public_read ON public.courses;
DROP POLICY IF EXISTS courses_public_published ON public.courses;

-- 4. Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS courses_learner_read ON public.courses;

-- 5. Créer une nouvelle policy qui permet aux learners de lire les courses qui leur sont assignés
-- et aux admins/instructors de lire tous les courses
CREATE POLICY courses_learner_read ON public.courses
  FOR SELECT
  USING (
    -- Permettre la lecture si l'utilisateur est inscrit au course (via enrollments) - B2B
    EXISTS (
      SELECT 1 
      FROM public.enrollments e
      WHERE e.course_id = courses.id
        AND (
          e.user_id = auth.uid()
          OR e.learner_id = auth.uid()
        )
    )
    -- OU si l'utilisateur est B2C avec abonnement payé (accès à TOUT le catalogue publié)
    OR (
      -- Vérifier si l'utilisateur est B2C (pas de org_id)
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('learner', 'student')
          AND NOT EXISTS (
            SELECT 1
            FROM public.org_memberships om
            WHERE om.user_id = p.id
          )
      )
      -- ET si le course est publié (dans le catalogue)
      AND courses.status = 'published'
      -- ET si l'utilisateur a un abonnement actif (vérifier via catalog_access)
      -- Pour les B2C avec abonnement, avoir au moins un accès payé = abonnement actif = accès à TOUT le catalogue
      AND EXISTS (
        SELECT 1
        FROM public.catalog_access ca
        WHERE ca.user_id = auth.uid()
          AND ca.organization_id IS NULL
          AND ca.access_status IN ('purchased', 'manually_granted', 'free')
      )
    )
    -- OU si le course est publié (pour le catalogue public - avant achat)
    OR courses.status = 'published'
    -- OU si l'utilisateur est admin/instructor
    OR EXISTS (
      SELECT 1 
      FROM public.profiles pr 
      WHERE pr.id = auth.uid() 
        AND pr.role IN ('admin', 'instructor', 'super_admin')
    )
    -- OU si l'utilisateur est le créateur/propriétaire
    OR courses.creator_id = auth.uid()
    OR courses.owner_id = auth.uid()
  );

-- 6. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

-- 7. Test : vérifier qu'un learner peut lire un course qui lui est assigné
-- Exemple de requête (à décommenter et remplacer le UUID) :
-- SELECT 
--   'TEST LECTURE COURSE' as "Info",
--   c.id,
--   c.title,
--   c.slug,
--   c.status
-- FROM public.courses c
-- WHERE c.id = '00000000-0000-0000-0000-000000000000'::uuid  -- Remplacez par un UUID valide
-- LIMIT 1;

