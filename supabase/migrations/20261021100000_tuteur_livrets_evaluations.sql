-- Livrets, évaluations et statuts de mission.
-- Déjà présents, ne pas recréer :
-- tutor_assignments, tutor_missions, tutor_mission_logs,
-- school_planning_slots, school_planning_modules, class_enrollments, school_absences.

create table if not exists public.competency_blocks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  kind text not null default 'skill',
  created_at timestamptz not null default now(),
  constraint competency_blocks_code_uidx unique (code),
  constraint competency_blocks_kind_chk check (kind in ('skill', 'soft'))
);

alter table public.tutor_missions
  add column if not exists competency_block_id uuid references public.competency_blocks (id) on delete set null,
  add column if not exists deliverable text,
  add column if not exists submitted_at timestamptz,
  add column if not exists validated_at timestamptz,
  add column if not exists tutor_comment text;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.tutor_missions'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.tutor_missions drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.tutor_missions
  drop constraint if exists tutor_missions_status_v2_chk;

alter table public.tutor_missions
  add constraint tutor_missions_status_v2_chk
  check (status in ('todo', 'in_progress', 'done', 'invalid', 'submitted', 'validated', 'correction_requested'));

create table if not exists public.apprenticeship_booklets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  cfa_referent_id uuid references public.profiles (id) on delete set null,
  contract_start date not null,
  contract_end date not null,
  period_length_months integer not null default 2,
  created_at timestamptz not null default now(),
  constraint apprenticeship_booklets_range_chk check (contract_end > contract_start)
);

create unique index if not exists apprenticeship_booklets_student_uidx
  on public.apprenticeship_booklets (student_id);

create table if not exists public.booklet_periods (
  id uuid primary key default gen_random_uuid(),
  booklet_id uuid not null references public.apprenticeship_booklets (id) on delete cascade,
  index integer not null,
  start_date date not null,
  end_date date not null,
  tutor_appreciation text,
  student_comment text,
  cfa_comment text,
  status text not null default 'awaiting_student',
  snapshot jsonb,
  content_hash text,
  created_at timestamptz not null default now(),
  constraint booklet_periods_status_chk check (status in ('draft', 'awaiting_student', 'awaiting_tutor', 'awaiting_cfa', 'signed')),
  constraint booklet_periods_index_uidx unique (booklet_id, index)
);

create table if not exists public.booklet_signatures (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.booklet_periods (id) on delete cascade,
  signer_role text not null,
  signer_id uuid not null references public.profiles (id) on delete cascade,
  signed_at timestamptz not null default now(),
  ip text,
  user_agent text,
  content_hash text not null,
  constraint booklet_signatures_role_chk check (signer_role in ('student', 'tutor', 'cfa')),
  constraint booklet_signatures_unique unique (period_id, signer_role)
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  booklet_period_id uuid references public.booklet_periods (id) on delete set null,
  type text not null,
  due_date date,
  status text not null default 'awaiting_student',
  general_comment text,
  self_sent_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint evaluations_type_chk check (type in ('quarterly', 'trial_period', 'final')),
  constraint evaluations_status_chk check (status in ('awaiting_student', 'to_fill', 'sent'))
);

create table if not exists public.evaluation_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id) on delete cascade,
  criterion_id uuid references public.competency_blocks (id) on delete set null,
  label text not null,
  block_code text,
  self_level integer,
  tutor_level integer,
  constraint evaluation_items_levels_chk check (
    (self_level is null or self_level between 0 and 3)
    and (tutor_level is null or tutor_level between 0 and 3)
  )
);

alter table public.competency_blocks enable row level security;
alter table public.apprenticeship_booklets enable row level security;
alter table public.booklet_periods enable row level security;
alter table public.booklet_signatures enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_items enable row level security;

drop policy if exists competency_blocks_read on public.competency_blocks;
create policy competency_blocks_read on public.competency_blocks for select using (auth.uid() is not null);

