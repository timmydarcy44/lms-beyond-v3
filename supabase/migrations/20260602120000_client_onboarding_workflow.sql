-- Workflow activation client BTOB : organisations, lien CRM, étapes pipeline

-- Colonnes onboarding sur organizations (table existante Beyond)
alter table public.organizations
  add column if not exists onboarding_step text default 'invite_sent',
  add column if not exists created_from_deal uuid,
  add column if not exists estimated_users integer;

alter table public.organizations drop constraint if exists organizations_onboarding_step_check;
alter table public.organizations
  add constraint organizations_onboarding_step_check
  check (
    onboarding_step is null
    or onboarding_step in (
      'invite_sent',
      'account_activated',
      'teams_created',
      'employees_imported',
      'employees_invited',
      'first_diagnostic_done',
      'active'
    )
  );

-- Lien deal CRM → organisation cliente
alter table public.crm_pipeline_deals
  add column if not exists organization_id uuid references public.organizations (id) on delete set null;

create index if not exists idx_crm_pipeline_deals_organization_id
  on public.crm_pipeline_deals (organization_id)
  where organization_id is not null;

-- Étapes pipeline BTOB (gagné / proposition signée / client actif)
insert into public.crm_pipeline_stages (pipeline_type, slug, label, sort_order) values
  ('btob', 'proposition_signee', 'Proposition signée', 6),
  ('btob', 'gagne', 'Gagné', 7),
  ('btob', 'client_actif', 'Client actif', 8)
on conflict (pipeline_type, slug) do update set label = excluded.label;

-- équipes : colonnes complémentaires import CSV
alter table public.equipes
  add column if not exists description text,
  add column if not exists source text default 'manual';
