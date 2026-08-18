-- Qualiopi admin vault + sessions d'émargement (pipeline BTOB)

insert into public.crm_pipeline_stages (pipeline_type, slug, label, sort_order)
values
  ('btob', 'client_actif', 'Client actif', 8),
  ('btob', 'formation_programmee', 'Formation programmée', 9),
  ('btob', 'formation_en_cours', 'Formation en cours', 10)
on conflict (pipeline_type, slug) do update
set label = excluded.label, sort_order = excluded.sort_order;

update public.crm_pipeline_stages
set sort_order = 11
where pipeline_type = 'btob' and slug = 'echec';

create table if not exists public.crm_qualiopi_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('convention', 'reglement', 'livret', 'autre')),
  title text not null,
  file_url text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_qualiopi_documents_kind_unique
  on public.crm_qualiopi_documents (kind)
  where kind in ('convention', 'reglement', 'livret');

insert into public.crm_qualiopi_documents (kind, title)
select v.kind, v.title
from (
  values
    ('convention', 'Convention de formation'),
    ('reglement', 'Règlement intérieur'),
    ('livret', 'Livret d''accueil')
) as v(kind, title)
where not exists (
  select 1 from public.crm_qualiopi_documents d where d.kind = v.kind
);

create table if not exists public.crm_qualiopi_sessions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.crm_pipeline_deals (id) on delete cascade,
  course_id text,
  course_name text not null,
  scheduled_at date,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'done')),
  convention_sent_at timestamptz,
  reglement_sent_at timestamptz,
  livret_sent_at timestamptz,
  emargement_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_sessions_deal_idx on public.crm_qualiopi_sessions (deal_id);

create table if not exists public.crm_qualiopi_attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.crm_qualiopi_sessions (id) on delete cascade,
  full_name text not null,
  email text not null,
  token text not null unique,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_qualiopi_attendees_session_idx on public.crm_qualiopi_attendees (session_id);
create index if not exists crm_qualiopi_attendees_token_idx on public.crm_qualiopi_attendees (token);

alter table public.crm_qualiopi_documents enable row level security;
alter table public.crm_qualiopi_sessions enable row level security;
alter table public.crm_qualiopi_attendees enable row level security;

drop policy if exists crm_qualiopi_documents_super on public.crm_qualiopi_documents;
create policy crm_qualiopi_documents_super on public.crm_qualiopi_documents
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists crm_qualiopi_sessions_super on public.crm_qualiopi_sessions;
create policy crm_qualiopi_sessions_super on public.crm_qualiopi_sessions
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );

drop policy if exists crm_qualiopi_attendees_super on public.crm_qualiopi_attendees;
create policy crm_qualiopi_attendees_super on public.crm_qualiopi_attendees
  for all using (
    exists (
      select 1 from public.super_admins sa
      where sa.user_id = auth.uid() and sa.is_active = true
    )
  );
