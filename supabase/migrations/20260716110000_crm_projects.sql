-- Kanban projets EDGE (Timmy / Jérôme)

create table if not exists public.crm_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage_slug text not null default 'projet_a_definir',
  topic_slug text not null default 'commercial',
  sort_order integer not null default 0,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_projects_stage_idx on public.crm_projects (stage_slug, sort_order);
create index if not exists crm_projects_topic_idx on public.crm_projects (topic_slug);

alter table public.crm_projects enable row level security;

drop policy if exists crm_projects_super on public.crm_projects;
create policy crm_projects_super on public.crm_projects
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
