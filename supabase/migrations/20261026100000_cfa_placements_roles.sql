-- Fiche CFA : ville d'entreprise, tuteurs, placements, audit, compte apprenant, rôles cumulables.
-- À coller dans le SQL editor Supabase. Ne pas exécuter depuis l'application.

alter table public.cfa_companies
  add column if not exists city text,
  add column if not exists organization_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cfa_companies_organization_id_fkey'
  ) then
    alter table public.cfa_companies
      add constraint cfa_companies_organization_id_fkey
      foreign key (organization_id) references public.organizations (id) on delete set null;
  end if;
end $$;

create table if not exists public.company_tutors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cfa_companies (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  job_title text,
  invited_at timestamptz,
  last_code_sent_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists company_tutors_email_per_company
  on public.company_tutors (company_id, lower(email));

create index if not exists company_tutors_user_idx
  on public.company_tutors (user_id);

create table if not exists public.apprentice_placements (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.cfa_applications (id) on delete cascade,
  company_id uuid not null references public.cfa_companies (id) on delete restrict,
  tutor_id uuid references public.company_tutors (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists apprentice_placements_one_active
  on public.apprentice_placements (apprentice_id)
  where status = 'active';

create index if not exists apprentice_placements_tutor_idx
  on public.apprentice_placements (tutor_id);

create or replace function public.apprentice_placement_tutor_company()
returns trigger
language plpgsql
as $$
declare
  tutor_company uuid;
begin
  if new.tutor_id is null then
    return new;
  end if;
  select company_id into tutor_company
  from public.company_tutors
  where id = new.tutor_id;
  if tutor_company is null or tutor_company <> new.company_id then
    raise exception 'Le tuteur n''appartient pas à l''entreprise du placement';
  end if;
  return new;
end;
$$;

drop trigger if exists apprentice_placements_tutor_company on public.apprentice_placements;
create trigger apprentice_placements_tutor_company
  before insert or update of tutor_id, company_id
  on public.apprentice_placements
  for each row execute function public.apprentice_placement_tutor_company();

create table if not exists public.cfa_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  application_id uuid references public.cfa_applications (id) on delete cascade,
  action text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists cfa_audit_events_application_idx
  on public.cfa_audit_events (application_id, created_at desc);

alter table public.cfa_applications
  add column if not exists profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists origin text not null default 'direct';

alter table public.cfa_applications
  drop constraint if exists cfa_applications_origin_check;
alter table public.cfa_applications
  add constraint cfa_applications_origin_check check (origin in ('direct', 'existing_account'));

alter table public.cfa_applications
  drop constraint if exists cfa_applications_status_check;
alter table public.cfa_applications
  add constraint cfa_applications_status_check check (
    status in (
      'brochure',
      'profile',
      'challenge',
      'dossier',
      'interview',
      'review',
      'administrative',
      'admitted',
      'contract',
      'rejected'
    )
  );

create table if not exists public.assessment_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assessment_type text not null check (assessment_type in ('disc', 'idmc', 'soft')),
  recipient_type text not null check (recipient_type in ('organization', 'cfa')),
  recipient_id uuid not null,
  shared boolean not null default false,
  shared_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, assessment_type, recipient_type, recipient_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('entreprise', 'tuteur', 'apprenant')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

insert into public.user_roles (user_id, role)
select id,
  case
    when lower(coalesce(role, role_type, '')) in ('tutor', 'tuteur') then 'tuteur'
    when lower(coalesce(role, role_type, '')) in ('student', 'apprenant', 'learner', 'particulier') then 'apprenant'
    when lower(coalesce(role, role_type, '')) in ('entreprise', 'admin_hr', 'manager', 'rh') then 'entreprise'
    else null
  end
from public.profiles
where lower(coalesce(role, role_type, '')) in (
  'tutor', 'tuteur', 'student', 'apprenant', 'learner', 'particulier', 'entreprise', 'admin_hr', 'manager', 'rh'
)
on conflict do nothing;

alter table public.company_tutors enable row level security;
alter table public.apprentice_placements enable row level security;
alter table public.cfa_audit_events enable row level security;
alter table public.assessment_shares enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists company_tutors_self_read on public.company_tutors;
create policy company_tutors_self_read on public.company_tutors
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists apprentice_placements_tutor_read on public.apprentice_placements;
create policy apprentice_placements_tutor_read on public.apprentice_placements
  for select to authenticated
  using (
    exists (
      select 1 from public.company_tutors t
      where t.id = apprentice_placements.tutor_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());
