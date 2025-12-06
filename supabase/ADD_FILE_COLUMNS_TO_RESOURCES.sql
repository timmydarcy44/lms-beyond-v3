-- Ajouter les colonnes file_url, video_url, audio_url à la table resources si elles n'existent pas
-- Ces colonnes permettront de stocker les URLs des fichiers PDF, vidéos et audios

DO $$
BEGIN
    -- Ajouter file_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'resources' 
          AND column_name = 'file_url'
    ) THEN
        ALTER TABLE public.resources ADD COLUMN file_url TEXT;
        RAISE NOTICE 'Colonne file_url ajoutée à la table resources';
    ELSE
        RAISE NOTICE 'Colonne file_url existe déjà';
    END IF;

    -- Ajouter video_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'resources' 
          AND column_name = 'video_url'
    ) THEN
        ALTER TABLE public.resources ADD COLUMN video_url TEXT;
        RAISE NOTICE 'Colonne video_url ajoutée à la table resources';
    ELSE
        RAISE NOTICE 'Colonne video_url existe déjà';
    END IF;

    -- Ajouter audio_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'resources' 
          AND column_name = 'audio_url'
    ) THEN
        ALTER TABLE public.resources ADD COLUMN audio_url TEXT;
        RAISE NOTICE 'Colonne audio_url ajoutée à la table resources';
    ELSE
        RAISE NOTICE 'Colonne audio_url existe déjà';
    END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'resources'
  AND column_name IN ('file_url', 'video_url', 'audio_url')
ORDER BY column_name;

