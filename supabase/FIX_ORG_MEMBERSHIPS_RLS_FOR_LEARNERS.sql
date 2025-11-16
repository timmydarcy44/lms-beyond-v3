-- ============================================
-- PERMETTRE AUX APPRENANTS DE LIRE LES MEMBERSHIPS DES FORMATEURS
-- ============================================
-- Problème : Les apprenants ne peuvent pas lire les membreships des formateurs
-- dans leur organisation, ce qui empêche l'API /api/drive/instructors de fonctionner
-- ============================================

-- 1. Vérifier les policies existantes
SELECT 
  'EXISTING POLICIES' as "Info",
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'org_memberships'
ORDER BY policyname;

-- 2. Créer une policy pour permettre aux apprenants de lire les membreships
--    des formateurs dans les organisations où ils sont membres

-- Supprimer la policy si elle existe déjà
DROP POLICY IF EXISTS org_memberships_learner_read_instructors ON public.org_memberships;

-- Créer une fonction helper pour vérifier si un utilisateur est membre d'une organisation
-- Cette fonction utilise SECURITY DEFINER pour bypass RLS et éviter la récursion
CREATE OR REPLACE FUNCTION public.is_user_member_of_org(p_user_id uuid, p_org_id uuid)
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
  );
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.is_user_member_of_org(uuid, uuid) TO authenticated;

-- Créer la policy pour permettre aux apprenants de lire les membreships des formateurs
-- dans les organisations où ils sont membres
CREATE POLICY org_memberships_learner_read_instructors ON public.org_memberships
  FOR SELECT
  USING (
    -- L'utilisateur peut lire son propre membership
    user_id = auth.uid()
    OR
    -- L'utilisateur peut lire les membreships des formateurs dans les organisations
    -- où il est membre (utilise la fonction helper pour éviter la récursion)
    (
      role = 'instructor'
      AND public.is_user_member_of_org(auth.uid(), org_id)
    )
  );

-- 3. Alternative : Policy plus permissive qui permet de lire tous les membreships
--    dans les organisations où l'utilisateur est membre
DROP POLICY IF EXISTS org_memberships_read_org_members ON public.org_memberships;

CREATE POLICY org_memberships_read_org_members ON public.org_memberships
  FOR SELECT
  USING (
    -- L'utilisateur peut lire son propre membership
    user_id = auth.uid()
    OR
    -- L'utilisateur peut lire tous les membreships dans les organisations
    -- où il est membre (peu importe son rôle ou celui des autres)
    public.is_user_member_of_org(auth.uid(), org_id)
  );

-- 4. Vérification des policies créées
SELECT 
  'POLICIES AFTER FIX' as "Info",
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'org_memberships'
  AND policyname IN ('org_memberships_learner_read_instructors', 'org_memberships_read_org_members')
ORDER BY policyname;

-- 5. Commentaire
COMMENT ON FUNCTION public.is_user_member_of_org(uuid, uuid) IS 
  'Vérifie si un utilisateur est membre d''une organisation. Utilise SECURITY DEFINER pour éviter la récursion RLS.';

-- 6. Test de la fonction
SELECT 
  'FUNCTION TEST' as "Info",
  public.is_user_member_of_org(
    (SELECT id FROM public.profiles WHERE email = 'j.contentin@laposte.net' LIMIT 1),
    '53e793ca-fc47-402b-bc90-cea5c588c0e8'
  ) as learner_is_member,
  public.is_user_member_of_org(
    (SELECT id FROM public.profiles WHERE email = 'timmydarcy44@gmail.com' LIMIT 1),
    '53e793ca-fc47-402b-bc90-cea5c588c0e8'
  ) as instructor_is_member;




