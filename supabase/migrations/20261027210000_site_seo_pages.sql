create table if not exists public.site_seo_pages (
  path text primary key,
  title text,
  meta_description text,
  h1 text,
  h2 text[] not null default '{}',
  og_title text,
  og_description text,
  keywords text[] not null default '{}',
  ai_summary text,
  faq jsonb not null default '[]'::jsonb,
  noindex boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.site_seo_pages enable row level security;
