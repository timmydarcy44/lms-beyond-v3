-- Lot 1 Byound Handicap : tables disability_*, RLS, bucket, migration depuis handicap_*
-- Conservation : 3 ans après clôture (constante applicative) ; suppression manuelle possible.
-- Notes RDV : chiffrement côté app (DISABILITY_SENSITIVE_KEY), colonne notes_enc.

create or replace function public.is_disability_staff(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null
    and (
      exists (
        select 1
        from public.super_admins sa
        where sa.user_id = p_user_id
          and sa.is_active is true
      )
      or exists (
        select 1
        from public.of_settings ofs
        where ofs.id = '00000000-0000-4000-8000-000000000001'::uuid
          and ofs.referent_handicap_user_id = p_user_id
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = p_user_id
          and lower(
            translate(
              coalesce(p.role_type, ''),
              'éèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ',
              'eeeeaaauuuooiicEEEEAAAUUUOOIIC'
            )
          ) in (
            'referente_handicap',
            'referent_handicap',
            'referente_handicape',
            'referent_handicape',
            'rh_handicap',
            'charge_handicap',
            'chargee_handicap',
            'ref_handicap',
            'accompagnant_handicap',
            'accompagnante_handicap'
          )
      )
    );
$$;

revoke all on function public.is_disability_staff(uuid) from public;
grant execute on function public.is_disability_staff(uuid) to authenticated;
grant execute on function public.is_disability_staff(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.disability_cases (
  id uuid primary key default gen_random_uuid(),
  person_profile_id uuid references public.profiles (id) on delete set null,
  employee_id uuid references public.employees (id) on delete set null,
  cfa_application_id uuid references public.cfa_applications (id) on delete set null,
  organization_id uuid,
  scope text not null default 'business' check (scope in ('business', 'school')),
  status text not null default 'request'
    check (status in ('request', 'interview', 'plan', 'active', 'review', 'closed')),
  consent_given_at timestamptz,
  consent_method text,
  rqth_valid_until date,
  company_informed boolean not null default false,
  legacy_handicap_profile_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint disability_cases_person_src check (
    person_profile_id is not null
    or employee_id is not null
    or cfa_application_id is not null
  )
);

create index if not exists disability_cases_status_idx
  on public.disability_cases (status, updated_at desc);
create index if not exists disability_cases_org_idx
  on public.disability_cases (organization_id);
create index if not exists disability_cases_legacy_idx
  on public.disability_cases (legacy_handicap_profile_id);

create table if not exists public.disability_accommodations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  category text not null
    check (category in ('evaluations', 'supports', 'rythme', 'locaux', 'materiel', 'autre')),
  label text not null,
  details text,
  shared_with_trainer_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists disability_accommodations_case_idx
  on public.disability_accommodations (case_id, created_at desc);

create table if not exists public.disability_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  label text not null,
  owner text not null
    check (owner in ('referent', 'trainer', 'byound', 'company', 'partner')),
  due_date date,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'planned')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists disability_actions_case_idx
  on public.disability_actions (case_id, due_date);

create table if not exists public.disability_meetings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  title text not null default 'Rendez-vous',
  scheduled_at timestamptz,
  mode text check (mode is null or mode in ('visio', 'telephone', 'presentiel')),
  location text,
  notes_enc text,
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz,
  sequence_n integer,
  legacy_meeting_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disability_meetings_case_idx
  on public.disability_meetings (case_id, scheduled_at desc nulls last);

create table if not exists public.disability_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  kind text not null check (kind in ('rqth', 'plan_signe', 'autre')),
  title text not null,
  storage_path text not null,
  valid_until date,
  uploaded_by uuid references auth.users (id) on delete set null,
  uploaded_at timestamptz not null default now(),
  legacy_document_id uuid
);

create index if not exists disability_documents_case_idx
  on public.disability_documents (case_id, uploaded_at desc);

