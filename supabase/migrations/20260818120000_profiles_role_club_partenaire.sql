-- Rôles club / partenaire pour les dashboards Beyond Center.
-- Idempotent : recrée profiles_role_check avec les valeurs réellement utilisées.

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
          'admin_hr',
          'manager',
          'client',
          'ecole',
          'mentor',
          'PARTICULIER',
          'particulier',
          'demo',
          'formateur',
          'expert',
          'praticien',
          'praticien_bct',
          'apprenant',
          'salarie',
          'collaborateur',
          'employee',
          'club',
          'partenaire'
        ]
      )
    );
exception
  when others then
    raise notice 'profiles_role_check: %', sqlerrm;
end $$;
