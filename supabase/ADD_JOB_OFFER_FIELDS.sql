-- Ajouter les colonnes manquantes pour les offres d'emploi Beyond Connect
-- Ce script doit être exécuté APRÈS CREATE_BEYOND_CONNECT_COMPLETE.sql

DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'beyond_connect_job_offers'
  ) THEN
    -- Ajouter la colonne hours_per_week si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'beyond_connect_job_offers' 
      AND column_name = 'hours_per_week'
    ) THEN
      ALTER TABLE public.beyond_connect_job_offers
      ADD COLUMN hours_per_week INTEGER;
      
      COMMENT ON COLUMN public.beyond_connect_job_offers.hours_per_week IS 'Nombre d''heures par semaine';
      
      RAISE NOTICE 'Colonne hours_per_week ajoutée à beyond_connect_job_offers';
    ELSE
      RAISE NOTICE 'Colonne hours_per_week existe déjà';
    END IF;
    
    -- Ajouter la colonne required_soft_skills si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'beyond_connect_job_offers' 
      AND column_name = 'required_soft_skills'
    ) THEN
      ALTER TABLE public.beyond_connect_job_offers
      ADD COLUMN required_soft_skills TEXT[];
      
      COMMENT ON COLUMN public.beyond_connect_job_offers.required_soft_skills IS 'Array des soft skills requises (IDs des dimensions)';
      
      RAISE NOTICE 'Colonne required_soft_skills ajoutée à beyond_connect_job_offers';
    ELSE
      RAISE NOTICE 'Colonne required_soft_skills existe déjà';
    END IF;
    
    -- Ajouter la colonne company_presentation si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'beyond_connect_job_offers' 
      AND column_name = 'company_presentation'
    ) THEN
      ALTER TABLE public.beyond_connect_job_offers
      ADD COLUMN company_presentation TEXT;
      
      COMMENT ON COLUMN public.beyond_connect_job_offers.company_presentation IS 'Présentation de l''entreprise';
      
      RAISE NOTICE 'Colonne company_presentation ajoutée à beyond_connect_job_offers';
    ELSE
      RAISE NOTICE 'Colonne company_presentation existe déjà';
    END IF;
  ELSE
    RAISE WARNING 'La table beyond_connect_job_offers n''existe pas. Veuillez d''abord exécuter CREATE_BEYOND_CONNECT_COMPLETE.sql';
  END IF;
END $$;

