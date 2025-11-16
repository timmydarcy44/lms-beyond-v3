-- Corriger la récursion infinie dans les policies RLS de courses
-- ===============================================================

-- 1. Supprimer la policy problématique
DROP POLICY IF EXISTS courses_learner_read ON public.courses;

-- 2. Créer une fonction SECURITY DEFINER pour vérifier l'accès aux courses
--    Cette fonction s'exécute avec les privilèges de son créateur, bypassant RLS
--    et évitant ainsi la récursion
--    IMPORTANT: On passe les colonnes du course directement pour éviter les SELECT récursifs
CREATE OR REPLACE FUNCTION can_user_read_course(
  p_user_id UUID,
  p_course_creator_id UUID,
  p_course_owner_id UUID,
  p_course_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  is_b2c BOOLEAN;
BEGIN
  -- Récupérer le rôle de l'utilisateur (une seule fois)
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Si admin/instructor/super_admin, accès total
  IF v_user_role IN ('admin', 'instructor', 'super_admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Si créateur/propriétaire du course, accès
  IF p_course_creator_id = p_user_id OR p_course_owner_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si le course est publié (catalogue public)
  IF p_course_status = 'published' THEN
    -- Si publié, vérifier si c'est un B2C avec abonnement
    -- D'abord vérifier si c'est un B2C
    SELECT NOT EXISTS (
      SELECT 1 FROM public.org_memberships om
      WHERE om.user_id = p_user_id
    ) INTO is_b2c;
    
    -- Si B2C, vérifier qu'il a un accès au catalogue (abonnement payé)
    IF is_b2c THEN
      IF EXISTS (
        SELECT 1 FROM public.catalog_access ca
        WHERE ca.user_id = p_user_id
          AND ca.organization_id IS NULL
          AND ca.access_status IN ('purchased', 'manually_granted', 'free')
      ) THEN
        -- B2C avec abonnement = accès à TOUT le catalogue publié
        RETURN TRUE;
      END IF;
    END IF;
    
    -- Si publié, accessible à tous (catalogue public - même sans achat)
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer une fonction helper pour vérifier les enrollments (séparée pour éviter la récursion)
CREATE OR REPLACE FUNCTION is_user_enrolled_in_course(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = p_course_id
      AND (e.learner_id = p_user_id OR e.user_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. S'assurer que les policies pour admins/instructors/super_admins existent
--    Ces policies sont prioritaires et bypassent la fonction pour ces rôles
DROP POLICY IF EXISTS courses_instructor_all ON public.courses;
CREATE POLICY courses_instructor_all ON public.courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'instructor')
    )
  );

-- Vérifier si la fonction is_super_admin existe, sinon utiliser la vérification directe
DROP POLICY IF EXISTS courses_super_admin_all ON public.courses;
DO $$
BEGIN
  -- Utiliser la fonction is_super_admin() si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin'
  ) THEN
    EXECUTE 'CREATE POLICY courses_super_admin_all ON public.courses
      FOR ALL
      USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin())';
  ELSE
    -- Fallback: vérification directe du rôle
    EXECUTE 'CREATE POLICY courses_super_admin_all ON public.courses
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role = ''super_admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role = ''super_admin''
        )
      )';
  END IF;
END $$;

-- 5. Créer une nouvelle policy pour les learners qui utilise ces fonctions
--    On passe les colonnes directement pour éviter les SELECT récursifs sur courses
CREATE POLICY courses_learner_read ON public.courses
  FOR SELECT
  USING (
    -- Vérifier l'accès via la fonction (qui bypass RLS)
    can_user_read_course(
      auth.uid(),
      creator_id,
      owner_id,
      status
    )
    -- OU si l'utilisateur est inscrit (via fonction séparée)
    OR is_user_enrolled_in_course(auth.uid(), id)
  );

-- 4. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

