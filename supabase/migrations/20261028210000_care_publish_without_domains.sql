-- La visibilité Care est un choix du praticien, pas une checklist de champs.
alter table public.care_profiles
  drop constraint if exists care_profiles_domains_published;
