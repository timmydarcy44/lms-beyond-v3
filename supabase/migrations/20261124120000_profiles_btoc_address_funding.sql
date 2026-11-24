-- Coordonnées B2C (fiche Particulier / Client BtoC) — n'écrase pas les données existantes.
alter table public.profiles
  add column if not exists address_line text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists funding_type text;

comment on column public.profiles.address_line is 'Adresse postale (ligne 1) — contrats / attestations B2C';
comment on column public.profiles.postal_code is 'Code postal FR — contrats / attestations B2C';
comment on column public.profiles.city is 'Ville — contrats / attestations B2C';
comment on column public.profiles.funding_type is 'Mode de financement B2C: fonds_propres | cpf | autre';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_funding_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_funding_type_check
      check (
        funding_type is null
        or funding_type in ('fonds_propres', 'cpf', 'autre')
      );
  end if;
end $$;
