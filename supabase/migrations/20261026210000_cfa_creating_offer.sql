-- Colonne kanban « Création offre d'emploi », avant « À contacter ».
-- À coller dans l'éditeur SQL Supabase. Rejouable.
-- Ne remet pas les entreprises déjà en cours vers « À contacter ».

begin;

alter table public.cfa_companies drop constraint if exists cfa_companies_status_check;

alter table public.cfa_companies
  add constraint cfa_companies_status_check check (
    status in (
      'creating_offer',
      'to_contact',
      'email_sent',
      'appointment',
      'pending_decision',
      'recruiting',
      'recruited',
      'not_recruited'
    )
  );

insert into public.cfa_companies (
  company_name,
  organization_id,
  status,
  email,
  contact_first_name,
  contact_last_name,
  contact_name
)
select
  org.name,
  org.id,
  'creating_offer',
  p.email,
  nullif(btrim(p.first_name), ''),
  nullif(btrim(p.last_name), ''),
  nullif(btrim(coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name))), '')
from public.organizations org
left join lateral (
  select email, first_name, last_name, full_name
  from public.profiles
  where company_id = org.id
  limit 1
) p on true
where lower(org.name) = 'lalaland'
  and not exists (
    select 1
    from public.cfa_companies c
    where c.organization_id = org.id
       or lower(c.company_name) = 'lalaland'
  );

commit;