create table if not exists public.disability_partners (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  partner text not null
    check (partner in ('agefiph', 'cap_emploi', 'medecin_travail', 'autre')),
  status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists disability_partners_case_idx
  on public.disability_partners (case_id);

create table if not exists public.disability_access_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.disability_cases (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null
    check (action in (
      'view_case',
      'open_document',
      'share_trainer',
      'export',
      'manual_delete'
    )),
  created_at timestamptz not null default now()
);

create index if not exists disability_access_log_case_idx
  on public.disability_access_log (case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.disability_cases enable row level security;
alter table public.disability_accommodations enable row level security;
alter table public.disability_actions enable row level security;
alter table public.disability_meetings enable row level security;
alter table public.disability_documents enable row level security;
alter table public.disability_partners enable row level security;
alter table public.disability_access_log enable row level security;

drop policy if exists disability_cases_staff on public.disability_cases;
create policy disability_cases_staff on public.disability_cases
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

drop policy if exists disability_accommodations_staff on public.disability_accommodations;
create policy disability_accommodations_staff on public.disability_accommodations
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

drop policy if exists disability_actions_staff on public.disability_actions;
create policy disability_actions_staff on public.disability_actions
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

drop policy if exists disability_meetings_staff on public.disability_meetings;
create policy disability_meetings_staff on public.disability_meetings
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

drop policy if exists disability_documents_staff on public.disability_documents;
create policy disability_documents_staff on public.disability_documents
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

drop policy if exists disability_partners_staff on public.disability_partners;
create policy disability_partners_staff on public.disability_partners
  for all
  using (public.is_disability_staff(auth.uid()))
  with check (public.is_disability_staff(auth.uid()));

-- access log : insert + select only (no update/delete even for staff via RLS)
drop policy if exists disability_access_log_select on public.disability_access_log;
create policy disability_access_log_select on public.disability_access_log
  for select
  using (public.is_disability_staff(auth.uid()));

drop policy if exists disability_access_log_insert on public.disability_access_log;
create policy disability_access_log_insert on public.disability_access_log
  for insert
  with check (public.is_disability_staff(auth.uid()));

grant select, insert, update, delete on public.disability_cases to authenticated;
grant select, insert, update, delete on public.disability_accommodations to authenticated;
grant select, insert, update, delete on public.disability_actions to authenticated;
grant select, insert, update, delete on public.disability_meetings to authenticated;
grant select, insert, update, delete on public.disability_documents to authenticated;
grant select, insert, update, delete on public.disability_partners to authenticated;
grant select, insert on public.disability_access_log to authenticated;

grant all on public.disability_cases to service_role;
grant all on public.disability_accommodations to service_role;
grant all on public.disability_actions to service_role;
grant all on public.disability_meetings to service_role;
grant all on public.disability_documents to service_role;
grant all on public.disability_partners to service_role;
grant all on public.disability_access_log to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'disability-docs',
  'disability-docs',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists disability_docs_select on storage.objects;
create policy disability_docs_select on storage.objects
  for select
  using (
    bucket_id = 'disability-docs'
    and public.is_disability_staff(auth.uid())
  );

drop policy if exists disability_docs_insert on storage.objects;
create policy disability_docs_insert on storage.objects
  for insert
  with check (
    bucket_id = 'disability-docs'
    and public.is_disability_staff(auth.uid())
  );

drop policy if exists disability_docs_update on storage.objects;
create policy disability_docs_update on storage.objects
  for update
  using (
    bucket_id = 'disability-docs'
    and public.is_disability_staff(auth.uid())
  )
  with check (
    bucket_id = 'disability-docs'
    and public.is_disability_staff(auth.uid())
  );

drop policy if exists disability_docs_delete on storage.objects;
create policy disability_docs_delete on storage.objects
  for delete
  using (
    bucket_id = 'disability-docs'
    and public.is_disability_staff(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Data migration from handicap_* (idempotent via legacy ids)
-- ---------------------------------------------------------------------------

insert into public.disability_cases (
  id,
  person_profile_id,
  employee_id,
  cfa_application_id,
  organization_id,
  scope,
  status,
  created_at,
  updated_at,
  closed_at,
  legacy_handicap_profile_id
)
select
  gen_random_uuid(),
  case
    when hp.source_kind = 'employee' then e.profile_id
    when hp.source_kind = 'formation_participant' then fp.profile_id
    else null
  end,
  case when hp.source_kind = 'employee' then hp.source_id else null end,
  case when hp.source_kind = 'cfa_application' then hp.source_id else null end,
  hp.organization_id,
  hp.scope,
  case
    when coalesce(hp.active, false) = false then 'closed'
    when hp.rqth then 'active'
    else 'request'
  end,
  hp.created_at,
  hp.updated_at,
  case when coalesce(hp.active, false) = false then hp.updated_at else null end,
  hp.id
from public.handicap_profiles hp
left join public.employees e
  on hp.source_kind = 'employee' and e.id = hp.source_id
left join public.formation_participants fp
  on hp.source_kind = 'formation_participant' and fp.id = hp.source_id
where not exists (
  select 1
  from public.disability_cases dc
  where dc.legacy_handicap_profile_id = hp.id
)
and (
  (hp.source_kind = 'employee' and e.id is not null)
  or (hp.source_kind = 'formation_participant' and fp.id is not null)
  or (hp.source_kind = 'cfa_application')
);

-- Besoins spécifiques / needs_summary → accommodation catégorie « autre »
insert into public.disability_accommodations (case_id, category, label, details, created_at)
select
  dc.id,
  'autre',
  'Besoins spécifiques',
  nullif(trim(coalesce(hp.specific_needs, hp.needs_summary)), ''),
  coalesce(hp.updated_at, hp.created_at, now())
from public.handicap_profiles hp
join public.disability_cases dc on dc.legacy_handicap_profile_id = hp.id
where nullif(trim(coalesce(hp.specific_needs, hp.needs_summary)), '') is not null
  and not exists (
    select 1
    from public.disability_accommodations da
    where da.case_id = dc.id
      and da.category = 'autre'
      and da.label = 'Besoins spécifiques'
  );

-- Plan libre → rendez-vous historique clos
insert into public.disability_meetings (
  case_id, title, status, notes_enc, closed_at, created_at, updated_at
)
select
  dc.id,
  'Note de plan (migration)',
  'closed',
  hp.accompaniment_plan,
  coalesce(hp.updated_at, now()),
  coalesce(hp.created_at, now()),
  coalesce(hp.updated_at, now())
from public.handicap_profiles hp
join public.disability_cases dc on dc.legacy_handicap_profile_id = hp.id
where nullif(trim(hp.accompaniment_plan), '') is not null
  and not exists (
    select 1
    from public.disability_meetings dm
    where dm.case_id = dc.id
      and dm.title = 'Note de plan (migration)'
  );

-- Meetings existants
insert into public.disability_meetings (
  case_id,
  title,
  status,
  notes_enc,
  closed_at,
  sequence_n,
  legacy_meeting_id,
  created_at,
  updated_at
)
select
  dc.id,
  'Rendez-vous ' || coalesce(hm.sequence_n::text, '1'),
  case when hm.status = 'closed' then 'closed' else 'open' end,
  hm.notes,
  hm.closed_at,
  hm.sequence_n,
  hm.id,
  hm.created_at,
  coalesce(hm.updated_at, hm.created_at)
from public.handicap_meetings hm
join public.disability_cases dc on dc.legacy_handicap_profile_id = hm.profile_id
where not exists (
  select 1
  from public.disability_meetings dm
  where dm.legacy_meeting_id = hm.id
);

-- Documents existants (file_url public → storage_path text pour traçabilité ; re-upload bucket prévu en lot 3)
insert into public.disability_documents (
  case_id, kind, title, storage_path, uploaded_by, uploaded_at, legacy_document_id
)
select
  dc.id,
  case when hd.kind = 'rqth' then 'rqth' else 'autre' end,
  hd.title,
  coalesce(hd.file_url, 'legacy://missing'),
  hd.uploaded_by,
  hd.created_at,
  hd.id
from public.handicap_documents hd
join public.disability_cases dc on dc.legacy_handicap_profile_id = hd.profile_id
where not exists (
  select 1
  from public.disability_documents dd
  where dd.legacy_document_id = hd.id
);
