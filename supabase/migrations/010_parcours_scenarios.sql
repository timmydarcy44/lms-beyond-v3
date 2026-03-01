-- Tables for parcours scenarios MVP

create extension if not exists "uuid-ossp";

create table if not exists public.parcours_scenarios (
  id uuid primary key default uuid_generate_v4(),
  parcours_id uuid not null references public.paths (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.parcours_scenario_steps (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid not null references public.parcours_scenarios (id) on delete cascade,
  step_order integer not null,
  step_type text not null check (step_type in ('trigger', 'condition', 'action')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.parcours_events (
  id uuid primary key default uuid_generate_v4(),
  parcours_id uuid not null references public.paths (id) on delete cascade,
  learner_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.parcours_unlocks (
  id uuid primary key default uuid_generate_v4(),
  parcours_id uuid not null references public.paths (id) on delete cascade,
  learner_id uuid not null,
  content_type text not null check (content_type in ('test', 'resource')),
  content_id uuid not null,
  created_at timestamptz not null default now(),
  unique (parcours_id, learner_id, content_type, content_id)
);

create table if not exists public.parcours_scenario_runs (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid not null references public.parcours_scenarios (id) on delete cascade,
  step_id uuid not null references public.parcours_scenario_steps (id) on delete cascade,
  event_id uuid not null references public.parcours_events (id) on delete cascade,
  learner_id uuid not null,
  executed_at timestamptz not null default now(),
  unique (scenario_id, step_id, event_id)
);

create index if not exists idx_parcours_scenarios_parcours on public.parcours_scenarios (parcours_id, is_active);
create index if not exists idx_parcours_scenario_steps_scenario on public.parcours_scenario_steps (scenario_id);
create index if not exists idx_parcours_events_parcours on public.parcours_events (parcours_id, learner_id);
create index if not exists idx_parcours_events_type on public.parcours_events (event_type);
create index if not exists idx_parcours_unlocks_parcours on public.parcours_unlocks (parcours_id, learner_id);
create index if not exists idx_parcours_scenario_runs_scenario on public.parcours_scenario_runs (scenario_id, step_id, event_id);

alter table public.parcours_scenarios enable row level security;
alter table public.parcours_scenario_steps enable row level security;
alter table public.parcours_events enable row level security;
alter table public.parcours_unlocks enable row level security;
alter table public.parcours_scenario_runs enable row level security;

create policy if not exists "select_parcours_scenarios_owner_or_creator"
  on public.parcours_scenarios
  for select
  using (
    auth.uid() in (
      select creator_id from public.paths where id = parcours_id
    )
    or auth.uid() in (
      select owner_id from public.paths where id = parcours_id
    )
  );

create policy if not exists "select_parcours_scenario_steps_owner_or_creator"
  on public.parcours_scenario_steps
  for select
  using (
    auth.uid() in (
      select creator_id from public.paths p
      join public.parcours_scenarios s on s.id = scenario_id
      where p.id = s.parcours_id
    )
    or auth.uid() in (
      select owner_id from public.paths p
      join public.parcours_scenarios s on s.id = scenario_id
      where p.id = s.parcours_id
    )
  );

create policy if not exists "select_parcours_events_owner_or_creator"
  on public.parcours_events
  for select
  using (
    auth.uid() in (
      select creator_id from public.paths where id = parcours_id
    )
    or auth.uid() in (
      select owner_id from public.paths where id = parcours_id
    )
  );

create policy if not exists "select_parcours_unlocks_owner_or_creator"
  on public.parcours_unlocks
  for select
  using (
    auth.uid() in (
      select creator_id from public.paths where id = parcours_id
    )
    or auth.uid() in (
      select owner_id from public.paths where id = parcours_id
    )
  );


