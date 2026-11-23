-- Analyse du besoin Qualiopi ind.4 — Entreprise | Particulier + validation / échange
-- Réversible : colonnes nullable + défauts ; details jsonb étendu sans destruction.

alter table public.organization_need_analyses
  add column if not exists request_type text not null default 'entreprise';

alter table public.organization_need_analyses
  add column if not exists exchange_date date;

alter table public.organization_need_analyses
  add column if not exists exchange_mode text;

alter table public.organization_need_analyses
  add column if not exists interlocutor_name text;

alter table public.organization_need_analyses
  add column if not exists interlocutor_role text;

alter table public.organization_need_analyses
  add column if not exists conducted_by uuid;

alter table public.organization_need_analyses
  add column if not exists accessibility_asked boolean not null default false;

alter table public.organization_need_analyses
  add column if not exists accessibility_needed text;

alter table public.organization_need_analyses
  add column if not exists validated_by uuid;

alter table public.organization_need_analyses
  add column if not exists validated_at timestamptz;

alter table public.organization_need_analyses
  add column if not exists client_sent_at timestamptz;

alter table public.organization_need_analyses
  add column if not exists client_validated_at date;

alter table public.organization_need_analyses
  add column if not exists client_validation_token text;

alter table public.organization_need_analyses
  add column if not exists pdf_storage_path text;

alter table public.organization_need_analyses
  add column if not exists pdf_storage_bucket text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_need_analyses_request_type_check'
  ) then
    alter table public.organization_need_analyses
      add constraint organization_need_analyses_request_type_check
      check (request_type in ('entreprise', 'particulier'));
  end if;
end $$;

comment on column public.organization_need_analyses.request_type is
  'entreprise | particulier — défaut entreprise pour analyses legacy';
comment on column public.organization_need_analyses.accessibility_asked is
  'Question besoins d''aménagement posée (requis pour complète)';
comment on column public.organization_need_analyses.validated_by is
  'Validation interne Byound (Responsable pédagogique)';
comment on column public.organization_need_analyses.client_validation_token is
  'Jeton opaque pour validation client via lien mail';

-- Surfaces catalogue (entreprise / particulier / reconversion)
alter table public.training_courses
  add column if not exists catalog_surfaces text[] default array['entreprise', 'particulier', 'reconversion'];

comment on column public.training_courses.catalog_surfaces is
  'Surfaces de publication catalogue : entreprise, particulier, reconversion';

update public.training_courses
set catalog_surfaces = array['particulier', 'reconversion']
where slug = 'fondamentaux-neuroeducation';

-- Flag optionnel sur profiles pour valider les analyses (Responsable pédagogique)
alter table public.profiles
  add column if not exists is_pedagogical_manager boolean not null default false;

comment on column public.profiles.is_pedagogical_manager is
  'Peut valider une analyse du besoin Qualiopi (Responsable pédagogique)';
