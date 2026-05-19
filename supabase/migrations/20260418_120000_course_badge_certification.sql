-- Badge certification config linked to a course + learner submissions.
-- Safe to run multiple times.

do $$
begin
  -- Extend public.badges to support course-linked certification config.
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'badges'
  ) then
    -- course link + config
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='course_id') then
      alter table public.badges add column course_id uuid;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='level') then
      alter table public.badges add column level text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='objectives') then
      alter table public.badges add column objectives text[] default '{}'::text[];
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='modalities') then
      alter table public.badges add column modalities text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='evaluation_type') then
      alter table public.badges add column evaluation_type text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='quiz_test_id') then
      alter table public.badges add column quiz_test_id uuid;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='case_prompt') then
      alter table public.badges add column case_prompt text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='audio_scenario') then
      alter table public.badges add column audio_scenario text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='active') then
      alter table public.badges add column active boolean not null default false;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='badges' and column_name='updated_at') then
      alter table public.badges add column updated_at timestamptz not null default now();
    end if;

    -- Index for course lookups
    if not exists (
      select 1 from pg_indexes where schemaname='public' and indexname='badges_course_id_idx'
    ) then
      create index badges_course_id_idx on public.badges (course_id);
    end if;
  end if;
end$$;

create table if not exists public.badge_submissions (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid references public.badges(id) on delete set null,
  course_id uuid,
  user_id uuid references public.profiles(id) on delete cascade,
  evaluation_type text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create index if not exists badge_submissions_course_user_idx on public.badge_submissions (course_id, user_id, created_at desc);
create index if not exists badge_submissions_badge_idx on public.badge_submissions (badge_id, created_at desc);

