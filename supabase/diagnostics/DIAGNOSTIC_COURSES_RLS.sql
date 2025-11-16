-- Diagnostic des policies RLS pour courses
-- =========================================

-- 1. Vérifier toutes les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

-- 2. Vérifier si la fonction is_super_admin existe
SELECT 
  'FONCTION is_super_admin' as "Info",
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'is_super_admin';

-- 3. Vérifier si la fonction can_user_read_course existe
SELECT 
  'FONCTION can_user_read_course' as "Info",
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'can_user_read_course';

-- 4. Vérifier les rôles des utilisateurs
SELECT 
  'ROLES UTILISATEURS' as "Info",
  id,
  email,
  role,
  full_name
FROM public.profiles
WHERE role IN ('super_admin', 'admin', 'instructor')
ORDER BY role, email;

-- 5. Tester la fonction is_super_admin pour timdarcypro@gmail.com
SELECT 
  'TEST is_super_admin' as "Info",
  p.email,
  p.role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') 
    THEN 'Fonction existe'
    ELSE 'Fonction n''existe pas'
  END as fonction_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin')
    THEN (SELECT public.is_super_admin())
    ELSE NULL
  END as is_super_admin_result
FROM public.profiles p
WHERE p.email = 'timdarcypro@gmail.com';

-- 6. Compter les courses
SELECT 
  'COMPTE COURSES' as "Info",
  COUNT(*) as total_courses,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'draft') as draft,
  COUNT(*) FILTER (WHERE creator_id = (SELECT id FROM public.profiles WHERE email = 'timdarcypro@gmail.com')) as created_by_super_admin
FROM public.courses;




