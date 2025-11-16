-- ============================================
-- Script pour corriger la récursion infinie dans org_memberships
-- ============================================
-- Problème : La policy org_memberships_instructor_read_org fait un EXISTS sur org_memberships
-- ce qui déclenche une récursion car cette requête est aussi soumise à RLS
-- ============================================

-- Supprimer la policy problématique
DROP POLICY IF EXISTS org_memberships_instructor_read_org ON public.org_memberships;

-- Créer une fonction helper qui vérifie si un utilisateur est instructor dans une org
-- Cette fonction utilise SECURITY DEFINER pour bypass RLS et éviter la récursion
CREATE OR REPLACE FUNCTION public.is_user_instructor_in_org(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Vérifier directement dans org_memberships sans passer par RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_memberships
    WHERE user_id = p_user_id
      AND org_id = p_org_id
      AND role = 'instructor'
  );
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.is_user_instructor_in_org(uuid, uuid) TO authenticated;

-- Recréer la policy en utilisant la fonction helper
CREATE POLICY org_memberships_instructor_read_org ON public.org_memberships
  FOR SELECT
  USING (
    -- Utiliser la fonction helper au lieu d'une sous-requête directe
    public.is_user_instructor_in_org(auth.uid(), org_memberships.org_id)
  );

-- Commentaire
COMMENT ON FUNCTION public.is_user_instructor_in_org(uuid, uuid) IS 
  'Vérifie si un utilisateur est instructor dans une organisation. Utilise SECURITY DEFINER pour éviter la récursion RLS.';

-- Vérification
SELECT 
  'POLICY CORRIGÉE' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'org_memberships'
  AND policyname = 'org_memberships_instructor_read_org';



