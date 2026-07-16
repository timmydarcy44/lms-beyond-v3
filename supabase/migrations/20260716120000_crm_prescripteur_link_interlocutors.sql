-- Prescripteur: lien CTA + interlocuteurs multiples
alter table public.crm_pipeline_prescripteurs
  add column if not exists link_url text,
  add column if not exists cta_label text;

create table if not exists public.crm_pipeline_prescripteur_interlocutors (
  id uuid primary key default gen_random_uuid(),
  prescripteur_id uuid not null references public.crm_pipeline_prescripteurs(id) on delete cascade,
  sort_order integer not null default 0,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipeline_prescripteur_interlocutors_prescripteur_idx
  on public.crm_pipeline_prescripteur_interlocutors (prescripteur_id, sort_order);

alter table public.crm_pipeline_prescripteur_interlocutors enable row level security;

drop policy if exists crm_pipeline_prescripteur_interlocutors_super on public.crm_pipeline_prescripteur_interlocutors;
create policy crm_pipeline_prescripteur_interlocutors_super
  on public.crm_pipeline_prescripteur_interlocutors
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
