-- Trigger submissions for parcours (case study / oral / video / pdf)
create extension if not exists pgcrypto;

create table if not exists public.path_trigger_submissions (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null,
  step_id text not null,
  user_id uuid not null,
  type text not null check (type in ('case_study','oral_audio','video_presentation','file_pdf')),
  status text not null default 'pending' check (status in ('pending','submitted','analyzing','passed','failed','error')),
  score integer null check (score is null or (score >= 0 and score <= 100)),
  feedback text null,
  -- For case study
  text_submission text null,
  -- For audio/video/pdf
  file_url text null,
  mime_type text null,
  -- Derived by analysis
  transcript text null,
  extracted_text text null,
  ai_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists path_trigger_submissions_user_path_idx
  on public.path_trigger_submissions (user_id, path_id, step_id);

alter table public.path_trigger_submissions enable row level security;

-- Learner can manage their own submissions.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_trigger_submissions' and policyname = 'pts_select_own'
  ) then
    create policy pts_select_own on public.path_trigger_submissions
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_trigger_submissions' and policyname = 'pts_insert_own'
  ) then
    create policy pts_insert_own on public.path_trigger_submissions
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_trigger_submissions' and policyname = 'pts_update_own'
  ) then
    create policy pts_update_own on public.path_trigger_submissions
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end;
$$;

-- keep updated_at in sync (best-effort; ignore if extension not available)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'moddatetime') then
    execute 'create trigger set_timestamp
      before update on public.path_trigger_submissions
      for each row execute procedure moddatetime(updated_at);';
  end if;
exception when others then
  -- ignore
end;
$$;

