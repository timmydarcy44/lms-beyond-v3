-- Pipeline commercial EDGE : opportunités chiffrées + historique d'étapes (additif).
-- Ne touche pas aux deals existants de façon destructive ; backfill depuis amount_cents.

-- ---------------------------------------------------------------------------
-- 1) Historique des changements d'étape
-- ---------------------------------------------------------------------------
create table if not exists public.crm_pipeline_deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_pipeline_deals (id) on delete cascade,
  from_stage_slug text,
  to_stage_slug text not null,
  changed_by_email text,
  source text not null default 'ui',
  created_at timestamptz not null default now()
);

create index if not exists crm_pipeline_deal_stage_history_deal_idx
  on public.crm_pipeline_deal_stage_history (deal_id, created_at desc);

alter table public.crm_pipeline_deal_stage_history enable row level security;

drop policy if exists crm_pipeline_deal_stage_history_super on public.crm_pipeline_deal_stage_history;
create policy crm_pipeline_deal_stage_history_super on public.crm_pipeline_deal_stage_history
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 2) Opportunités financières (optionnelles, liées à un prospect)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_pipeline_opportunities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_pipeline_deals (id) on delete cascade,
  opportunity_type text not null default 'autre'
    check (opportunity_type in ('formation_edge', 'beyond_learning', 'edge_recruit', 'autre')),
  title text,
  amount_cents int not null default 0 check (amount_cents >= 0),
  status text not null default 'active'
    check (status in ('active', 'won', 'lost')),
  is_primary boolean not null default true,
  identified_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipeline_opportunities_deal_idx
  on public.crm_pipeline_opportunities (deal_id);

create index if not exists crm_pipeline_opportunities_status_idx
  on public.crm_pipeline_opportunities (status, won_at);

alter table public.crm_pipeline_opportunities enable row level security;

drop policy if exists crm_pipeline_opportunities_super on public.crm_pipeline_opportunities;
create policy crm_pipeline_opportunities_super on public.crm_pipeline_opportunities
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Métadonnées légères sur le deal (affichage carte / cockpit sans jointure obligatoire)
alter table public.crm_pipeline_deals
  add column if not exists opportunity_type text,
  add column if not exists opportunity_title text,
  add column if not exists opportunity_identified_at timestamptz,
  add column if not exists opportunity_won_at timestamptz;

-- Backfill opportunités depuis les montants déjà renseignés
insert into public.crm_pipeline_opportunities (
  deal_id,
  opportunity_type,
  title,
  amount_cents,
  status,
  is_primary,
  identified_at,
  won_at
)
select
  d.id,
  coalesce(nullif(d.opportunity_type, ''), 'autre'),
  coalesce(nullif(d.opportunity_title, ''), 'Opportunité commerciale'),
  d.amount_cents,
  case
    when d.stage_slug in ('proposition_signee', 'reussi', 'gagne') then 'won'
    when d.stage_slug = 'echec' then 'lost'
    else 'active'
  end,
  true,
  coalesce(d.opportunity_identified_at, d.updated_at, d.created_at),
  case
    when d.stage_slug in ('proposition_signee', 'reussi', 'gagne')
      then coalesce(d.opportunity_won_at, d.updated_at)
    else null
  end
from public.crm_pipeline_deals d
where d.amount_cents > 0
  and not exists (
    select 1 from public.crm_pipeline_opportunities o where o.deal_id = d.id and o.is_primary
  );

update public.crm_pipeline_deals d
set
  opportunity_identified_at = coalesce(d.opportunity_identified_at, d.updated_at, d.created_at),
  opportunity_type = coalesce(nullif(d.opportunity_type, ''), 'autre'),
  opportunity_title = coalesce(nullif(d.opportunity_title, ''), 'Opportunité commerciale'),
  opportunity_won_at = case
    when d.stage_slug in ('proposition_signee', 'reussi', 'gagne')
      then coalesce(d.opportunity_won_at, d.updated_at)
    else d.opportunity_won_at
  end
where d.amount_cents > 0;
