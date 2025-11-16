-- Script ultra-simple pour désactiver TOUS les triggers sur courses et sections
-- Utilisez ce script si FIX_SECTIONS_FORMATION_ID_V2.sql ne fonctionne pas

-- Désactiver tous les triggers sur courses
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.courses DISABLE TRIGGER %I', r.trigger_name);
      RAISE NOTICE 'Trigger désactivé sur courses: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Désactiver tous les triggers sur sections
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'sections'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.sections DISABLE TRIGGER %I', r.trigger_name);
      RAISE NOTICE 'Trigger désactivé sur sections: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Alternative: Supprimer tous les triggers sur courses
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
      AND event_object_table = 'courses'
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.courses CASCADE', r.trigger_name);
      RAISE NOTICE 'Trigger supprimé sur courses: %', r.trigger_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erreur avec %: %', r.trigger_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Script terminé

