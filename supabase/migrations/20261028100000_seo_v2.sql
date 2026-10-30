-- SEO v2 : score persisté, contrôles, versions, GSC, modèles.
-- Les colonnes h1 / h2 existantes sont conservées (aucune suppression).

alter table public.site_seo_pages
  add column if not exists focus_keyword text,
  add column if not exists canonical_url text,
  add column if not exists og_image_url text,
  add column if not exists jsonld_types text[] not null default '{}',
  add column if not exists score integer,
  add column if not exists draft jsonb,
  add column if not exists published_at timestamptz,
  add column if not exists headings_cache jsonb,
  add column if not exists headings_cached_at timestamptz;

create table if not exists public.seo_page_checks (
  path text not null,
  check_id text not null,
  passed boolean not null,
  message text,
  category text not null,
  weight integer not null,
  computed_at timestamptz not null default now(),
  primary key (path, check_id)
);

create table if not exists public.site_seo_versions (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  snapshot jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid
);
create index if not exists site_seo_versions_path_idx on public.site_seo_versions (path, published_at desc);

create table if not exists public.seo_ai_proposals (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  batch_id uuid,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists seo_ai_proposals_path_idx on public.seo_ai_proposals (path, created_at desc);

create table if not exists public.seo_gsc_daily (
  day date not null,
  page text not null,
  query text not null default '',
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric,
  position numeric,
  primary key (day, page, query)
);

create table if not exists public.seo_templates (
  type text primary key,
  title_template text not null,
  description_template text not null,
  jsonld_type text,
  og_image_url text
);

alter table public.seo_page_checks enable row level security;
alter table public.site_seo_versions enable row level security;
alter table public.seo_ai_proposals enable row level security;
alter table public.seo_gsc_daily enable row level security;
alter table public.seo_templates enable row level security;
