-- Admin basics schema & RLS policies - VERSION ULTRA-SIMPLIFIÉE
-- Cette version évite tous les conflits avec les colonnes existantes
-- Usage: Exécuter dans Supabase Studio SQL Editor

begin;

create extension if not exists pgcrypto;

-- Table profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','instructor','admin','tutor')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Table courses (sans creator_id d'abord, on l'ajoutera après)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published')),
  builder_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajouter creator_id si elle n'existe pas
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
  ) then
    alter table public.courses add column creator_id uuid references public.profiles(id) on delete cascade;
  end if;
end $$;

create index if not exists courses_creator_idx on public.courses (creator_id);

-- Table paths
create table if not exists public.paths (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published')),
  thumbnail_url text,
  hero_url text,
  builder_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajouter creator_id si elle n'existe pas
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'creator_id'
  ) then
    alter table public.paths add column creator_id uuid references public.profiles(id) on delete set null;
  end if;
end $$;

create index if not exists paths_creator_idx on public.paths (creator_id);

create table if not exists public.path_courses (
  path_id uuid not null references public.paths(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, course_id)
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  role text not null default 'student' check (role in ('student','instructor_assistant')),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists enrollments_course_idx on public.enrollments (course_id);

create table if not exists public.instructors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  created_at timestamptz not null default now()
);

-- Gérer la table resources en tenant compte de l'existence potentielle
do $$
begin
  -- Si la table n'existe pas, on la crée avec resource_type
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'resources'
  ) then
    create table public.resources (
      id uuid primary key default gen_random_uuid(),
      slug text unique not null,
      title text not null,
      description text,
      resource_type text not null default 'guide' check (resource_type in ('guide','fiche','audio','video','autre')),
      status text not null default 'draft' check (status in ('draft','published')),
      media_url text,
      download_url text,
      thumbnail_url text,
      created_by uuid references public.profiles(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  else
    -- Si la table existe déjà, vérifier et renommer la colonne type si nécessaire
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'type'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'resource_type'
    ) then
      alter table public.resources rename column "type" to resource_type;
    end if;
    
    -- Ajouter resource_type si elle n'existe pas (ni type ni resource_type)
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' 
        and column_name in ('type', 'resource_type')
    ) then
      alter table public.resources add column resource_type text not null default 'guide';
      alter table public.resources add constraint resources_resource_type_check 
        check (resource_type in ('guide','fiche','audio','video','autre'));
    end if;
    
    -- Ajouter les autres colonnes si elles n'existent pas
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'slug'
    ) then
      alter table public.resources add column slug text unique;
    end if;
    
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'title'
    ) then
      alter table public.resources add column title text;
    end if;
    
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'description'
    ) then
      alter table public.resources add column description text;
    end if;
    
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'resources' and column_name = 'status'
    ) then
      alter table public.resources add column status text not null default 'draft';
    end if;
  end if;
end $$;

-- Créer les index - utiliser le bon nom de colonne
do $$
begin
  -- Déterminer quel nom de colonne utiliser
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'resource_type'
  ) then
    create index if not exists resources_type_idx on public.resources (resource_type);
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'type'
  ) then
    create index if not exists resources_type_idx on public.resources (type);
  end if;
  
  create index if not exists resources_status_idx on public.resources (status);
end $$;

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published')),
  kind text not null default 'quiz',
  duration_minutes integer,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tests_status_idx on public.tests (status);

create table if not exists public.path_resources (
  path_id uuid not null references public.paths(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, resource_id)
);

create table if not exists public.path_tests (
  path_id uuid not null references public.paths(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, test_id)
);

create table if not exists public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_accessed_at timestamptz default now(),
  primary key (user_id, course_id)
);

create table if not exists public.path_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.paths(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_accessed_at timestamptz default now(),
  primary key (user_id, path_id)
);

create table if not exists public.resource_views (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  primary key (user_id, resource_id)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  score numeric(5,2),
  status text not null default 'in_progress' check (status in ('in_progress','passed','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint test_attempts_user_unique unique (user_id, test_id, started_at)
);

create index if not exists test_attempts_user_idx on public.test_attempts (user_id, test_id);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  description text
);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  ua text,
  ip inet
);

create index if not exists login_events_user_idx on public.login_events (user_id, at desc);

