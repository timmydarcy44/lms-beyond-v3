-- Historique d'actions commerciales pour les prescripteurs BTOB

create table if not exists public.crm_pipeline_prescripteur_actions (
  id uuid primary key default gen_random_uuid(),
  prescripteur_id uuid not null references public.crm_pipeline_prescripteurs(id) on delete cascade,
  action_type text not null check (
    action_type in (
      'linkedin_contact',
      'informal_meeting',
      'coffee',
      'restaurant_invite',
      'email',
      'phone',
      'meeting',
      'note',
      'other'
    )
  ),
  title text,
  notes text,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_pipeline_prescripteur_actions_prescripteur
  on public.crm_pipeline_prescripteur_actions (prescripteur_id, created_at desc);

alter table public.crm_pipeline_prescripteur_actions enable row level security;

drop policy if exists crm_pipeline_prescripteur_actions_super on public.crm_pipeline_prescripteur_actions;
create policy crm_pipeline_prescripteur_actions_super on public.crm_pipeline_prescripteur_actions
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
