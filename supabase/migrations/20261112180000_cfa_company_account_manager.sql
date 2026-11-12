-- Chargé de compte assignable sur les entreprises d'accueil CFA.

alter table public.cfa_companies
  add column if not exists account_manager_id uuid references public.account_managers (id) on delete set null;

create index if not exists cfa_companies_account_manager_idx
  on public.cfa_companies (account_manager_id)
  where account_manager_id is not null;
