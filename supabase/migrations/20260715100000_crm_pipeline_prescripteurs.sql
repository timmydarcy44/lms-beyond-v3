-- Prescripteurs BTOB (Timmy + Jérôme)

create table if not exists public.crm_pipeline_prescripteurs (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  company_name text not null default '',
  email text,
  phone text,
  next_action text not null default '',
  notes text,
  contact_owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipeline_prescripteurs_owner_idx
  on public.crm_pipeline_prescripteurs (contact_owner_email);

alter table public.crm_pipeline_prescripteurs enable row level security;

drop policy if exists crm_pipeline_prescripteurs_super on public.crm_pipeline_prescripteurs;
create policy crm_pipeline_prescripteurs_super on public.crm_pipeline_prescripteurs
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