-- Vue admin_activity_view - ON LA CRÉE PLUS TARD POUR ÉVITER LES CONFLITS
-- Cette vue sera créée dans une migration ultérieure une fois que tout est stable
-- On la commente pour l'instant pour éviter les erreurs
/*
drop view if exists public.admin_activity_view;

create or replace view public.admin_activity_view as
select 
  le.id,
  'login'::text as activity_type,
  concat(coalesce(p.display_name, 'Utilisateur'), ' s''est connecté') as title,
  le.ua as subtitle,
  le.at as created_at
from public.login_events le
left join public.profiles p on p.id = le.user_id;
*/

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.paths enable row level security;
alter table public.path_courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.instructors enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.login_events enable row level security;
alter table public.resources enable row level security;
alter table public.tests enable row level security;
alter table public.path_resources enable row level security;
alter table public.path_tests enable row level security;
alter table public.course_progress enable row level security;
alter table public.path_progress enable row level security;
alter table public.resource_views enable row level security;
alter table public.test_attempts enable row level security;

-- RLS Policies
do $$
begin
  -- Profiles
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
  ) then
    create policy profiles_self_read on public.profiles for select
      using (auth.uid() = id or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
    create policy profiles_self_update on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
    create policy profiles_admin_all on public.profiles for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- Courses
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'courses'
  ) then
    create policy courses_public_published on public.courses for select using (status = 'published');
    -- Policy conditionnelle selon l'existence de creator_id
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
    ) then
      create policy courses_owner_or_admin on public.courses for all
        using (creator_id = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'))
        with check (creator_id = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
    else
      create policy courses_admin_only on public.courses for all
        using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'))
        with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
    end if;
  end if;

  -- Paths
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'paths'
  ) then
    create policy paths_public_read on public.paths for select using (true);
    create policy paths_admin_write on public.paths for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Path courses
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_courses'
  ) then
    create policy path_courses_admin_write on public.path_courses for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Resources
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resources'
  ) then
    create policy resources_public_published on public.resources for select using (status = 'published');
    create policy resources_owner_write on public.resources for all
      using (created_by = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (created_by = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Tests
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tests'
  ) then
    create policy tests_public_published on public.tests for select using (status = 'published');
    create policy tests_owner_write on public.tests for all
      using (created_by = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (created_by = auth.uid() or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Path resources
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_resources'
  ) then
    create policy path_resources_admin_write on public.path_resources for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Path tests
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_tests'
  ) then
    create policy path_tests_admin_write on public.path_tests for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Enrollments
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'enrollments'
  ) then
    create policy enrollments_self on public.enrollments for select using (auth.uid() = user_id);
    create policy enrollments_admin on public.enrollments for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- User badges
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_badges'
  ) then
    create policy user_badges_self on public.user_badges for select using (auth.uid() = user_id);
    create policy user_badges_admin on public.user_badges for all
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'))
      with check (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- Course progress
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'course_progress'
  ) then
    create policy course_progress_self on public.course_progress for select using (auth.uid() = user_id);
    create policy course_progress_self_upsert on public.course_progress for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    create policy course_progress_admin on public.course_progress for select
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- Path progress
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'path_progress'
  ) then
    create policy path_progress_self on public.path_progress for select using (auth.uid() = user_id);
    create policy path_progress_self_upsert on public.path_progress for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    create policy path_progress_admin on public.path_progress for select
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- Resource views
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_views'
  ) then
    create policy resource_views_self on public.resource_views for select using (auth.uid() = user_id);
    create policy resource_views_self_upsert on public.resource_views for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    create policy resource_views_admin on public.resource_views for select
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;

  -- Test attempts
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'test_attempts'
  ) then
    create policy test_attempts_self_read on public.test_attempts for select using (auth.uid() = user_id);
    create policy test_attempts_self_insert on public.test_attempts for insert with check (auth.uid() = user_id);
    create policy test_attempts_admin on public.test_attempts for select
      using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role in ('admin','instructor')));
  end if;

  -- Login events
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'login_events'
  ) then
    create policy login_events_self on public.login_events for select using (auth.uid() = user_id);
    create policy login_events_admin on public.login_events for select using (exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin'));
  end if;
end $$;

commit;

