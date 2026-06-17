-- Colonnes requises par l'inscription EDGE /particuliers et les feature flags d'accès.
-- Idempotent : safe à rejouer.

alter table public.profiles add column if not exists type_profil text;
alter table public.profiles add column if not exists access_lms boolean;
alter table public.profiles add column if not exists access_connect boolean;
alter table public.profiles add column if not exists access_care boolean;
alter table public.profiles add column if not exists access_pro boolean;
alter table public.profiles add column if not exists avatar_url text;

comment on column public.profiles.type_profil is
  'Objectif / situation du particulier EDGE (emploi, freelance, alternance, reconversion, autre).';

comment on column public.profiles.access_connect is
  'Accès Beyond Connect / espace apprenant (null = autorisé par défaut côté app).';

-- Étendre la contrainte role si elle existe (inclure PARTICULIER pour EDGE).
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_check'
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_role_check
    check (
      role is null
      or role = any (
        array[
          'student',
          'learner',
          'instructor',
          'admin',
          'tutor',
          'super_admin',
          'entreprise',
          'ecole',
          'mentor',
          'PARTICULIER',
          'demo',
          'formateur',
          'expert',
          'praticien',
          'partenaire'
        ]
      )
    );
exception
  when others then
    raise notice 'profiles_role_check: %', sqlerrm;
end $$;
