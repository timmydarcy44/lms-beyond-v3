-- ============================================
-- CORRECTION DE LA TABLE MESSAGE_RECIPIENTS
-- ============================================
-- Ce script ajoute les colonnes "read" et "read_at" si elles n'existent pas
-- À exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- Ajouter les colonnes read et read_at si elles n'existent pas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'message_recipients'
  ) THEN
    -- Ajouter read si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message_recipients' 
      AND column_name = 'read'
    ) THEN
      ALTER TABLE public.message_recipients ADD COLUMN read boolean NOT NULL DEFAULT false;
      RAISE NOTICE 'Colonne "read" ajoutée à la table message_recipients';
    END IF;
    
    -- Ajouter read_at si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'message_recipients' 
      AND column_name = 'read_at'
    ) THEN
      ALTER TABLE public.message_recipients ADD COLUMN read_at timestamptz;
      RAISE NOTICE 'Colonne "read_at" ajoutée à la table message_recipients';
    END IF;
  ELSE
    RAISE NOTICE 'La table message_recipients n''existe pas';
  END IF;
END $$;

-- Créer l'index sur read s'il n'existe pas
CREATE INDEX IF NOT EXISTS message_recipients_read_idx ON public.message_recipients (recipient_id, read) WHERE read = false;

COMMIT;




