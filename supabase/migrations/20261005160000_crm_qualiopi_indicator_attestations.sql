-- Attestations manuelles : indicateur RNQ validé avec preuve hors plateforme

create table if not exists public.crm_qualiopi_indicator_attestations (
  indicator_id int primary key check (indicator_id >= 1 and indicator_id <= 32),
  note text,
  attested_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_qualiopi_indicator_attestations enable row level security;

drop policy if exists crm_qualiopi_indicator_attestations_super on public.crm_qualiopi_indicator_attestations;
create policy crm_qualiopi_indicator_attestations_super on public.crm_qualiopi_indicator_attestations
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
