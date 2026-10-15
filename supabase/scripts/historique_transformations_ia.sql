-- Historique Byound AI + chapitres valides au clic sur Suivant.
-- A coller dans Supabase : SQL Editor > New query > Run.
-- Le script peut etre relance : il ne supprime aucune donnee.

create table if not exists public.lesson_ai_transformations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  input_hash text not null unique,
  action text not null,
  format text not null,
  options jsonb not null default '{}'::jsonb,
  result_text text,
  result_json jsonb,
  audio_base64 text,
  audio_mime_type text,
  audio_voice text,
  model text,
  tokens_used integer
);

create table if not exists public.lesson_ai_user_transformations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  transformation_id uuid not null references public.lesson_ai_transformations(id) on delete cascade,
  course_id uuid,
  lesson_id uuid,
  selection_excerpt text,
  action text not null,
  options jsonb not null default '{}'::jsonb
);

alter table public.lesson_ai_user_transformations
  add column if not exists chapter_local_id text;

alter table public.lesson_ai_transformations enable row level security;
alter table public.lesson_ai_user_transformations enable row level security;

drop policy if exists lesson_ai_transformations_select_authenticated on public.lesson_ai_transformations;
create policy lesson_ai_transformations_select_authenticated
  on public.lesson_ai_transformations for select to authenticated using (true);

drop policy if exists lesson_ai_transformations_insert_authenticated on public.lesson_ai_transformations;
create policy lesson_ai_transformations_insert_authenticated
  on public.lesson_ai_transformations for insert to authenticated with check (true);

drop policy if exists lesson_ai_transformations_update_authenticated on public.lesson_ai_transformations;
create policy lesson_ai_transformations_update_authenticated
  on public.lesson_ai_transformations for update to authenticated using (true) with check (true);

drop policy if exists lesson_ai_user_transformations_select_own on public.lesson_ai_user_transformations;
create policy lesson_ai_user_transformations_select_own
  on public.lesson_ai_user_transformations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists lesson_ai_user_transformations_insert_own on public.lesson_ai_user_transformations;
create policy lesson_ai_user_transformations_insert_own
  on public.lesson_ai_user_transformations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists lesson_ai_user_transformations_update_own on public.lesson_ai_user_transformations;
create policy lesson_ai_user_transformations_update_own
  on public.lesson_ai_user_transformations for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lesson_ai_user_transformations_delete_own on public.lesson_ai_user_transformations;
create policy lesson_ai_user_transformations_delete_own
  on public.lesson_ai_user_transformations for delete to authenticated
  using (auth.uid() = user_id);

create unique index if not exists lesson_ai_user_transformations_dedupe_uidx
  on public.lesson_ai_user_transformations (user_id, transformation_id, lesson_id, chapter_local_id)
  nulls not distinct;

create table if not exists public.learner_leaf_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null,
  leaf_id text not null,
  leaf_title text,
  completed_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists learner_leaf_completions_uidx
  on public.learner_leaf_completions (user_id, course_id, leaf_id);

create index if not exists learner_leaf_completions_user_idx
  on public.learner_leaf_completions (user_id, completed_at desc);

alter table public.learner_leaf_completions enable row level security;

drop policy if exists learner_leaf_completions_select_own on public.learner_leaf_completions;
create policy learner_leaf_completions_select_own
  on public.learner_leaf_completions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists learner_leaf_completions_insert_own on public.learner_leaf_completions;
create policy learner_leaf_completions_insert_own
  on public.learner_leaf_completions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists learner_leaf_completions_update_own on public.learner_leaf_completions;
create policy learner_leaf_completions_update_own
  on public.learner_leaf_completions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
