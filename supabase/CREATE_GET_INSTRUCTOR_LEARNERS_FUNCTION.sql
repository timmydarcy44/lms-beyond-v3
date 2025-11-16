-- ============================================
-- Script pour créer une fonction PostgreSQL qui récupère les apprenants d'un formateur
-- ============================================
-- Cette fonction contourne les problèmes de RLS en utilisant SECURITY DEFINER
-- ============================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS public.get_instructor_learners(uuid);

-- Créer la fonction
CREATE OR REPLACE FUNCTION public.get_instructor_learners(p_instructor_id uuid)
RETURNS TABLE (
  learner_id uuid,
  learner_email text,
  learner_full_name text,
  org_id uuid,
  org_name text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Cette fonction s'exécute avec les privilèges du créateur (bypass RLS)
SET search_path = public
AS $$
BEGIN
  -- SÉCURITÉ : Vérifier que l'utilisateur connecté est bien celui qui fait la requête
  -- OU qu'il est admin. Cela empêche les utilisateurs de voir les apprenants d'autres formateurs.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  IF auth.uid() != p_instructor_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: can only view your own learners';
  END IF;
  
  -- Vérifier que p_instructor_id est bien un instructor
  IF NOT EXISTS (
    SELECT 1 FROM public.org_memberships 
    WHERE user_id = p_instructor_id AND role = 'instructor'
  ) THEN
    -- Si l'utilisateur n'est pas instructor, retourner vide (pas d'erreur)
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH instructor_orgs AS (
    -- Récupérer toutes les organisations où l'utilisateur est instructor
    SELECT DISTINCT om.org_id
    FROM public.org_memberships om
    WHERE om.user_id = p_instructor_id
      AND om.role = 'instructor'
  ),
  learner_memberships AS (
    -- Récupérer tous les apprenants dans ces organisations
    SELECT DISTINCT om.user_id, om.org_id
    FROM public.org_memberships om
    JOIN instructor_orgs io ON om.org_id = io.org_id
    WHERE om.role = 'learner'
  )
  SELECT 
    p.id as learner_id,
    p.email as learner_email,
    p.full_name as learner_full_name,
    lm.org_id,
    o.name as org_name
  FROM learner_memberships lm
  JOIN public.profiles p ON lm.user_id = p.id
  LEFT JOIN public.organizations o ON lm.org_id = o.id
  ORDER BY p.full_name, p.email;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_instructor_learners(uuid) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.get_instructor_learners(uuid) IS 
  'Récupère tous les apprenants associés aux organisations d''un formateur. Contourne RLS avec SECURITY DEFINER.';

-- Test de la fonction (remplacez l'UUID par celui de votre formateur)
-- SELECT * FROM public.get_instructor_learners('225f10f7-850b-4897-8ed6-637cf5ea0cd5');

