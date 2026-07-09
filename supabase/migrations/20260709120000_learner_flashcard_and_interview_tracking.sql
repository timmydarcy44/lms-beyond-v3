-- Suivi flashcards + historique entretiens / coaching IA

-- ---------------------------------------------------------------------------
-- 1. Sessions flashcards
-- ---------------------------------------------------------------------------
create table if not exists public.flashcard_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  scope_id text not null,
  total_cards integer not null default 0 check (total_cards >= 0),
  known_count integer not null default 0 check (known_count >= 0),
  unknown_count integer not null default 0 check (unknown_count >= 0),
  card_results jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists flashcard_study_sessions_user_idx
  on public.flashcard_study_sessions (user_id, completed_at desc);

create index if not exists flashcard_study_sessions_course_idx
  on public.flashcard_study_sessions (course_id, user_id);

comment on table public.flashcard_study_sessions is
  'Historique des révisions flashcards par apprenant (Beyond Flash).';

-- ---------------------------------------------------------------------------
-- 2. Entretiens expérientiels / coaching IA
-- ---------------------------------------------------------------------------
create table if not exists public.experiential_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  lesson_id text not null,
  interview_style text not null default 'experiential'
    check (interview_style in ('coaching', 'experiential')),
  audience text,
  chapter_title text,
  course_title text,
  status text not null default 'completed'
    check (status in ('in_progress', 'completed', 'abandoned')),
  user_turn_count integer not null default 0 check (user_turn_count >= 0),
  messages jsonb not null default '[]'::jsonb,
  feedback jsonb,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists experiential_interview_sessions_user_idx
  on public.experiential_interview_sessions (user_id, completed_at desc);

create index if not exists experiential_interview_sessions_style_idx
  on public.experiential_interview_sessions (user_id, interview_style);

comment on table public.experiential_interview_sessions is
  'Historique des entretiens IA (coaching ou expérientiel) avec transcript et bilan.';

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table public.flashcard_study_sessions enable row level security;
alter table public.experiential_interview_sessions enable row level security;

drop policy if exists flashcard_study_sessions_insert_own on public.flashcard_study_sessions;
create policy flashcard_study_sessions_insert_own on public.flashcard_study_sessions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists flashcard_study_sessions_select_own on public.flashcard_study_sessions;
create policy flashcard_study_sessions_select_own on public.flashcard_study_sessions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists experiential_interview_sessions_insert_own on public.experiential_interview_sessions;
create policy experiential_interview_sessions_insert_own on public.experiential_interview_sessions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists experiential_interview_sessions_select_own on public.experiential_interview_sessions;
create policy experiential_interview_sessions_select_own on public.experiential_interview_sessions
  for select to authenticated
  using (auth.uid() = user_id);

-- Super admins : lecture globale (fiche de suivi)
drop policy if exists flashcard_study_sessions_super_admin_select on public.flashcard_study_sessions;
create policy flashcard_study_sessions_super_admin_select on public.flashcard_study_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists experiential_interview_sessions_super_admin_select on public.experiential_interview_sessions;
create policy experiential_interview_sessions_super_admin_select on public.experiential_interview_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
