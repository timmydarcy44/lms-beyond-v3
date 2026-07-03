-- Catalogue formations EDGE Business (Former vos équipes)

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  long_description text,
  domain text,
  cover_url text,
  duration text,
  level text,
  formats text[],
  objectives text[],
  skills text[],
  program jsonb,
  prerequisites text,
  audience text[],
  intra_price numeric,
  inter_price numeric,
  max_intra_participants integer default 12,
  badge_name text,
  trainer_id uuid,
  trainer_name text,
  trainer_headline text,
  trainer_photo_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists training_courses_slug_idx on public.training_courses(slug);
create index if not exists training_courses_domain_idx on public.training_courses(domain);
create index if not exists training_courses_active_idx on public.training_courses(is_active);

alter table public.training_courses enable row level security;

drop policy if exists "Public can read active training courses" on public.training_courses;
create policy "Public can read active training courses"
  on public.training_courses
  for select
  using (is_active = true);

comment on table public.training_courses is 'Formations catalogue EDGE Business — administrables via /super/formations';
