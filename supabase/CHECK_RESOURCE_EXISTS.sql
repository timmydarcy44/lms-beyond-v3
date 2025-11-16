-- ============================================
-- Script pour vérifier si une ressource existe
-- ============================================
-- Remplacez l'UUID par celui de votre ressource ou utilisez le titre
-- ============================================

-- 1. Vérifier d'abord la structure de la table resources
SELECT 
  'STRUCTURE TABLE RESOURCES' as "Info",
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'resources'
ORDER BY ordinal_position;

-- 2. Lister TOUTES les ressources avec les colonnes de base uniquement
SELECT 
  'TOUTES LES RESSOURCES' as "Info",
  r.id,
  r.title,
  r.created_by,
  r.org_id,
  r.created_at,
  p_created.email as "creator_email"
FROM public.resources r
LEFT JOIN public.profiles p_created ON r.created_by = p_created.id
ORDER BY r.created_at DESC
LIMIT 20;

-- 3. Vérifier les membreships d'un utilisateur spécifique
-- Remplacez 'timmydarcy44@gmail.com' par l'email du formateur
SELECT 
  'MEMBERSHIPS FORMATEUR' as "Info",
  om.org_id,
  om.user_id,
  om.role,
  o.name as "org_name",
  p.email as "user_email"
FROM public.org_memberships om
LEFT JOIN public.organizations o ON om.org_id = o.id
LEFT JOIN public.profiles p ON om.user_id = p.id
WHERE p.email = 'timmydarcy44@gmail.com'
ORDER BY om.role;

-- 4. Vérifier les ressources créées récemment par un formateur
-- Remplacez l'email ci-dessous
SELECT 
  'RESSOURCES RECENTES' as "Info",
  r.id,
  r.title,
  r.created_by,
  r.org_id,
  r.created_at,
  p_created.email as "creator_email"
FROM public.resources r
LEFT JOIN public.profiles p_created ON r.created_by = p_created.id
WHERE p_created.email = 'timmydarcy44@gmail.com'
ORDER BY r.created_at DESC
LIMIT 10;

-- 5. Vérifier les ressources par organisation
SELECT 
  'RESSOURCES PAR ORG' as "Info",
  r.id,
  r.title,
  r.org_id,
  r.created_by,
  o.name as "org_name"
FROM public.resources r
LEFT JOIN public.organizations o ON r.org_id = o.id
WHERE r.org_id IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 10;

