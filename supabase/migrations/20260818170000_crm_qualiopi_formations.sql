-- Formations Qualiopi : une session = un dossier unique (convention, livret, émargement, satisfaction)

alter table public.crm_qualiopi_sessions
  add column if not exists satisfaction_sent_at timestamptz;

alter table public.crm_qualiopi_attendees
  add column if not exists satisfaction_token text,
  add column if not exists satisfaction_score int,
  add column if not exists satisfaction_comment text,
  add column if not exists satisfaction_at timestamptz;

update public.crm_qualiopi_attendees
set satisfaction_token = gen_random_uuid()::text
where satisfaction_token is null;

create unique index if not exists crm_qualiopi_attendees_satisfaction_token_idx
  on public.crm_qualiopi_attendees (satisfaction_token)
  where satisfaction_token is not null;

alter table public.crm_qualiopi_documents
  add column if not exists session_id uuid references public.crm_qualiopi_sessions (id) on delete cascade;

drop index if exists crm_qualiopi_documents_kind_unique;

create unique index if not exists crm_qualiopi_documents_template_kind_unique
  on public.crm_qualiopi_documents (kind)
  where session_id is null and kind in ('convention', 'reglement', 'livret');

create unique index if not exists crm_qualiopi_documents_session_kind_unique
  on public.crm_qualiopi_documents (session_id, kind)
  where session_id is not null and kind in ('convention', 'reglement', 'livret');

insert into public.crm_pipeline_stages (pipeline_type, slug, label, sort_order)
values ('btob', 'proposition_signee', 'Proposition signée', 6)
on conflict (pipeline_type, slug) do update
set label = excluded.label, sort_order = excluded.sort_order;

update public.crm_pipeline_deals
set stage_slug = 'proposition_signee', updated_at = now()
where pipeline_type = 'btob'
  and stage_slug in ('formation_programmee', 'formation_en_cours');

update public.crm_pipeline_stages set sort_order = 7 where pipeline_type = 'btob' and slug = 'reussi';
update public.crm_pipeline_stages set sort_order = 8 where pipeline_type = 'btob' and slug = 'client_actif';
update public.crm_pipeline_stages set sort_order = 9 where pipeline_type = 'btob' and slug = 'echec';
update public.crm_pipeline_stages set sort_order = 90 where pipeline_type = 'btob' and slug = 'formation_programmee';
update public.crm_pipeline_stages set sort_order = 91 where pipeline_type = 'btob' and slug = 'formation_en_cours';
