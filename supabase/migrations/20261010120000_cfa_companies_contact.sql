alter table public.cfa_companies
  add column if not exists contact_first_name text,
  add column if not exists contact_last_name text,
  add column if not exists contact_role text,
  add column if not exists company_address text,
  add column if not exists soft_skills text;

alter table public.cfa_companies drop constraint if exists cfa_companies_apprentices_check;

alter table public.cfa_companies
  add constraint cfa_companies_apprentices_check check (
    apprentices_wanted is null or apprentices_wanted between 1 and 30
  );
