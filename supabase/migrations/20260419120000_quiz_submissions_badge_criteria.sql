-- Quiz submissions (learner) + extra badge config (criteria HTML, multi-modalities, oral IA prompt, technical endpoint).

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'badges') then
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='criteria_html') then
      alter table public.badges add column criteria_html text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='modalities_selected') then
      alter table public.badges add column modalities_selected text[] not null default '{}'::text[];
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='oral_ia_evaluation_prompt') then
      alter table public.badges add column oral_ia_evaluation_prompt text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='technical_json_endpoint') then
      alter table public.badges add column technical_json_endpoint text;
    end if;
  end if;
end$$;

create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  answers jsonb not null default '{}'::jsonb,
  review jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_submissions_test_user_idx on public.quiz_submissions (test_id, user_id, created_at desc);
create index if not exists quiz_submissions_user_idx on public.quiz_submissions (user_id, created_at desc);

alter table public.quiz_submissions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_submissions' and policyname = 'quiz_submissions_select_own'
  ) then
    create policy quiz_submissions_select_own on public.quiz_submissions
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_submissions' and policyname = 'quiz_submissions_insert_own'
  ) then
    create policy quiz_submissions_insert_own on public.quiz_submissions
      for insert with check (auth.uid() = user_id);
  end if;
end$$;
