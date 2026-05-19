-- Table dédiée studio Open Badges (JSONB modalités + prompt oral).

create table if not exists public.open_badges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  objectives jsonb not null default '[]'::jsonb,
  modalities jsonb not null default '{}'::jsonb,
  audio_prompt text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_badges_course_id_unique unique (course_id)
);

create index if not exists open_badges_updated_idx on public.open_badges (updated_at desc);

alter table public.open_badges enable row level security;
