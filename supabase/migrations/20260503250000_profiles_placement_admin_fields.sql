-- Statut placement (école), date de naissance, permis B (fiche apprenant)

alter table public.profiles
  add column if not exists placement_status text;

alter table public.profiles
  add column if not exists date_of_birth date;

alter table public.profiles
  add column if not exists has_driving_license_b boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_placement_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_placement_status_check
      check (
        placement_status is null
        or placement_status in (
          'recherche_alternance',
          'en_alternance',
          'en_stage',
          'contrat_fip'
        )
      );
  end if;
end $$;

comment on column public.profiles.placement_status is 'Suivi placement CFA: recherche_alternance, en_alternance, en_stage, contrat_fip.';
comment on column public.profiles.date_of_birth is 'Date de naissance (fiche administrative).';
comment on column public.profiles.has_driving_license_b is 'Possession du permis B (oui/non).';
