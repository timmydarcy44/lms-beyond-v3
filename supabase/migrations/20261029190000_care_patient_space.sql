-- Espace patient Byound Care.
-- Script à coller dans le SQL Editor. Non exécuté par l'application.
-- Aucune ligne de démonstration : les cartes sans donnée restent vides.

begin;

create or replace function public.care_is_practitioner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_active_membership(auth.uid(), 'care')
    or exists (
      select 1
      from public.care_profiles p
      where p.expert_id = auth.uid()
        and p.is_care
    );
$$;

revoke all on function public.care_is_practitioner() from public, anon;
grant execute on function public.care_is_practitioner() to authenticated;

create table if not exists public.care_relatives (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  birth_year integer,
  relation text not null,
  created_at timestamptz not null default now(),
  constraint care_relatives_relation check (relation in ('enfant', 'conjoint', 'autre')),
  constraint care_relatives_birth_year check (birth_year is null or birth_year between 1900 and 2100),
  constraint care_relatives_first_name check (char_length(btrim(first_name)) > 0)
);

create index if not exists care_relatives_account_idx on public.care_relatives (account_id, created_at);

alter table public.care_bookings
  add column if not exists patient_account_id uuid references public.profiles (id) on delete set null,
  add column if not exists subject_relative_id uuid references public.care_relatives (id) on delete set null;

create index if not exists care_bookings_patient_idx
  on public.care_bookings (patient_account_id, starts_at desc);

create table if not exists public.care_documents (
  id uuid primary key default gen_random_uuid(),
  patient_account_id uuid not null references public.profiles (id) on delete cascade,
  subject_relative_id uuid references public.care_relatives (id) on delete set null,
  practitioner_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  kind text not null,
  title text not null,
  storage_path text,
  shared_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  constraint care_documents_kind check (kind in ('report', 'test_result', 'invoice', 'other')),
  constraint care_documents_title check (char_length(btrim(title)) > 0)
);

create index if not exists care_documents_patient_idx
  on public.care_documents (patient_account_id, created_at desc);
create index if not exists care_documents_shared_idx
  on public.care_documents (patient_account_id, shared_at desc)
  where shared_at is not null;

create table if not exists public.care_test_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.care_documents (id) on delete cascade,
  patient_account_id uuid not null references public.profiles (id) on delete cascade,
  subject_relative_id uuid references public.care_relatives (id) on delete set null,
  practitioner_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  scores jsonb not null default '[]'::jsonb,
  practitioner_comment text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint care_test_results_scores_array check (jsonb_typeof(scores) = 'array')
);

create index if not exists care_test_results_patient_idx
  on public.care_test_results (patient_account_id, published_at desc);

create table if not exists public.care_journeys (
  id uuid primary key default gen_random_uuid(),
  patient_account_id uuid not null references public.profiles (id) on delete cascade,
  subject_relative_id uuid references public.care_relatives (id) on delete set null,
  practitioner_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  constraint care_journeys_title check (char_length(btrim(title)) > 0)
);

create index if not exists care_journeys_patient_idx
  on public.care_journeys (patient_account_id, created_at desc);

create table if not exists public.care_journey_steps (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.care_journeys (id) on delete cascade,
  title text not null,
  position integer not null,
  status text not null default 'todo',
  step_date date,
  constraint care_journey_steps_status check (status in ('done', 'current', 'todo')),
  constraint care_journey_steps_position check (position >= 0),
  unique (journey_id, position)
);

create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.care_journeys (id) on delete cascade,
  label text not null,
  hint text,
  done_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint care_tasks_label check (char_length(btrim(label)) > 0)
);

create index if not exists care_tasks_journey_idx on public.care_tasks (journey_id, position);

create table if not exists public.care_notes_to_patient (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.care_journeys (id) on delete cascade,
  practitioner_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  constraint care_notes_message check (char_length(btrim(message)) > 0 and char_length(message) <= 500)
);

create index if not exists care_notes_journey_idx on public.care_notes_to_patient (journey_id, created_at desc);

create table if not exists public.care_recommended_resources (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.care_journeys (id) on delete cascade,
  practitioner_id uuid not null references public.care_profiles (expert_id) on delete cascade,
  title text not null,
  kind text not null default 'lecture',
  duration_min integer,
  url text not null,
  created_at timestamptz not null default now(),
  constraint care_resources_title check (char_length(btrim(title)) > 0),
  constraint care_resources_duration check (duration_min is null or duration_min > 0)
);

create index if not exists care_resources_journey_idx
  on public.care_recommended_resources (journey_id, created_at desc);

