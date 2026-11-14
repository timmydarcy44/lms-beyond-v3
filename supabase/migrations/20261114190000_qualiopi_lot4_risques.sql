-- Qualiopi Lot 4 (RNQ V10) — registre des risques qualité (ind. 32)
-- Additive only. Pas de modification CFA.

create table if not exists public.crm_qualiopi_risks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  cause text,
  probability smallint not null default 1
    check (probability between 1 and 4),
  severity smallint not null default 1
    check (severity between 1 and 4),
  -- Criticité = probability × severity (1–16), stockée pour tri / filtre
  criticality smallint not null default 1
    check (criticality between 1 and 16),
  preventive_action text,
  owner_name text,
  due_at date,
  reviewed_at date,
  status text not null default 'open'
    check (status in ('open', 'monitoring', 'mitigated', 'closed')),
  action_id uuid references public.crm_qualiopi_actions (id) on delete set null,
  reclamation_id uuid references public.crm_qualiopi_reclamations (id) on delete set null,
  highlight_id uuid references public.crm_qualiopi_veille_highlights (id) on delete set null,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_risks_status_idx
  on public.crm_qualiopi_risks (status, criticality desc);
create index if not exists crm_qualiopi_risks_due_idx
  on public.crm_qualiopi_risks (due_at)
  where due_at is not null;
create index if not exists crm_qualiopi_risks_action_idx
  on public.crm_qualiopi_risks (action_id)
  where action_id is not null;

comment on table public.crm_qualiopi_risks is
  'Qualiopi ind.32 — registre des risques qualité (PAQ). Criticité = probabilité × gravité.';
comment on column public.crm_qualiopi_risks.probability is
  'Probabilité 1 (rare) → 4 (très probable).';
comment on column public.crm_qualiopi_risks.severity is
  'Gravité 1 (faible) → 4 (critique).';
comment on column public.crm_qualiopi_risks.criticality is
  'Criticité calculée = probability × severity (1–16).';

-- Source PAQ élargie : risque
alter table public.crm_qualiopi_actions
  drop constraint if exists crm_qualiopi_actions_source_check;
alter table public.crm_qualiopi_actions
  add constraint crm_qualiopi_actions_source_check
  check (source in ('manual', 'reclamation', 'veille', 'satisfaction', 'revue', 'risque'));

alter table public.crm_qualiopi_risks enable row level security;

drop policy if exists crm_qualiopi_risks_super on public.crm_qualiopi_risks;
create policy crm_qualiopi_risks_super on public.crm_qualiopi_risks
  for all using (public.is_byound_staff(auth.uid()))
  with check (public.is_byound_staff(auth.uid()));
