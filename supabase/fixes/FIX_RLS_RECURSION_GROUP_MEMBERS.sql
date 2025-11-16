-- ============================================
-- Script pour corriger la récursion infinie dans group_members
-- ============================================
-- Problème : La policy group_members_read fait un EXISTS sur group_members
-- ce qui déclenche une récursion car cette requête est aussi soumise à RLS
-- ============================================

-- Supprimer les policies problématiques
DROP POLICY IF EXISTS group_members_read ON public.group_members;
DROP POLICY IF EXISTS group_members_write ON public.group_members;

-- Créer une fonction helper qui vérifie si un utilisateur est membre d'un groupe
-- Cette fonction utilise SECURITY DEFINER pour bypass RLS et éviter la récursion
CREATE OR REPLACE FUNCTION public.is_user_member_of_group(p_user_id uuid, p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Vérifier directement dans group_members sans passer par RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.group_members
    WHERE user_id = p_user_id
      AND group_id = p_group_id
  );
END;
$$;

-- Créer une fonction helper qui vérifie si un utilisateur est propriétaire d'un groupe
CREATE OR REPLACE FUNCTION public.is_user_owner_of_group(p_user_id uuid, p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Vérifier directement dans groups sans passer par RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.groups
    WHERE id = p_group_id
      AND owner_id = p_user_id
  );
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.is_user_member_of_group(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_owner_of_group(uuid, uuid) TO authenticated;

-- Recréer la policy group_members_read en utilisant les fonctions helper
CREATE POLICY group_members_read ON public.group_members
  FOR SELECT
  USING (
    -- Utiliser la fonction helper au lieu d'une sous-requête directe
    public.is_user_member_of_group(auth.uid(), group_members.group_id)
    OR public.is_user_owner_of_group(auth.uid(), group_members.group_id)
    OR public.user_has_role(auth.uid(), array['admin','instructor'])
  );

-- Recréer la policy group_members_write en utilisant la fonction helper
CREATE POLICY group_members_write ON public.group_members
  FOR ALL
  USING (
    public.is_user_owner_of_group(auth.uid(), group_members.group_id)
    OR public.user_has_role(auth.uid(), array['admin','instructor'])
  )
  WITH CHECK (
    public.is_user_owner_of_group(auth.uid(), group_members.group_id)
    OR public.user_has_role(auth.uid(), array['admin','instructor'])
  );

-- Corriger aussi la politique groups_read qui utilise group_members
DROP POLICY IF EXISTS groups_read ON public.groups;

CREATE POLICY groups_read ON public.groups
  FOR SELECT
  USING (
    -- Utiliser la fonction helper au lieu d'une sous-requête directe
    public.is_user_member_of_group(auth.uid(), groups.id)
    OR public.is_user_owner_of_group(auth.uid(), groups.id)
    OR public.user_has_role(auth.uid(), array['admin','instructor'])
  );

-- Commentaires
COMMENT ON FUNCTION public.is_user_member_of_group(uuid, uuid) IS 
  'Vérifie si un utilisateur est membre d''un groupe. Utilise SECURITY DEFINER pour éviter la récursion RLS.';

COMMENT ON FUNCTION public.is_user_owner_of_group(uuid, uuid) IS 
  'Vérifie si un utilisateur est propriétaire d''un groupe. Utilise SECURITY DEFINER pour éviter la récursion RLS.';

-- Vérification
SELECT 
  'POLICIES CORRIGÉES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('group_members', 'groups')
  AND policyname IN ('group_members_read', 'group_members_write', 'groups_read')
ORDER BY tablename, policyname;