-- Factures : on étend la table expert existante.
-- pdf_path vit dans le bucket privé. document_url reste pour l'envoi expert déjà en place,
-- et ne doit pas être exposé au patient.
alter table public.expert_care_invoices
  add column if not exists number text,
  add column if not exists paid_at timestamptz,
  add column if not exists method text,
  add column if not exists pdf_path text,
  add column if not exists patient_account_id uuid references public.profiles (id) on delete set null,
  add column if not exists subject_relative_id uuid references public.care_relatives (id) on delete set null;

create unique index if not exists expert_care_invoices_number_uidx
  on public.expert_care_invoices (expert_id, number)
  where number is not null;

create index if not exists expert_care_invoices_patient_idx
  on public.expert_care_invoices (patient_account_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('care-documents', 'care-documents', false)
on conflict (id) do update set public = false;

alter table public.care_relatives enable row level security;
alter table public.care_documents enable row level security;
alter table public.care_test_results enable row level security;
alter table public.care_journeys enable row level security;
alter table public.care_journey_steps enable row level security;
alter table public.care_tasks enable row level security;
alter table public.care_notes_to_patient enable row level security;
alter table public.care_recommended_resources enable row level security;

drop policy if exists care_relatives_owner on public.care_relatives;
create policy care_relatives_owner
  on public.care_relatives
  for all
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

drop policy if exists care_bookings_patient_read on public.care_bookings;
create policy care_bookings_patient_read
  on public.care_bookings
  for select
  to authenticated
  using (
    patient_account_id = auth.uid()
    or (
      patient_account_id is null
      and lower(client_email) = lower(coalesce((select p.email from public.profiles p where p.id = auth.uid()), ''))
    )
  );

drop policy if exists care_documents_patient_read on public.care_documents;
create policy care_documents_patient_read
  on public.care_documents
  for select
  to authenticated
  using (patient_account_id = auth.uid() and shared_at is not null);

drop policy if exists care_documents_patient_open on public.care_documents;
create policy care_documents_patient_open
  on public.care_documents
  for update
  to authenticated
  using (patient_account_id = auth.uid() and shared_at is not null)
  with check (patient_account_id = auth.uid() and shared_at is not null);

drop policy if exists care_documents_practitioner on public.care_documents;
create policy care_documents_practitioner
  on public.care_documents
  for all
  to authenticated
  using (practitioner_id = auth.uid() and public.care_is_practitioner())
  with check (practitioner_id = auth.uid() and public.care_is_practitioner());

drop policy if exists care_test_results_patient_read on public.care_test_results;
create policy care_test_results_patient_read
  on public.care_test_results
  for select
  to authenticated
  using (
    patient_account_id = auth.uid()
    and published_at is not null
    and practitioner_comment is not null
    and char_length(btrim(practitioner_comment)) > 0
    and exists (
      select 1
      from public.care_documents d
      where d.id = document_id
        and d.patient_account_id = auth.uid()
        and d.shared_at is not null
    )
  );

drop policy if exists care_test_results_practitioner on public.care_test_results;
create policy care_test_results_practitioner
  on public.care_test_results
  for all
  to authenticated
  using (practitioner_id = auth.uid() and public.care_is_practitioner())
  with check (practitioner_id = auth.uid() and public.care_is_practitioner());

drop policy if exists care_journeys_patient_read on public.care_journeys;
create policy care_journeys_patient_read
  on public.care_journeys
  for select
  to authenticated
  using (patient_account_id = auth.uid());

drop policy if exists care_journeys_practitioner on public.care_journeys;
create policy care_journeys_practitioner
  on public.care_journeys
  for all
  to authenticated
  using (practitioner_id = auth.uid() and public.care_is_practitioner())
  with check (practitioner_id = auth.uid() and public.care_is_practitioner());

drop policy if exists care_steps_patient_read on public.care_journey_steps;
create policy care_steps_patient_read
  on public.care_journey_steps
  for select
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  );

drop policy if exists care_steps_practitioner on public.care_journey_steps;
create policy care_steps_practitioner
  on public.care_journey_steps
  for all
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id
        and j.practitioner_id = auth.uid()
        and public.care_is_practitioner()
    )
  )
  with check (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id
        and j.practitioner_id = auth.uid()
        and public.care_is_practitioner()
    )
  );

drop policy if exists care_tasks_patient_read on public.care_tasks;
create policy care_tasks_patient_read
  on public.care_tasks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  );

drop policy if exists care_tasks_patient_check on public.care_tasks;
create policy care_tasks_patient_check
  on public.care_tasks
  for update
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  );

