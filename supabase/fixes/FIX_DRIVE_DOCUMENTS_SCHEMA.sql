-- Ajouter les colonnes manquantes à drive_documents pour supporter le partage
DO $$
BEGIN
  -- Ajouter status si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN status text DEFAULT 'draft' 
    CHECK (status IN ('draft', 'shared'));
    RAISE NOTICE 'Column "status" added to drive_documents';
  END IF;

  -- Ajouter shared_with si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN shared_with uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Column "shared_with" added to drive_documents';
  END IF;

  -- Ajouter title si elle n'existe pas (au lieu de name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'title'
  ) THEN
    -- Si name existe, utiliser name comme title
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'drive_documents' 
        AND column_name = 'name'
    ) THEN
      ALTER TABLE public.drive_documents 
      ADD COLUMN title text;
      
      -- Copier name vers title
      UPDATE public.drive_documents SET title = name WHERE title IS NULL;
      
      RAISE NOTICE 'Column "title" added to drive_documents (populated from name)';
    ELSE
      ALTER TABLE public.drive_documents 
      ADD COLUMN title text NOT NULL DEFAULT 'Document sans titre';
      RAISE NOTICE 'Column "title" added to drive_documents';
    END IF;
  END IF;

  -- Ajouter author_id si elle n'existe pas (au lieu de user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'author_id'
  ) THEN
    -- Si user_id existe, utiliser user_id comme author_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'drive_documents' 
        AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.drive_documents 
      ADD COLUMN author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
      
      -- Copier user_id vers author_id
      UPDATE public.drive_documents SET author_id = user_id WHERE author_id IS NULL;
      
      -- Rendre author_id NOT NULL si possible
      ALTER TABLE public.drive_documents 
      ALTER COLUMN author_id SET NOT NULL;
      
      RAISE NOTICE 'Column "author_id" added to drive_documents (populated from user_id)';
    ELSE
      ALTER TABLE public.drive_documents 
      ADD COLUMN author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE;
      RAISE NOTICE 'Column "author_id" added to drive_documents';
    END IF;
  END IF;

  -- Ajouter content si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'content'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN content text;
    RAISE NOTICE 'Column "content" added to drive_documents';
  END IF;

  -- Ajouter file_url si elle n'existe pas (au lieu de url)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'file_url'
  ) THEN
    -- Si url existe, utiliser url comme file_url
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'drive_documents' 
        AND column_name = 'url'
    ) THEN
      ALTER TABLE public.drive_documents 
      ADD COLUMN file_url text;
      
      -- Copier url vers file_url
      UPDATE public.drive_documents SET file_url = url WHERE file_url IS NULL;
      
      RAISE NOTICE 'Column "file_url" added to drive_documents (populated from url)';
    ELSE
      ALTER TABLE public.drive_documents 
      ADD COLUMN file_url text;
      RAISE NOTICE 'Column "file_url" added to drive_documents';
    END IF;
  END IF;

  -- Ajouter word_count si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'word_count'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN word_count integer DEFAULT 0;
    RAISE NOTICE 'Column "word_count" added to drive_documents';
  END IF;

  -- Ajouter deposited_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'deposited_at'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN deposited_at timestamptz;
    
    -- Si created_at existe, utiliser created_at comme deposited_at
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'drive_documents' 
        AND column_name = 'created_at'
    ) THEN
      UPDATE public.drive_documents SET deposited_at = created_at WHERE deposited_at IS NULL;
    END IF;
    
    RAISE NOTICE 'Column "deposited_at" added to drive_documents';
  END IF;

  -- Ajouter submitted_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN submitted_at timestamptz;
    RAISE NOTICE 'Column "submitted_at" added to drive_documents';
  END IF;

  -- Ajouter is_read si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.drive_documents 
    ADD COLUMN is_read boolean DEFAULT false;
    RAISE NOTICE 'Column "is_read" added to drive_documents';
  END IF;

  -- Créer un index sur shared_with pour les performances
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = 'drive_documents' 
      AND indexname = 'drive_documents_shared_with_idx'
  ) THEN
    CREATE INDEX drive_documents_shared_with_idx ON public.drive_documents(shared_with);
    RAISE NOTICE 'Index on shared_with created';
  END IF;

  -- Créer un index sur author_id pour les performances
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = 'drive_documents' 
      AND indexname = 'drive_documents_author_id_idx'
  ) THEN
    CREATE INDEX drive_documents_author_id_idx ON public.drive_documents(author_id);
    RAISE NOTICE 'Index on author_id created';
  END IF;

  -- Créer un index sur status pour les performances
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'drive_documents' 
      AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = 'drive_documents' 
      AND indexname = 'drive_documents_status_idx'
  ) THEN
    CREATE INDEX drive_documents_status_idx ON public.drive_documents(status);
    RAISE NOTICE 'Index on status created';
  END IF;

END $$;

-- Afficher la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drive_documents'
ORDER BY ordinal_position;