drop policy if exists booklets_party on public.apprenticeship_booklets;
create policy booklets_party on public.apprenticeship_booklets
  for all
  using (tutor_id = auth.uid() or student_id = auth.uid() or cfa_referent_id = auth.uid())
  with check (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.tutor_id = auth.uid() and a.learner_id = apprenticeship_booklets.student_id
        and a.status in ('active', 'paused')
    )
  );

drop policy if exists booklet_periods_party on public.booklet_periods;
create policy booklet_periods_party on public.booklet_periods
  for all
  using (
    exists (
      select 1 from public.apprenticeship_booklets b
      where b.id = booklet_periods.booklet_id
        and (b.tutor_id = auth.uid() or b.student_id = auth.uid() or b.cfa_referent_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.apprenticeship_booklets b
      where b.id = booklet_periods.booklet_id
        and (b.tutor_id = auth.uid() or b.student_id = auth.uid() or b.cfa_referent_id = auth.uid())
    )
  );

drop policy if exists booklet_signatures_read on public.booklet_signatures;
create policy booklet_signatures_read on public.booklet_signatures
  for select
  using (
    exists (
      select 1 from public.booklet_periods p
      join public.apprenticeship_booklets b on b.id = p.booklet_id
      where p.id = booklet_signatures.period_id
        and (b.tutor_id = auth.uid() or b.student_id = auth.uid() or b.cfa_referent_id = auth.uid())
    )
  );

drop policy if exists booklet_signatures_insert on public.booklet_signatures;
create policy booklet_signatures_insert on public.booklet_signatures
  for insert
  with check (signer_id = auth.uid());

drop policy if exists evaluations_party on public.evaluations;
create policy evaluations_party on public.evaluations
  for all
  using (tutor_id = auth.uid() or student_id = auth.uid())
  with check (
    tutor_id = auth.uid()
    and exists (
      select 1 from public.tutor_assignments a
      where a.tutor_id = auth.uid() and a.learner_id = evaluations.student_id
        and a.status in ('active', 'paused')
    )
  );

create or replace function public.block_signed_booklet_period()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'signed' then
    raise exception 'periode signee';
  end if;
  return new;
end $$;

drop trigger if exists booklet_periods_lock_signed on public.booklet_periods;
create trigger booklet_periods_lock_signed
  before update on public.booklet_periods
  for each row execute function public.block_signed_booklet_period();

create or replace function public.block_sent_evaluation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'sent' then
    raise exception 'evaluation envoyee';
  end if;
  return new;
end $$;

drop trigger if exists evaluations_lock_sent on public.evaluations;
create trigger evaluations_lock_sent
  before update on public.evaluations
  for each row execute function public.block_sent_evaluation();

drop policy if exists evaluation_items_party on public.evaluation_items;
create policy evaluation_items_party on public.evaluation_items
  for all
  using (
    exists (
      select 1 from public.evaluations e
      where e.id = evaluation_items.evaluation_id
        and (e.tutor_id = auth.uid() or e.student_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.evaluations e
      where e.id = evaluation_items.evaluation_id
        and (e.tutor_id = auth.uid() or e.student_id = auth.uid())
    )
  );

drop policy if exists evaluations_student_update on public.evaluations;
create policy evaluations_student_update on public.evaluations
  for update
  using (student_id = auth.uid() and status = 'awaiting_student')
  with check (student_id = auth.uid() and status = 'to_fill');

create or replace function public.block_sent_evaluation_item()
returns trigger
language plpgsql
as $$
declare parent_status text;
declare owner_student uuid;
declare owner_tutor uuid;
begin
  select status, student_id, tutor_id into parent_status, owner_student, owner_tutor
  from public.evaluations where id = old.evaluation_id;
  if parent_status = 'sent' then
    raise exception 'evaluation envoyee';
  end if;
  if auth.uid() = owner_student and auth.uid() is distinct from owner_tutor then
    if new.tutor_level is distinct from old.tutor_level
       or new.label is distinct from old.label
       or new.block_code is distinct from old.block_code
    then
      raise exception 'modification interdite';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists evaluation_items_lock_sent on public.evaluation_items;
create trigger evaluation_items_lock_sent
  before update on public.evaluation_items
  for each row execute function public.block_sent_evaluation_item();
