-- ============================================
-- CORRECTION DE LA STRUCTURE ET RLS POUR LA MESSAGERIE
-- ============================================
-- Basé sur l'audit, corrections nécessaires :
-- 1. messages utilise subject/body au lieu de content
-- 2. Ajouter les politiques INSERT pour messages et message_recipients
-- 3. S'assurer que metadata existe ou utiliser le payload
-- ============================================

-- 1. Ajouter la colonne metadata à messages si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN metadata jsonb;
    RAISE NOTICE 'Colonne metadata ajoutée à messages';
  ELSE
    RAISE NOTICE 'Colonne metadata existe déjà dans messages';
  END IF;
END $$;

-- 2. Ajouter la colonne content à messages si elle n'existe pas (pour compatibilité)
-- On peut utiliser body comme alias si content n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'content'
  ) THEN
    -- Créer une colonne content ou utiliser une fonction/vue pour mapper body -> content
    ALTER TABLE public.messages ADD COLUMN content text;
    -- Copier body vers content pour les données existantes
    UPDATE public.messages SET content = body WHERE content IS NULL AND body IS NOT NULL;
    RAISE NOTICE 'Colonne content ajoutée à messages et remplie depuis body';
  ELSE
    RAISE NOTICE 'Colonne content existe déjà dans messages';
  END IF;
END $$;

-- 3. RLS POLICIES - messages (ajouter INSERT si manquant)
SELECT 
  json_build_object(
    'type', 'MESSAGES_INSERT_CHECK',
    'has_insert_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'messages' 
      AND cmd = 'INSERT'
    )
  ) as result;

-- Ajouter politique INSERT pour messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND cmd = 'INSERT'
  ) THEN
    CREATE POLICY "messages_user_insert"
      ON public.messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
    RAISE NOTICE 'Politique INSERT ajoutée pour messages';
  ELSE
    RAISE NOTICE 'Politique INSERT existe déjà pour messages';
  END IF;
END $$;

-- 4. RLS POLICIES - message_recipients (ajouter INSERT si manquant)
SELECT 
  json_build_object(
    'type', 'MESSAGE_RECIPIENTS_INSERT_CHECK',
    'has_insert_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'message_recipients' 
      AND cmd = 'INSERT'
    )
  ) as result;

-- Ajouter politique INSERT pour message_recipients
-- Les formateurs peuvent créer des recipients pour leurs messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'message_recipients' 
    AND cmd = 'INSERT'
  ) THEN
    CREATE POLICY "message_recipients_instructor_insert"
      ON public.message_recipients FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.messages
          WHERE messages.id = message_recipients.message_id
          AND messages.sender_id = auth.uid()
        )
        OR public.is_user_instructor()
      );
    RAISE NOTICE 'Politique INSERT ajoutée pour message_recipients';
  ELSE
    RAISE NOTICE 'Politique INSERT existe déjà pour message_recipients';
  END IF;
END $$;

-- 5. Ajouter politique UPDATE pour message_recipients (pour marquer comme lu)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'message_recipients' 
    AND cmd = 'UPDATE'
  ) THEN
    CREATE POLICY "message_recipients_recipient_update"
      ON public.message_recipients FOR UPDATE
      USING (auth.uid() = recipient_id)
      WITH CHECK (auth.uid() = recipient_id);
    RAISE NOTICE 'Politique UPDATE ajoutée pour message_recipients';
  ELSE
    RAISE NOTICE 'Politique UPDATE existe déjà pour message_recipients';
  END IF;
END $$;

-- 6. Vérifier si drive_documents a created_at ou deposited_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drive_documents' 
    AND column_name = 'created_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drive_documents' 
    AND column_name = 'submitted_at'
  ) THEN
    -- Utiliser submitted_at comme référence de date
    RAISE NOTICE 'drive_documents utilise submitted_at comme date de création';
  END IF;
END $$;

-- 7. Résumé final
SELECT 
  json_build_object(
    'type', 'SUMMARY',
    'messages_metadata_added', EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'metadata'
    ),
    'messages_content_added', EXISTS(
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'content'
    ),
    'messages_insert_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'messages' 
      AND cmd = 'INSERT'
    ),
    'message_recipients_insert_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'message_recipients' 
      AND cmd = 'INSERT'
    ),
    'message_recipients_update_policy', EXISTS(
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'message_recipients' 
      AND cmd = 'UPDATE'
    ),
    'status', 'Corrections terminées'
  ) as result;



