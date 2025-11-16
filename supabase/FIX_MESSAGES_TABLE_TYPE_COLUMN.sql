-- ============================================
-- CORRECTION DE LA TABLE MESSAGES
-- ============================================
-- Ce script ajoute la colonne "type" si elle n'existe pas
-- À exécuter dans Supabase Studio SQL Editor
-- ============================================

BEGIN;

-- Vérifier et ajouter la colonne type si elle n'existe pas
DO $$
BEGIN
  -- Si la table messages existe mais sans la colonne type
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN type text NOT NULL DEFAULT 'message';
    ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (type IN ('message', 'consigne', 'notification'));
    
    RAISE NOTICE 'Colonne "type" ajoutée à la table messages';
  ELSE
    RAISE NOTICE 'La colonne "type" existe déjà ou la table messages n''existe pas';
  END IF;
END $$;

-- Créer l'index sur type s'il n'existe pas
CREATE INDEX IF NOT EXISTS messages_type_idx ON public.messages (type);

COMMIT;




