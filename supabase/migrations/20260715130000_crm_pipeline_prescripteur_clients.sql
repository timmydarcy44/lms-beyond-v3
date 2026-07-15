-- Liaison prescripteur ↔ prospect + commission par client

create table if not exists public.crm_pipeline_prescripteur_clients (
  id uuid primary key default gen_random_uuid(),
  prescripteur_id uuid not null references public.crm_pipeline_prescripteurs(id) on delete cascade,
  deal_id uuid not null references public.crm_pipeline_deals(id) on delete cascade,
  commission_type text not null default 'percent' check (commission_type in ('percent', 'fixed')),
  commission_value numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prescripteur_id, deal_id)
);

create index if not exists crm_pipeline_prescripteur_clients_prescripteur_idx
  on public.crm_pipeline_prescripteur_clients (prescripteur_id);

create index if not exists crm_pipeline_prescripteur_clients_deal_idx
  on public.crm_pipeline_prescripteur_clients (deal_id);

alter table public.crm_pipeline_prescripteur_clients enable row level security;

drop policy if exists crm_pipeline_prescripteur_clients_super on public.crm_pipeline_prescripteur_clients;
create policy crm_pipeline_prescripteur_clients_super on public.crm_pipeline_prescripteur_clients
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
