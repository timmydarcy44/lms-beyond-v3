-- Script pour corriger les RLS policies de la table resources
-- Permet aux apprenants de lire les ressources publiées
-- ===============================================================

-- 1. Vérifier les policies existantes
SELECT 
  'POLICIES EXISTANTES' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 2. Vérifier la structure de la table resources
SELECT 
  'STRUCTURE TABLE' as "Info",
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'resources'
  AND column_name IN ('status', 'published')
ORDER BY column_name;

-- 3. Supprimer les policies existantes qui pourraient poser problème
DROP POLICY IF EXISTS resources_public_published ON public.resources;
DROP POLICY IF EXISTS resources_learner_read ON public.resources;

-- 4. Créer une policy qui gère 'published' (la colonne status n'existe pas dans cette base)
-- Vérifier d'abord quelle colonne existe et créer la policy appropriée

DO $$
BEGIN
  -- Vérifier si published (boolean) existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'resources' 
      AND column_name = 'published'
  ) THEN
    -- Créer la policy avec published = true
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'resources' 
        AND policyname = 'resources_learner_published_read'
    ) THEN
      CREATE POLICY resources_learner_published_read ON public.resources
        FOR SELECT
        USING (published = true);
      
      RAISE NOTICE 'Policy créée : resources_learner_published_read avec published = true';
    ELSE
      RAISE NOTICE 'Policy resources_learner_published_read existe déjà';
    END IF;
  END IF;

  -- Vérifier si status (text) existe (optionnel, au cas où)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'resources' 
      AND column_name = 'status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'resources' 
        AND policyname = 'resources_learner_status_read'
    ) THEN
      CREATE POLICY resources_learner_status_read ON public.resources
        FOR SELECT
        USING (status = 'published');
      
      RAISE NOTICE 'Policy créée : resources_learner_status_read avec status = published';
    ELSE
      RAISE NOTICE 'Policy resources_learner_status_read existe déjà';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne status n''existe pas dans resources, seule published sera utilisée';
  END IF;
END $$;

-- 5. Vérifier les policies après modification
SELECT 
  'POLICIES APRES MODIFICATION' as "Info",
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'resources'
ORDER BY policyname;

-- 6. Test : vérifier qu'un apprenant peut lire les ressources publiées
-- Test avec published = true
SELECT 
  'TEST LECTURE RESOURCES (published=true)' as "Info",
  COUNT(*) as "resources_count"
FROM public.resources
WHERE published = true;

-- Test avec status = 'published' (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'resources' 
      AND column_name = 'status'
  ) THEN
    PERFORM 1; -- Ne rien faire, la colonne existe mais on l'a déjà géré dans les policies
    RAISE NOTICE 'Colonne status existe, test non nécessaire car policy déjà créée';
  ELSE
    RAISE NOTICE 'Colonne status n''existe pas, seule la colonne published est utilisée';
  END IF;
END $$;

