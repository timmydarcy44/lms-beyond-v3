-- Référence client affichée sur devis / convention
alter table public.organizations
  add column if not exists client_code text;

create unique index if not exists organizations_client_code_unique
  on public.organizations (client_code)
  where client_code is not null;
