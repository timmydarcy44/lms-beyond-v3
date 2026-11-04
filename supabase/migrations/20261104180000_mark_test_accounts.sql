-- Marque les comptes de test listés à l'audit Control.
-- N'efface aucune ligne. Ne touche pas Jessica ni Timmy.
-- organizations.is_test n'existait pas : seul super_admins.is_test avait été créé.

alter table public.organizations
  add column if not exists is_test boolean not null default false;

update public.organizations
set kind = 'demo',
    status = 'demo',
    is_test = true
where lower(slug) in (
  'edge-business-demo',
  'edge-demo-rh-aw78',
  'edge-lab',
  'entreprise-de-test-yw9p',
  'lalaland-s3eb',
  'test03-xapi',
  'timdada'
)
  and lower(slug) not in (
    'byound-5gfu',
    'jessicacontentin',
    'playmakers',
    'byound-care-sekx',
    'byound-care-j7iu'
  );

alter table public.experts
  add column if not exists is_test boolean not null default false;

update public.experts
set is_test = true
where lower(email) in (
  'anais.care.demo@byound.fr',
  'timmydarcy44+expertpro@gmail.com',
  'timmydarcy44+testexpertlol@gmail.com'
)
  and lower(email) not in (
    'timmydarcy44@gmail.com',
    'contentin.cabinet@gmail.com'
  );

alter table public.crm_pipeline_deals
  add column if not exists is_test boolean not null default false;

update public.crm_pipeline_deals
set is_test = true
where lower(btrim(company_name)) in ('jean test', 'diag test')
   or organization_id in (
     select id from public.organizations where is_test = true or kind = 'demo'
   );

alter table public.care_profiles
  add column if not exists is_test boolean not null default false;

update public.care_profiles p
set is_test = true
from public.experts e
where e.id = p.expert_id
  and e.is_test = true;

do $$
begin
  update public.companies
  set is_demo = true
  where organization_id in (select id from public.organizations where is_test = true or kind = 'demo');
exception
  when undefined_table or undefined_column then
    null;
end $$;
