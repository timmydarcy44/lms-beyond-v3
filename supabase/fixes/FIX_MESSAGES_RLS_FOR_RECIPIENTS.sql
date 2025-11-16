-- ============================================
-- CORRECTION RLS POUR MESSAGES : Permettre aux destinataires de lire
-- ============================================
-- Le problème : Les apprenants ne peuvent que lire leurs propres messages envoyés
-- Solution : Ajouter une politique pour lire les messages où ils sont destinataires
-- ============================================

-- Supprimer la politique SELECT existante si elle est trop restrictive
DO $$
BEGIN
  -- Supprimer la politique actuelle qui ne permet que de lire ses propres messages envoyés
  DROP POLICY IF EXISTS "sel_messages_by_sender" ON public.messages;
  RAISE NOTICE 'Ancienne politique SELECT supprimée';
END $$;

-- Ajouter une nouvelle politique SELECT qui permet :
-- 1. De lire les messages qu'on a envoyés
-- 2. De lire les messages pour lesquels on est destinataire dans message_recipients
DO $$
BEGIN
  CREATE POLICY "messages_select_sender_or_recipient"
    ON public.messages FOR SELECT
    USING (
      -- Peut lire ses propres messages envoyés
      sender_id = auth.uid()
      OR
      -- Peut lire les messages pour lesquels on est destinataire
      EXISTS (
        SELECT 1 FROM public.message_recipients mr
        WHERE mr.message_id = messages.id
        AND mr.recipient_id = auth.uid()
      )
    );
  RAISE NOTICE 'Nouvelle politique SELECT créée pour messages';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Politique messages_select_sender_or_recipient existe déjà';
END $$;

-- Vérification finale
SELECT 
  json_build_object(
    'type', 'MESSAGES_RLS_SELECT_AFTER_FIX',
    'policies', COALESCE(
      json_agg(
        json_build_object(
          'policyname', policyname,
          'cmd', cmd,
          'qual', qual
        )
      ),
      '[]'::json
    ),
    'status', 'Politique SELECT mise à jour pour permettre aux destinataires de lire'
  ) as result
FROM pg_policies
WHERE tablename = 'messages'
AND cmd = 'SELECT';

