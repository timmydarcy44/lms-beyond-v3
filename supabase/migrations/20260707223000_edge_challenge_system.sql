-- Coach IA gamifié EDGE : défis, XP, séries, badges, notifications.
-- Chaque défi terminé produit une preuve exploitable (transcript + preuve texte).

-- ---------------------------------------------------------------------------
-- 1. edge_challenge_runs : une ligne par défi joué (preuve de compétence)
-- ---------------------------------------------------------------------------
create table if not exists public.edge_challenge_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_name text not null,
  skill_slug text not null,
  objective text,
  challenge_format text not null default 'ai'
    check (challenge_format in ('story', 'situation', 'proof', 'video', 'ai', 'quickchallenge')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  level_before text,
  level_estimated text,
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  next_action text,
  summary text,
  xp_awarded integer not null default 0,
  skill_validated boolean not null default false,
  transcript jsonb not null default '[]'::jsonb,
  proof_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists edge_challenge_runs_user_idx on public.edge_challenge_runs (user_id);
create index if not exists edge_challenge_runs_skill_idx on public.edge_challenge_runs (user_id, skill_slug);
create index if not exists edge_challenge_runs_status_idx on public.edge_challenge_runs (user_id, status);

-- ---------------------------------------------------------------------------
-- 2. edge_xp_events : historique des gains d'XP (audit + total)
-- ---------------------------------------------------------------------------
create table if not exists public.edge_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'challenge'
    check (source in ('challenge', 'daily', 'streak', 'badge', 'bonus')),
  source_id uuid,
  skill_name text,
  amount integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edge_xp_events_user_idx on public.edge_xp_events (user_id);

-- ---------------------------------------------------------------------------
-- 3. edge_streaks : série de jours consécutifs (une ligne par utilisateur)
-- ---------------------------------------------------------------------------
create table if not exists public.edge_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_day date,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. edge_badge_progress : progression vers un Open Badge par compétence
-- ---------------------------------------------------------------------------
create table if not exists public.edge_badge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null,
  skill_name text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'in_progress'
    check (status in ('locked', 'in_progress', 'earned')),
  earned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create index if not exists edge_badge_progress_user_idx on public.edge_badge_progress (user_id);

-- ---------------------------------------------------------------------------
-- 5. edge_notifications : notifications coach liées à une compétence réelle
-- ---------------------------------------------------------------------------
create table if not exists public.edge_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_name text,
  emoji text,
  message text not null,
  cta_href text,
  tone text not null default 'challenge'
    check (tone in ('challenge', 'badge', 'insight', 'action')),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'read', 'dismissed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists edge_notifications_user_idx on public.edge_notifications (user_id);
create index if not exists edge_notifications_status_idx on public.edge_notifications (status);

-- ---------------------------------------------------------------------------
-- RLS : chaque utilisateur ne voit et n'écrit que ses propres lignes.
-- (Les écritures serveur passent par la service role et bypassent la RLS.)
-- ---------------------------------------------------------------------------
alter table public.edge_challenge_runs enable row level security;
alter table public.edge_xp_events enable row level security;
alter table public.edge_streaks enable row level security;
alter table public.edge_badge_progress enable row level security;
alter table public.edge_notifications enable row level security;

create policy "own challenge runs (select)" on public.edge_challenge_runs
  for select using (auth.uid() = user_id);
create policy "own challenge runs (insert)" on public.edge_challenge_runs
  for insert with check (auth.uid() = user_id);
create policy "own challenge runs (update)" on public.edge_challenge_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own xp events (select)" on public.edge_xp_events
  for select using (auth.uid() = user_id);
create policy "own xp events (insert)" on public.edge_xp_events
  for insert with check (auth.uid() = user_id);

create policy "own streaks (select)" on public.edge_streaks
  for select using (auth.uid() = user_id);
create policy "own streaks (insert)" on public.edge_streaks
  for insert with check (auth.uid() = user_id);
create policy "own streaks (update)" on public.edge_streaks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own badge progress (select)" on public.edge_badge_progress
  for select using (auth.uid() = user_id);
create policy "own badge progress (insert)" on public.edge_badge_progress
  for insert with check (auth.uid() = user_id);
create policy "own badge progress (update)" on public.edge_badge_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own notifications (select)" on public.edge_notifications
  for select using (auth.uid() = user_id);
create policy "own notifications (insert)" on public.edge_notifications
  for insert with check (auth.uid() = user_id);
create policy "own notifications (update)" on public.edge_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
