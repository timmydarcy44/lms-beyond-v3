-- Veilles Qualiopi : sources prioritaires, synthèses hebdo, surlignages

create table if not exists public.crm_qualiopi_veille_sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('legale', 'metier', 'pedagogie')),
  url text not null,
  title text,
  is_priority boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, url)
);

create table if not exists public.crm_qualiopi_veille_digests (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  kind text not null check (kind in ('legale', 'metier', 'pedagogie')),
  title text not null,
  summary text not null default '',
  items jsonb not null default '[]'::jsonb,
  sources_used jsonb not null default '[]'::jsonb,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (week_start, kind)
);

create index if not exists crm_qualiopi_veille_digests_created_idx
  on public.crm_qualiopi_veille_digests (created_at desc);

create table if not exists public.crm_qualiopi_veille_highlights (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('legale', 'metier', 'pedagogie')),
  digest_id uuid references public.crm_qualiopi_veille_digests (id) on delete set null,
  title text not null,
  excerpt text not null,
  note text,
  url text,
  status text not null default 'saved' check (status in ('saved', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_veille_highlights_kind_idx
  on public.crm_qualiopi_veille_highlights (kind, created_at desc);

alter table public.crm_qualiopi_veille_sources enable row level security;
alter table public.crm_qualiopi_veille_digests enable row level security;
alter table public.crm_qualiopi_veille_highlights enable row level security;

drop policy if exists crm_qualiopi_veille_sources_super on public.crm_qualiopi_veille_sources;
create policy crm_qualiopi_veille_sources_super on public.crm_qualiopi_veille_sources
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists crm_qualiopi_veille_digests_super on public.crm_qualiopi_veille_digests;
create policy crm_qualiopi_veille_digests_super on public.crm_qualiopi_veille_digests
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists crm_qualiopi_veille_highlights_super on public.crm_qualiopi_veille_highlights;
create policy crm_qualiopi_veille_highlights_super on public.crm_qualiopi_veille_highlights
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
