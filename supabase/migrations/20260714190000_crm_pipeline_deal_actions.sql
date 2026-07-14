-- Journal d'actions commerciales + synthèse IA prospect

create table if not exists public.crm_pipeline_deal_actions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_pipeline_deals(id) on delete cascade,
  action_type text not null check (
    action_type in (
      'call_success',
      'call_no_answer',
      'call_voicemail',
      'call_busy',
      'call_failed',
      'email',
      'meeting',
      'note',
      'other'
    )
  ),
  title text,
  notes text,
  transcript text,
  ai_summary text,
  recording_path text,
  duration_seconds integer,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_pipeline_deal_actions_deal
  on public.crm_pipeline_deal_actions (deal_id, created_at desc);

alter table public.crm_pipeline_deals
  add column if not exists ai_prospect_summary text,
  add column if not exists ai_prospect_summary_at timestamptz;

alter table public.crm_pipeline_deal_actions enable row level security;

drop policy if exists crm_pipeline_deal_actions_super on public.crm_pipeline_deal_actions;
create policy crm_pipeline_deal_actions_super on public.crm_pipeline_deal_actions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
