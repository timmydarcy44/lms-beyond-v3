-- Parcours « Initial » (sans entreprise) + contrainte placement (colonne créée si absente)

alter table public.profiles add column if not exists placement_status text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists has_driving_license_b boolean;

alter table public.profiles drop constraint if exists profiles_placement_status_check;

alter table public.profiles
  add constraint profiles_placement_status_check
  check (
    placement_status is null
    or placement_status in (
      'recherche_alternance',
      'en_alternance',
      'en_stage',
      'contrat_fip',
      'initial'
    )
  );

comment on column public.profiles.placement_status is
  'Suivi placement CFA: recherche_alternance, en_alternance, en_stage, contrat_fip, initial (parcours sans entreprise).';
