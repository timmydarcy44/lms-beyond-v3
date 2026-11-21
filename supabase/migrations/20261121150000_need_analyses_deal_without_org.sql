-- Permettre une analyse du besoin liée au deal pipeline avant création du compte client.
alter table public.organization_need_analyses
  alter column organization_id drop not null;

comment on column public.organization_need_analyses.organization_id is
  'Compte client (nullable tant que le deal n’a pas encore d’organisation).';
