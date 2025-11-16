do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at' and pronamespace = 'public'::regnamespace
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $function$
    begin
      new.updated_at = timezone('utc', now());
      return new;
    end;
    $function$;
  end if;
end;
$$;

-- Create table to cache AI transformations (shared across learners)
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

-- Update timestamp trigger (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'lesson_ai_transformations_set_updated_at'
  ) then
    create trigger lesson_ai_transformations_set_updated_at
    before update on public.lesson_ai_transformations
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

-- Cache table policies (idempotent)
alter table public.lesson_ai_transformations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_transformations_select_authenticated'
      and tablename = 'lesson_ai_transformations'
  ) then
    create policy lesson_ai_transformations_select_authenticated
      on public.lesson_ai_transformations
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_transformations_insert_authenticated'
      and tablename = 'lesson_ai_transformations'
  ) then
    create policy lesson_ai_transformations_insert_authenticated
      on public.lesson_ai_transformations
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_transformations_update_authenticated'
      and tablename = 'lesson_ai_transformations'
  ) then
    create policy lesson_ai_transformations_update_authenticated
      on public.lesson_ai_transformations
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end;
$$;


-- Per-user history
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
  options jsonb not null default '{}'::jsonb,
  unique (user_id, lesson_id, transformation_id)
);

create index if not exists lesson_ai_user_transformations_user_idx on public.lesson_ai_user_transformations(user_id);
create index if not exists lesson_ai_user_transformations_lesson_idx on public.lesson_ai_user_transformations(lesson_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'lesson_ai_user_transformations_set_updated_at'
  ) then
    create trigger lesson_ai_user_transformations_set_updated_at
    before update on public.lesson_ai_user_transformations
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.lesson_ai_user_transformations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_user_transformations_select_own'
      and tablename = 'lesson_ai_user_transformations'
  ) then
    create policy lesson_ai_user_transformations_select_own
      on public.lesson_ai_user_transformations
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_user_transformations_insert_own'
      and tablename = 'lesson_ai_user_transformations'
  ) then
    create policy lesson_ai_user_transformations_insert_own
      on public.lesson_ai_user_transformations
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_user_transformations_update_own'
      and tablename = 'lesson_ai_user_transformations'
  ) then
    create policy lesson_ai_user_transformations_update_own
      on public.lesson_ai_user_transformations
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'lesson_ai_user_transformations_delete_own'
      and tablename = 'lesson_ai_user_transformations'
  ) then
    create policy lesson_ai_user_transformations_delete_own
      on public.lesson_ai_user_transformations
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

-- AI usage events (for expense tracking)
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  user_id uuid references public.profiles(id) on delete set null,
  route text not null,
  action text,
  provider text,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  cost_eur numeric(16,6) not null default 0,
  metadata jsonb
);

create index if not exists ai_usage_events_created_idx on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_user_idx on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'ai_usage_events_insert_own'
      and tablename = 'ai_usage_events'
  ) then
    create policy ai_usage_events_insert_own
      on public.ai_usage_events
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'ai_usage_events_select_own'
      and tablename = 'ai_usage_events'
  ) then
    create policy ai_usage_events_select_own
      on public.ai_usage_events
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'ai_usage_events_select_super_admin'
      and tablename = 'ai_usage_events'
  ) then
    create policy ai_usage_events_select_super_admin
      on public.ai_usage_events
      for select
      to authenticated
      using (
        public.user_has_role(auth.uid(), array['super_admin'])
        or exists (
          select 1 from public.super_admins sa
          where sa.user_id = auth.uid()
        )
      );
  end if;
end;
$$;


