-- ============================================
-- Script de vérification : Visibilité de l'apprenant pour le formateur
-- ============================================
-- Ce script vérifie :
-- 1. Les membreships du formateur timmydarcy44@gmail.com
-- 2. Les membreships de l'apprenant j.contentin@laposte.net
-- 3. Si ils sont dans la même organisation
-- 4. Les profils associés
-- ============================================

-- 1. Vérifier les membreships du formateur
SELECT 
  'FORMATEUR MEMBERSHIPS' as "Vérification",
  om.org_id,
  om.user_id,
  om.role,
  p.email as "Email profil",
  p.full_name as "Nom profil",
  o.name as "Nom organisation"
FROM public.org_memberships om
LEFT JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = 'timmydarcy44@gmail.com'
  AND om.role = 'instructor'
ORDER BY o.name;

-- 2. Vérifier les membreships de l'apprenant
SELECT 
  'APPRENANT MEMBERSHIPS' as "Vérification",
  om.org_id,
  om.user_id,
  om.role,
  p.email as "Email profil",
  p.full_name as "Nom profil",
  o.name as "Nom organisation"
FROM public.org_memberships om
LEFT JOIN public.profiles p ON om.user_id = p.id
LEFT JOIN public.organizations o ON om.org_id = o.id
WHERE p.email = 'j.contentin@laposte.net'
  AND om.role = 'learner'
ORDER BY o.name;

-- 3. Vérifier les organisations communes
SELECT 
  'ORGANISATIONS COMMUNES' as "Vérification",
  o.id as "org_id",
  o.name as "Nom organisation",
  COUNT(DISTINCT CASE WHEN om_instructor.role = 'instructor' THEN om_instructor.user_id END) as "Nb formateurs",
  COUNT(DISTINCT CASE WHEN om_learner.role = 'learner' THEN om_learner.user_id END) as "Nb apprenants",
  STRING_AGG(DISTINCT p_instructor.email, ', ') as "Formateurs",
  STRING_AGG(DISTINCT p_learner.email, ', ') as "Apprenants"
FROM public.organizations o
LEFT JOIN public.org_memberships om_instructor ON o.id = om_instructor.org_id AND om_instructor.role = 'instructor'
LEFT JOIN public.org_memberships om_learner ON o.id = om_learner.org_id AND om_learner.role = 'learner'
LEFT JOIN public.profiles p_instructor ON om_instructor.user_id = p_instructor.id
LEFT JOIN public.profiles p_learner ON om_learner.user_id = p_learner.id
WHERE o.id IN (
  SELECT org_id FROM public.org_memberships om1
  JOIN public.profiles p1 ON om1.user_id = p1.id
  WHERE p1.email = 'timmydarcy44@gmail.com' AND om1.role = 'instructor'
)
  AND o.id IN (
    SELECT org_id FROM public.org_memberships om2
    JOIN public.profiles p2 ON om2.user_id = p2.id
    WHERE p2.email = 'j.contentin@laposte.net' AND om2.role = 'learner'
  )
GROUP BY o.id, o.name;

-- 4. Vérifier les IDs exacts des utilisateurs
SELECT 
  'UTILISATEURS AUTH' as "Vérification",
  u.id as "auth_user_id",
  u.email as "auth_email",
  p.id as "profile_id",
  p.email as "profile_email",
  p.full_name,
  p.role as "profile_role"
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN ('timmydarcy44@gmail.com', 'j.contentin@laposte.net')
ORDER BY u.email;

-- 5. Test de la requête qui devrait être exécutée par getFormateurLearners
-- (Remplacer les UUIDs par les vrais IDs de la requête 4)
SELECT 
  'TEST REQUÊTE GETFORMATEURLEARNERS' as "Vérification",
  om.user_id,
  om.org_id,
  om.role,
  p.id as "profile_id",
  p.email,
  p.full_name
FROM public.org_memberships om
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE om.org_id IN (
  -- Organisations où timmydarcy44@gmail.com est instructor
  SELECT om_instructor.org_id
  FROM public.org_memberships om_instructor
  JOIN public.profiles p_instructor ON om_instructor.user_id = p_instructor.id
  WHERE p_instructor.email = 'timmydarcy44@gmail.com'
    AND om_instructor.role = 'instructor'
)
  AND om.role = 'learner'
ORDER BY p.email;



