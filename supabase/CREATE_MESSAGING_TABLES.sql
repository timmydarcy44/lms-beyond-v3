-- ============================================
-- CRÉATION DES TABLES POUR LA MESSAGERIE
-- ============================================
-- Ce script crée les tables nécessaires pour la messagerie et les notifications
-- À exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- 1. TABLE MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'message' CHECK (type IN ('message', 'consigne', 'notification')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter la colonne type si elle n'existe pas (pour les tables créées précédemment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN type text NOT NULL DEFAULT 'message';
    ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (type IN ('message', 'consigne', 'notification'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_type_idx ON public.messages (type);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at);

-- ============================================
-- 2. TABLE MESSAGE_RECIPIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, recipient_id)
);

-- Ajouter la colonne read si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'message_recipients' 
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.message_recipients ADD COLUMN read boolean NOT NULL DEFAULT false;
    ALTER TABLE public.message_recipients ADD COLUMN read_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS message_recipients_message_id_idx ON public.message_recipients (message_id);
CREATE INDEX IF NOT EXISTS message_recipients_recipient_id_idx ON public.message_recipients (recipient_id);
CREATE INDEX IF NOT EXISTS message_recipients_read_idx ON public.message_recipients (recipient_id, read) WHERE read = false;

-- ============================================
-- 3. TABLE NOTIFICATIONS (alternative/fallback)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'consigne', 'assignment', 'badge', 'reminder')),
  title text NOT NULL,
  message text,
  metadata jsonb,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    -- Ajouter read si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'read'
    ) THEN
      ALTER TABLE public.notifications ADD COLUMN read boolean NOT NULL DEFAULT false;
      ALTER TABLE public.notifications ADD COLUMN read_at timestamptz;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at);

-- ============================================
-- 4. RLS POLICIES POUR MESSAGES
-- ============================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.messages;

-- Les utilisateurs peuvent voir les messages qu'ils ont envoyés
CREATE POLICY "Users can view their own sent messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id);

-- Les utilisateurs peuvent créer leurs propres messages
CREATE POLICY "Users can create their own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 5. RLS POLICIES POUR MESSAGE_RECIPIENTS
-- ============================================
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view messages sent to them" ON public.message_recipients;
DROP POLICY IF EXISTS "Users can update their own message recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Instructors can create message recipients" ON public.message_recipients;

-- Les utilisateurs peuvent voir les messages qui leur sont destinés
CREATE POLICY "Users can view messages sent to them"
  ON public.message_recipients FOR SELECT
  USING (auth.uid() = recipient_id);

-- Les utilisateurs peuvent marquer leurs messages comme lus
CREATE POLICY "Users can update their own message recipients"
  ON public.message_recipients FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Les formateurs peuvent créer des destinataires pour leurs messages
CREATE POLICY "Instructors can create message recipients"
  ON public.message_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- ============================================
-- 6. RLS POLICIES POUR NOTIFICATIONS
-- ============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Instructors can create notifications" ON public.notifications;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les formateurs peuvent créer des notifications pour leurs apprenants
CREATE POLICY "Instructors can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- ============================================
-- 7. STORAGE BUCKET POUR LES CONSIGNES
-- ============================================
-- Note: À créer manuellement dans Supabase Storage si nécessaire
-- Bucket name: "consignes"
-- Public: false (privé)
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*

COMMIT;

-- Message final
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TABLES DE MESSAGERIE CRÉÉES';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables créées: messages, message_recipients, notifications';
  RAISE NOTICE 'RLS activé pour toutes les tables';
  RAISE NOTICE 'Pensez à créer le bucket "consignes" dans Supabase Storage';
END $$;

