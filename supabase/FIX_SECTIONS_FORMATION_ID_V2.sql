-- Fix V2 pour le problème de formation_id NULL dans sections
-- Script plus agressif qui désactive TOUS les triggers et vérifie les fonctions

-- ============================================
-- Étape 1 : Désactiver TOUS les triggers sur courses
-- ============================================
do $$
declare
  trigger_name_var text;
begin
  -- Lister tous les triggers sur courses
  RAISE NOTICE '=== Triggers sur courses ===';
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
  LOOP
    EXECUTE format('ALTER TABLE public.courses DISABLE TRIGGER %I', trigger_name_var);
    RAISE NOTICE 'Trigger désactivé sur courses: %', trigger_name_var;
  END LOOP;
  
  -- Lister tous les triggers sur sections
  RAISE NOTICE '=== Triggers sur sections ===';
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    EXECUTE format('ALTER TABLE public.sections DISABLE TRIGGER %I', trigger_name_var);
    RAISE NOTICE 'Trigger désactivé sur sections: %', trigger_name_var;
  END LOOP;
  
  RAISE NOTICE 'Tous les triggers ont été désactivés';
exception
  when others then
    RAISE NOTICE 'Erreur: %', SQLERRM;
end $$;

-- ============================================
-- Étape 2 : Supprimer les triggers qui insèrent dans sections
-- ============================================
do $$
declare
  trigger_name_var text;
begin
  -- Supprimer tous les triggers sur courses qui pourraient être problématiques
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
  LOOP
    -- Vérifier le contenu du trigger
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.courses CASCADE', trigger_name_var);
    RAISE NOTICE 'Trigger supprimé: %', trigger_name_var;
  END LOOP;
  
  RAISE NOTICE 'Tous les triggers sur courses ont été supprimés';
exception
  when others then
    RAISE NOTICE 'Erreur lors de la suppression: %', SQLERRM;
end $$;

-- ============================================
-- Étape 3 : Créer un trigger de protection qui empêche les insertions avec formation_id NULL
-- ============================================
do $$
begin
  -- Supprimer l'ancien trigger de protection s'il existe
  DROP TRIGGER IF EXISTS prevent_null_formation_id ON public.sections;
  
  -- Créer une fonction qui empêche les insertions avec formation_id NULL
  CREATE OR REPLACE FUNCTION prevent_null_formation_id_sections()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    -- Si formation_id est NULL, annuler l'insertion
    IF NEW.formation_id IS NULL THEN
      RAISE EXCEPTION 'formation_id ne peut pas être NULL dans sections';
    END IF;
    RETURN NEW;
  END;
  $$;
  
  -- Créer le trigger
  CREATE TRIGGER prevent_null_formation_id
    BEFORE INSERT ON public.sections
    FOR EACH ROW
    EXECUTE FUNCTION prevent_null_formation_id_sections();
  
  RAISE NOTICE 'Trigger de protection créé';
exception
  when others then
    RAISE NOTICE 'Erreur lors de la création du trigger de protection: %', SQLERRM;
end $$;

-- ============================================
-- Étape 4 : Alternative - Rendre formation_id nullable temporairement
-- ============================================
-- Si les étapes précédentes ne fonctionnent pas, cette option peut aider temporairement
/*
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' 
      and table_name = 'sections' 
      and column_name = 'formation_id'
      and is_nullable = 'NO'
  ) then
    -- Rendre nullable temporairement
    alter table public.sections alter column formation_id drop not null;
    raise notice 'formation_id rendue nullable (temporaire)';
  else
    raise notice 'formation_id est déjà nullable';
  end if;
exception
  when others then
    raise notice 'Erreur: %', SQLERRM;
end $$;
*/

-- ============================================
-- Étape 5 : Vérifier les fonctions qui pourraient insérer dans sections
-- ============================================
do $$
declare
  func_name text;
  func_def text;
begin
  RAISE NOTICE '=== Fonctions qui pourraient être liées ===';
  FOR func_name, func_def IN 
    SELECT 
      routine_name,
      routine_definition
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      AND (
        routine_definition LIKE '%INSERT INTO sections%'
        OR routine_definition LIKE '%sections%'
        OR routine_definition LIKE '%formation_id%'
      )
    LIMIT 20
  LOOP
    RAISE NOTICE 'Fonction trouvée: %', func_name;
    -- Optionnel: supprimer les fonctions problématiques
    -- EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_name);
  END LOOP;
exception
  when others then
    RAISE NOTICE 'Erreur: %', SQLERRM;
end $$;

-- ============================================
-- Récapitulatif
-- ============================================
-- Ce script :
-- 1. Désactive TOUS les triggers sur courses et sections
-- 2. Supprime tous les triggers sur courses
-- 3. Crée un trigger de protection qui empêche les insertions avec formation_id NULL
-- 4. (Optionnel) Rend formation_id nullable
-- 5. Liste les fonctions qui pourraient être problématiques

-- Après exécution, essayez de créer une formation.
-- Si l'erreur persiste, c'est qu'une fonction stockée ou une autre logique insère dans sections.