drop policy if exists care_tasks_practitioner on public.care_tasks;
create policy care_tasks_practitioner
  on public.care_tasks
  for all
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id
        and j.practitioner_id = auth.uid()
        and public.care_is_practitioner()
    )
  )
  with check (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id
        and j.practitioner_id = auth.uid()
        and public.care_is_practitioner()
    )
  );

drop policy if exists care_notes_patient_read on public.care_notes_to_patient;
create policy care_notes_patient_read
  on public.care_notes_to_patient
  for select
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  );

drop policy if exists care_notes_practitioner on public.care_notes_to_patient;
create policy care_notes_practitioner
  on public.care_notes_to_patient
  for all
  to authenticated
  using (practitioner_id = auth.uid() and public.care_is_practitioner())
  with check (practitioner_id = auth.uid() and public.care_is_practitioner());

drop policy if exists care_resources_patient_read on public.care_recommended_resources;
create policy care_resources_patient_read
  on public.care_recommended_resources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.care_journeys j
      where j.id = journey_id and j.patient_account_id = auth.uid()
    )
  );

drop policy if exists care_resources_practitioner on public.care_recommended_resources;
create policy care_resources_practitioner
  on public.care_recommended_resources
  for all
  to authenticated
  using (practitioner_id = auth.uid() and public.care_is_practitioner())
  with check (practitioner_id = auth.uid() and public.care_is_practitioner());

drop policy if exists expert_care_invoices_patient_read on public.expert_care_invoices;
create policy expert_care_invoices_patient_read
  on public.expert_care_invoices
  for select
  to authenticated
  using (patient_account_id = auth.uid());

drop policy if exists expert_care_invoices_practitioner on public.expert_care_invoices;
create policy expert_care_invoices_practitioner
  on public.expert_care_invoices
  for all
  to authenticated
  using (expert_id = auth.uid() and public.care_is_practitioner())
  with check (expert_id = auth.uid() and public.care_is_practitioner());

drop policy if exists "Care documents practitioner write" on storage.objects;
create policy "Care documents practitioner write"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'care-documents'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.care_is_practitioner()
  )
  with check (
    bucket_id = 'care-documents'
    and split_part(name, '/', 1) = auth.uid()::text
    and public.care_is_practitioner()
  );

create or replace function public.care_documents_guard_patient_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.patient_account_id and auth.uid() is distinct from old.practitioner_id then
    new.patient_account_id := old.patient_account_id;
    new.subject_relative_id := old.subject_relative_id;
    new.practitioner_id := old.practitioner_id;
    new.kind := old.kind;
    new.title := old.title;
    new.storage_path := old.storage_path;
    new.shared_at := old.shared_at;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists care_documents_guard_patient_update on public.care_documents;
create trigger care_documents_guard_patient_update
  before update on public.care_documents
  for each row
  execute function public.care_documents_guard_patient_update();

create or replace function public.care_tasks_guard_patient_update()
returns trigger
language plpgsql
as $$
declare
  v_practitioner uuid;
begin
  select j.practitioner_id into v_practitioner
  from public.care_journeys j
  where j.id = old.journey_id;
  if auth.uid() is distinct from v_practitioner then
    new.journey_id := old.journey_id;
    new.label := old.label;
    new.hint := old.hint;
    new.position := old.position;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists care_tasks_guard_patient_update on public.care_tasks;
create trigger care_tasks_guard_patient_update
  before update on public.care_tasks
  for each row
  execute function public.care_tasks_guard_patient_update();

revoke all on table public.care_relatives from anon, public;
revoke all on table public.care_documents from anon, public;
revoke all on table public.care_test_results from anon, public;
revoke all on table public.care_journeys from anon, public;
revoke all on table public.care_journey_steps from anon, public;
revoke all on table public.care_tasks from anon, public;
revoke all on table public.care_notes_to_patient from anon, public;
revoke all on table public.care_recommended_resources from anon, public;

grant select, insert, update, delete on table public.care_relatives to authenticated;
grant select, insert, update, delete on table public.care_documents to authenticated;
grant select, insert, update, delete on table public.care_test_results to authenticated;
grant select, insert, update, delete on table public.care_journeys to authenticated;
grant select, insert, update, delete on table public.care_journey_steps to authenticated;
grant select, insert, update, delete on table public.care_tasks to authenticated;
grant select, insert, update, delete on table public.care_notes_to_patient to authenticated;
grant select, insert, update, delete on table public.care_recommended_resources to authenticated;

commit;
