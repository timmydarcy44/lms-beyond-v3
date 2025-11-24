-- Script complet pour ajouter timdarcypro@gmail.com et fixer RLS
-- ================================================================

-- 1. Vérifier que l'utilisateur existe
SELECT 
  'Step 1: User Check' as "Info",
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE email = 'timdarcypro@gmail.com';

-- 2. Fixer les RLS policies pour super_admins (permettre la vérification)
DROP POLICY IF EXISTS super_admins_read ON public.super_admins;
DROP POLICY IF EXISTS super_admins_select_own ON public.super_admins;

-- Policy qui permet à chaque utilisateur de voir s'il est dans super_admins
CREATE POLICY super_admins_select_own ON public.super_admins
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Ajouter timdarcypro@gmail.com comme Super Admin
INSERT INTO public.super_admins (user_id, created_by, notes, is_active)
SELECT 
  id,
  id,
  'Super Admin ajouté manuellement',
  TRUE
FROM public.profiles 
WHERE email = 'timdarcypro@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET
  is_active = TRUE,
  notes = 'Super Admin ajouté manuellement - réactivé';

-- 4. Mettre à jour le rôle si nécessaire
UPDATE public.profiles
SET role = COALESCE(role, 'admin')
WHERE email = 'timdarcypro@gmail.com'
  AND (role IS NULL OR role = '');

-- 5. Vérifier que tout est correct
SELECT 
  'Step 2: Verification' as "Info",
  sa.user_id,
  sa.is_active,
  sa.created_at,
  sa.notes,
  p.email,
  p.full_name,
  p.role as "profile_role"
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.user_id
WHERE p.email = 'timdarcypro@gmail.com';

-- 6. Test de la fonction is_super_admin
SELECT 
  'Step 3: Function Test' as "Info",
  public.is_super_admin((SELECT id FROM public.profiles WHERE email = 'timdarcypro@gmail.com')) as "is_super_admin_result";









