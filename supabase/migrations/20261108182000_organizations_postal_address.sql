-- Adresse postale entreprise (devis / lieu de formation chez le client)
alter table public.organizations
  add column if not exists address_line text,
  add column if not exists address_zip text,
  add column if not exists address_city text,
  add column if not exists address_country text default 'FR';
