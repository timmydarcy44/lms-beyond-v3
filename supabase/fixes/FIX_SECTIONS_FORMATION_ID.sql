-- Fix pour le problème de formation_id NULL dans sections
-- Ce script désactive ou corrige les triggers qui créent automatiquement des sections
-- et s'assure que le système utilise uniquement builder_snapshot

-- ============================================
-- Option 1 : Désactiver les triggers qui créent automatiquement des sections
-- ============================================
do $$
declare
  trigger_name_var text;
begin
  -- Désactiver tous les triggers sur courses qui pourraient créer des sections
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
      AND (action_statement LIKE '%sections%' OR action_statement LIKE '%formation_id%')
  LOOP
    EXECUTE format('ALTER TABLE public.courses DISABLE TRIGGER %I', trigger_name_var);
    RAISE NOTICE 'Trigger désactivé: %', trigger_name_var;
  END LOOP;
  
  -- Désactiver les triggers sur sections aussi
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    EXECUTE format('ALTER TABLE public.sections DISABLE TRIGGER %I', trigger_name_var);
    RAISE NOTICE 'Trigger désactivé sur sections: %', trigger_name_var;
  END LOOP;
  
  RAISE NOTICE 'Triggers désactivés avec succès';
exception
  when others then
    RAISE NOTICE 'Erreur lors de la désactivation des triggers: %', SQLERRM;
end $$;

-- ============================================
-- Option 2 : Rendre formation_id nullable (si on veut garder les triggers)
-- ============================================
-- Cette option n'est pas recommandée car elle casse la contrainte métier
-- mais peut être utilisée en dernier recours

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
    alter table public.sections alter column formation_id drop not null;
    raise notice 'formation_id rendue nullable';
  else
    raise notice 'formation_id est déjà nullable ou n''existe pas';
  end if;
end $$;
*/

-- ============================================
-- Option 3 : Supprimer les triggers problématiques
-- ============================================
do $$
declare
  trigger_name_var text;
begin
  -- Supprimer les triggers qui créent des sections automatiquement
  FOR trigger_name_var IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
      AND (action_statement LIKE '%INSERT INTO sections%' 
           OR action_statement LIKE '%sections%')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.courses', trigger_name_var);
    RAISE NOTICE 'Trigger supprimé: %', trigger_name_var;
  END LOOP;
  
  RAISE NOTICE 'Nettoyage des triggers terminé';
exception
  when others then
    RAISE NOTICE 'Erreur lors de la suppression: %', SQLERRM;
end $$;

-- ============================================
-- Option 4 : S'assurer que formation_id pointe vers courses.id (si on veut utiliser sections)
-- ============================================
-- Cette option n'est pas nécessaire si on utilise uniquement builder_snapshot
-- Mais elle peut être utile si l'ancien système est encore utilisé

-- Vérifier si course_id existe dans sections (au lieu de formation_id)
do $$
begin
  -- Si course_id existe, on peut créer une vue ou un alias
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' 
      and table_name = 'sections' 
      and column_name = 'course_id'
  ) then
    raise notice 'La colonne course_id existe dans sections - OK';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' 
      and table_name = 'sections' 
      and column_name = 'formation_id'
  ) then
    raise notice 'La colonne formation_id existe - vérifier les triggers';
  else
    raise notice 'Aucune colonne de liaison trouvée dans sections';
  end if;
end $$;

