-- =============================================================================
-- Noyau dur LMS pour nouveau projet Supabase (profiles, orgs, contenu, RLS)
-- Exécuter dans le SQL Editor (ou via migration).
-- =============================================================================

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'learner',
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now ()
);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid (),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (
    role in ('admin', 'instructor', 'learner', 'tutor')
  ),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_memberships_user_id_idx on public.org_memberships (user_id);
create index if not exists org_memberships_org_id_idx on public.org_memberships (org_id);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid (),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now (),
  unique (org_id, slug)
);

create index if not exists courses_org_id_idx on public.courses (org_id);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid (),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now ()
);

create index if not exists modules_course_id_idx on public.modules (course_id);
create index if not exists modules_course_position_idx on public.modules (course_id, position);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid (),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now ()
);

create index if not exists lessons_module_id_idx on public.lessons (module_id);
create index if not exists lessons_module_position_idx on public.lessons (module_id, position);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now (),
  primary key (user_id, course_id)
);

create index if not exists enrollments_course_id_idx on public.enrollments (course_id);

-- Premier membre : le créateur devient admin (contourne RLS via SECURITY DEFINER)
create or replace function public.handle_new_organization ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_memberships (org_id, user_id, role)
  values (new.id, auth.uid (), 'admin');
  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row
execute procedure public.handle_new_organization ();

-- -----------------------------------------------------------------------------
-- Helpers RLS (évite récursion / accès course via org ou enrollment)
-- -----------------------------------------------------------------------------

create or replace function public.is_org_member (_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = _org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_instructor_or_admin (_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_memberships m
    where m.org_id = _org_id
      and m.user_id = auth.uid()
      and m.role in ('admin', 'instructor')
  );
$$;

create or replace function public.can_access_course (_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = _course_id
      and (
        public.is_org_member (c.org_id)
        or exists (
          select 1
          from public.enrollments e
          where e.course_id = c.id
            and e.user_id = auth.uid()
        )
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;

-- profiles : lecture / mise à jour / création de sa propre ligne
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid ());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid ());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid ())
  with check (id = auth.uid ());

-- organisations : membres de l’org ; création ouverte aux comptes connectés (voir trigger ci-dessous)
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
  on public.organizations for select
  to authenticated
  using (public.is_org_member (id));

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated"
  on public.organizations for insert
  to authenticated
  with check (auth.uid () is not null);

drop policy if exists "organizations_update_staff" on public.organizations;
create policy "organizations_update_staff"
  on public.organizations for update
  to authenticated
  using (public.is_org_instructor_or_admin (id))
  with check (public.is_org_instructor_or_admin (id));

drop policy if exists "organizations_delete_admin" on public.organizations;
create policy "organizations_delete_admin"
  on public.organizations for delete
  to authenticated
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = organizations.id
        and m.user_id = auth.uid ()
        and m.role = 'admin'
    )
  );

-- org_memberships : sa ligne + les autres membres des mêmes orgs
drop policy if exists "org_memberships_select" on public.org_memberships;
create policy "org_memberships_select"
  on public.org_memberships for select
  to authenticated
  using (
    user_id = auth.uid ()
    or public.is_org_member (org_id)
  );

-- Évite l’auto-inscription arbitraire : seuls admin / instructeurs ajoutent des membres
drop policy if exists "org_memberships_insert_staff" on public.org_memberships;
create policy "org_memberships_insert_staff"
  on public.org_memberships for insert
  to authenticated
  with check (public.is_org_instructor_or_admin (org_id));

drop policy if exists "org_memberships_update_staff" on public.org_memberships;
create policy "org_memberships_update_staff"
  on public.org_memberships for update
  to authenticated
  using (public.is_org_instructor_or_admin (org_id))
  with check (public.is_org_instructor_or_admin (org_id));

drop policy if exists "org_memberships_delete_staff_or_self" on public.org_memberships;
create policy "org_memberships_delete_staff_or_self"
  on public.org_memberships for delete
  to authenticated
  using (
    user_id = auth.uid ()
    or public.is_org_instructor_or_admin (org_id)
  );

-- courses
drop policy if exists "courses_select_access" on public.courses;
create policy "courses_select_access"
  on public.courses for select
  to authenticated
  using (public.can_access_course (id));

drop policy if exists "courses_write_staff" on public.courses;
create policy "courses_write_staff"
  on public.courses for all
  to authenticated
  using (public.is_org_instructor_or_admin (org_id))
  with check (public.is_org_instructor_or_admin (org_id));

-- modules
drop policy if exists "modules_select_access" on public.modules;
create policy "modules_select_access"
  on public.modules for select
  to authenticated
  using (public.can_access_course (course_id));

drop policy if exists "modules_write_staff" on public.modules;
create policy "modules_write_staff"
  on public.modules for all
  to authenticated
  using (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  );

-- lessons
drop policy if exists "lessons_select_access" on public.lessons;
create policy "lessons_select_access"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1
      from public.modules mo
      where mo.id = module_id
        and public.can_access_course (mo.course_id)
    )
  );

drop policy if exists "lessons_write_staff" on public.lessons;
create policy "lessons_write_staff"
  on public.lessons for all
  to authenticated
  using (
    exists (
      select 1
      from public.modules mo
      join public.courses c on c.id = mo.course_id
      where mo.id = module_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  )
  with check (
    exists (
      select 1
      from public.modules mo
      join public.courses c on c.id = mo.course_id
      where mo.id = module_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  );

-- enrollments
drop policy if exists "enrollments_select_own_or_staff" on public.enrollments;
create policy "enrollments_select_own_or_staff"
  on public.enrollments for select
  to authenticated
  using (
    user_id = auth.uid ()
    or exists (
      select 1
      from public.courses c
      where c.id = course_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  );

drop policy if exists "enrollments_insert_own_or_staff" on public.enrollments;
create policy "enrollments_insert_own_or_staff"
  on public.enrollments for insert
  to authenticated
  with check (
    (user_id = auth.uid ())
    or exists (
      select 1
      from public.courses c
      where c.id = course_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  );

drop policy if exists "enrollments_delete_own_or_staff" on public.enrollments;
create policy "enrollments_delete_own_or_staff"
  on public.enrollments for delete
  to authenticated
  using (
    user_id = auth.uid ()
    or exists (
      select 1
      from public.courses c
      where c.id = course_id
        and public.is_org_instructor_or_admin (c.org_id)
    )
  );

-- -----------------------------------------------------------------------------
-- Droits (client Supabase / PostgREST)
-- -----------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.org_memberships to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, delete on public.enrollments to authenticated;

commit;

-- =============================================================================
-- Optionnel : trigger pour créer profiles à l’inscription (à activer si besoin)
-- =============================================================================
-- create or replace function public.handle_new_user ()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id, email, role, display_name)
--   values (
--     new.id,
--     new.email,
--     'learner',
--     coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
--   );
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user ();
