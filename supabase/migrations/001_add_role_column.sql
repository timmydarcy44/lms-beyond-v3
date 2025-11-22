-- 001_add_role_column.sql
-- Script pour ajouter la colonne "role" à la table profiles
-- À exécuter avant 002_lms_tutor_builder_activity.sql si la colonne n'existe pas
-- psql "$DATABASE_URL" -f supabase/migrations/001_add_role_column.sql

begin;

-- Vérifier et ajouter la colonne role si elle n'existe pas
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles 
      add column role text;
    
    -- Ajouter la contrainte de vérification
    alter table public.profiles 
      add constraint profiles_role_check
      check (role in ('student','instructor','admin','tutor'));
    
    raise notice 'Colonne role ajoutée à la table profiles';
  else
    raise notice 'Colonne role existe déjà dans la table profiles';
  end if;
end $$;

commit;









