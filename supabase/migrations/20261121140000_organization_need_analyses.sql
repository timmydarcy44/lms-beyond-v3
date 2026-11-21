-- Analyses de besoins entreprise (compte client) — preuve Qualiopi indicateur 4.
-- Plusieurs analyses par organisation (une par demande / projet).

create table if not exists public.organization_need_analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  deal_id uuid references public.crm_pipeline_deals (id) on delete set null,
  title text not null default '',
  context_problem text not null default '',
  expected_outcomes text not null default '',
  audience text not null default '',
  constraints text not null default '',
  disability_accommodations text not null default '',
  decided_adaptations text not null default '',
  recommendations jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'complete')),
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_need_analyses_org_idx
  on public.organization_need_analyses (organization_id, updated_at desc);

create index if not exists organization_need_analyses_status_idx
  on public.organization_need_analyses (status)
  where status = 'complete';

create index if not exists organization_need_analyses_deal_idx
  on public.organization_need_analyses (deal_id)
  where deal_id is not null;

alter table public.organization_need_analyses enable row level security;

drop policy if exists organization_need_analyses_super on public.organization_need_analyses;
create policy organization_need_analyses_super on public.organization_need_analyses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

comment on table public.organization_need_analyses is
  'Compte-rendu d’analyse du besoin formation (compte client). Preuve Qualiopi ind. 4.';
comment on column public.organization_need_analyses.recommendations is
  'Préconisations JSON [{ label, notes, catalog_course_id? }] — catalogue optionnel.';
