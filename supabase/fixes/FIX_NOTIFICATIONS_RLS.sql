-- ============================================
-- CORRECTION DES RLS POLICIES POUR notifications
-- ============================================
-- Pour permettre aux formateurs de créer des notifications pour les apprenants
-- ============================================

-- 1. Vérifier les politiques actuelles
SELECT 
  json_build_object(
    'type', 'CURRENT_POLICIES',
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'qual', qual,
          'with_check', with_check
        )
      ),
      '[]'::json
    )
  ) as result
FROM pg_policies
WHERE tablename = 'notifications';

-- 2. Supprimer les politiques existantes problématiques
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Instructors can create notifications" ON public.notifications;

-- 3. Créer une politique pour que les utilisateurs voient leurs notifications
-- La table utilise recipient_id (colonne principale)
DO $$
BEGIN
  -- Utiliser recipient_id (colonne principale qui existe toujours)
  DROP POLICY IF EXISTS "notifications_user_select" ON public.notifications;
  CREATE POLICY "notifications_user_select"
    ON public.notifications FOR SELECT
    USING (auth.uid() = recipient_id);
  
  DROP POLICY IF EXISTS "notifications_user_update" ON public.notifications;
  CREATE POLICY "notifications_user_update"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);
END $$;

-- 5. Créer une politique pour que les formateurs puissent créer des notifications
-- Utiliser la fonction SECURITY DEFINER pour éviter la récursion
CREATE POLICY "notifications_instructor_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_user_instructor());

-- 6. Résumé
SELECT 
  json_build_object(
    'type', 'SUMMARY',
    'policies_created', (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = 'notifications'
    ),
    'status', 'Correction terminée'
  ) as result;

