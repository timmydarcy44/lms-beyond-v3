-- Qualiopi Qualité v2 — messagerie réclamations + tickets produit + templates
-- Mapping statuts : open/in_progress/closed → received/acknowledged/analysis/answered/closed

-- ---------------------------------------------------------------------------
-- Réclamations : colonnes + statuts élargis
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_reclamations
  add column if not exists answered_at timestamptz,
  add column if not exists resolution_note text,
  add column if not exists ticket_id uuid,
  add column if not exists ticket_url text,
  add column if not exists requester_role text,
  add column if not exists requester_company text,
  add column if not exists source text,
  add column if not exists is_test boolean not null default false;

alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_source_check;
alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_source_check
  check (
    source is null
    or source in (
      'espace_entreprise',
      'espace_apprenant',
      'espace_formateur',
      'email',
      'telephone',
      'saisie_interne'
    )
  );

-- Backfill source depuis channel + audience
update public.crm_qualiopi_reclamations
set source = case
  when audience = 'entreprise' or channel = 'dashboard' then 'espace_entreprise'
  when audience = 'apprenant' then 'espace_apprenant'
  when audience = 'expert' then 'espace_formateur'
  when channel = 'email' then 'email'
  else 'saisie_interne'
end
where source is null;

alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_status_check;

-- Accepter anciens + nouveaux codes pendant transition
alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_status_check
  check (
    status in (
      'open',
      'in_progress',
      'closed',
      'received',
      'acknowledged',
      'analysis',
      'answered'
    )
  );

-- Backfill status canonique
update public.crm_qualiopi_reclamations
set status = case
  when status = 'closed' or closed_at is not null then 'closed'
  when response is not null and length(trim(response)) > 0 then 'answered'
  when ack_at is not null and status = 'in_progress' then 'analysis'
  when ack_at is not null then 'acknowledged'
  when status = 'in_progress' then 'analysis'
  else 'received'
end
where status in ('open', 'in_progress', 'closed');

update public.crm_qualiopi_reclamations
set answered_at = coalesce(answered_at, updated_at, closed_at)
where answered_at is null
  and response is not null
  and length(trim(response)) > 0;

-- Délais OF (propositions validées plan : 2 / 10)
update public.of_settings
set
  reclamation_ack_business_days = 2,
  reclamation_reply_business_days = 10
where id = '00000000-0000-4000-8000-000000000001'::uuid;

-- ---------------------------------------------------------------------------
-- Messages (fil de conversation)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_qualiopi_reclamation_messages (
  id uuid primary key default gen_random_uuid(),
  reclamation_id uuid not null references public.crm_qualiopi_reclamations (id) on delete cascade,
  kind text not null check (kind in ('requester', 'reply', 'note_interne', 'system_step')),
  body text not null default '',
  author_user_id uuid references auth.users (id) on delete set null,
  author_name text,
  template_key text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_reclamation_messages_rec_idx
  on public.crm_qualiopi_reclamation_messages (reclamation_id, created_at asc);

-- Seed historique depuis description / response existantes
insert into public.crm_qualiopi_reclamation_messages (reclamation_id, kind, body, author_name, created_at)
select
  r.id,
  'requester',
  coalesce(nullif(trim(r.description), ''), r.subject),
  r.requester_name,
  r.received_at
from public.crm_qualiopi_reclamations r
where not exists (
  select 1 from public.crm_qualiopi_reclamation_messages m
  where m.reclamation_id = r.id and m.kind = 'requester'
);

insert into public.crm_qualiopi_reclamation_messages (reclamation_id, kind, body, author_name, created_at)
select
  r.id,
  'reply',
  trim(r.response),
  'Équipe qualité',
  coalesce(r.answered_at, r.closed_at, r.updated_at)
from public.crm_qualiopi_reclamations r
where r.response is not null
  and length(trim(r.response)) > 0
  and not exists (
    select 1 from public.crm_qualiopi_reclamation_messages m
    where m.reclamation_id = r.id and m.kind = 'reply'
  );

-- ---------------------------------------------------------------------------
-- Templates de réponse
-- ---------------------------------------------------------------------------
create table if not exists public.crm_qualiopi_reply_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  body text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.crm_qualiopi_reply_templates (key, label, body, sort_order)
values
  (
    'ack',
    'Accusé de réception',
    'Bonjour,\n\nNous avons bien reçu votre réclamation concernant « {{subject}} ».\nNous en accusons réception et revenons vers vous dans les meilleurs délais.\n\nCordialement,\nL’équipe Qualité Byound',
    1
  ),
  (
    'tech',
    'Problème technique pris en charge',
    'Bonjour,\n\nMerci pour votre signalement. Nous avons créé un ticket pour l’équipe produit et prenons en charge le problème technique lié à « {{subject}} ».\nNous vous tiendrons informé(e) de l’avancement.\n\nCordialement,\nL’équipe Qualité Byound',
    2
  ),
  (
    'precision',
    'Demande de précisions',
    'Bonjour,\n\nPour traiter au mieux votre réclamation « {{subject}} », pourriez-vous nous préciser :\n- le contexte exact ;\n- les étapes déjà suivies ;\n- une capture d’écran si utile.\n\nMerci,\nL’équipe Qualité Byound',
    3
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Tickets produit (aucun outil externe dans le repo)
-- ---------------------------------------------------------------------------
create table if not exists public.crm_product_tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  reclamation_id uuid references public.crm_qualiopi_reclamations (id) on delete set null,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_product_tickets_rec_idx
  on public.crm_product_tickets (reclamation_id);

alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_ticket_id_fkey;
alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_ticket_id_fkey
  foreign key (ticket_id) references public.crm_product_tickets (id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_reclamation_messages enable row level security;
alter table public.crm_qualiopi_reply_templates enable row level security;
alter table public.crm_product_tickets enable row level security;

drop policy if exists crm_qualiopi_reclamation_messages_super on public.crm_qualiopi_reclamation_messages;
create policy crm_qualiopi_reclamation_messages_super on public.crm_qualiopi_reclamation_messages
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_reply_templates_super on public.crm_qualiopi_reply_templates;
create policy crm_qualiopi_reply_templates_super on public.crm_qualiopi_reply_templates
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_product_tickets_super on public.crm_product_tickets;
create policy crm_product_tickets_super on public.crm_product_tickets
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );
