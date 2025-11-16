-- ============================================
-- Migration adaptée à la structure existante
-- Cette migration ajoute uniquement les colonnes MANQUANTES
-- sans modifier ce qui existe déjà
-- ============================================
-- Note: Exécutez ce script dans Supabase Studio SQL Editor

-- ============================================
-- 1. PROFILES : Ajouter les colonnes manquantes
-- ============================================
do $$
begin
  -- Ajouter email si elle n'existe pas
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) then
    alter table public.profiles add column email text;
    
    -- Remplir depuis auth.users si possible
    update public.profiles p
    set email = au.email
    from auth.users au
    where p.id = au.id and p.email is null;
  end if;
  
  -- Ajouter display_name si elle n'existe pas
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) then
    alter table public.profiles add column display_name text;
  end if;
  
  -- Ajouter full_name
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles add column full_name text;
    
    -- Copier depuis display_name si elle existe maintenant
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
    ) then
      update public.profiles
      set full_name = display_name
      where full_name is null and display_name is not null;
    end if;
  end if;
  
  -- Ajouter first_name
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name'
  ) then
    alter table public.profiles add column first_name text;
  end if;
  
  -- Ajouter last_name
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'last_name'
  ) then
    alter table public.profiles add column last_name text;
  end if;
  
  -- Ajouter phone
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) then
    alter table public.profiles add column phone text;
  end if;
  
  -- Ajouter avatar_url
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;
  
  -- S'assurer que role existe (avec les bonnes valeurs)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles add column role text;
    
    -- Ajouter la contrainte si elle n'existe pas
    if not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public' 
        and table_name = 'profiles' 
        and constraint_name like '%role%check%'
    ) then
      alter table public.profiles add constraint profiles_role_check
        check (role in ('student','instructor','admin','tutor'));
    end if;
  end if;
end $$;

-- ============================================
-- 2. COURSES : Ajouter creator_id si nécessaire
-- (Votre structure utilise owner_id, on peut créer un alias ou utiliser owner_id)
-- Le frontend attend creator_id, donc on peut créer une vue ou ajouter la colonne
-- ============================================
do $$
begin
  -- Ajouter creator_id si elle n'existe pas (on la synchronisera avec owner_id)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
  ) then
    alter table public.courses add column creator_id uuid;
    
    -- Synchroniser avec owner_id existant
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'courses' and column_name = 'owner_id'
    ) then
      update public.courses set creator_id = owner_id where creator_id is null;
    end if;
  end if;
  
  -- Ajouter slug si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'slug'
  ) then
    alter table public.courses add column slug text;
    
    -- Générer des slugs à partir des IDs si pas de slug
    update public.courses
    set slug = 'course-' || substr(id::text, 1, 8)
    where slug is null or slug = '';
  end if;
  
  -- Ajouter status si nécessaire (pour published/draft)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'status'
  ) then
    alter table public.courses add column status text not null default 'draft';
    
    -- Synchroniser avec published si elle existe
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'courses' and column_name = 'published'
    ) then
      update public.courses 
      set status = case when published then 'published' else 'draft' end
      where status = 'draft';
    end if;
  end if;
  
  -- Ajouter builder_snapshot si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'builder_snapshot'
  ) then
    alter table public.courses add column builder_snapshot jsonb;
  end if;
end $$;

-- Index sur creator_id si la colonne existe
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
  ) then
    create index if not exists courses_creator_idx on public.courses (creator_id);
  end if;
end $$;

-- ============================================
-- 3. PATHS : Ajouter creator_id (sync avec owner_id)
-- ============================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'creator_id'
  ) then
    alter table public.paths add column creator_id uuid;
    
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'paths' and column_name = 'owner_id'
    ) then
      update public.paths set creator_id = owner_id where creator_id is null;
    end if;
  end if;
  
  -- Ajouter slug si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'slug'
  ) then
    alter table public.paths add column slug text;
  end if;
  
  -- Ajouter status si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'status'
  ) then
    alter table public.paths add column status text not null default 'draft';
  end if;
  
  -- Ajouter thumbnail_url et hero_url si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'thumbnail_url'
  ) then
    alter table public.paths add column thumbnail_url text;
  end if;
  
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'hero_url'
  ) then
    alter table public.paths add column hero_url text;
  end if;
  
  -- Ajouter builder_snapshot si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'builder_snapshot'
  ) then
    alter table public.paths add column builder_snapshot jsonb;
  end if;
end $$;

-- Index sur creator_id pour paths
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'paths' and column_name = 'creator_id'
  ) then
    create index if not exists paths_creator_idx on public.paths (creator_id);
  end if;
end $$;

-- ============================================
-- 4. RESOURCES : Ne rien faire - la structure existe déjà avec "kind"
-- Le frontend doit utiliser "kind" au lieu de "type" ou "resource_type"
-- ============================================
-- Pas de modifications nécessaires - resources utilise déjà "kind"

-- ============================================
-- 5. TESTS : Ajouter slug et status si nécessaire
-- ============================================
do $$
begin
  -- Ajouter slug
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'slug'
  ) then
    alter table public.tests add column slug text;
  end if;
  
  -- Ajouter status (sync avec published)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'status'
  ) then
    alter table public.tests add column status text not null default 'draft';
    
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tests' and column_name = 'published'
    ) then
      update public.tests 
      set status = case when published then 'published' else 'draft' end
      where status = 'draft';
    end if;
  end if;
  
  -- Ajouter kind si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'kind'
  ) then
    alter table public.tests add column kind text not null default 'quiz';
  end if;
  
  -- Ajouter duration_minutes si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'duration_minutes'
  ) then
    alter table public.tests add column duration_minutes integer;
  end if;
  
  -- Ajouter builder_snapshot si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'builder_snapshot'
  ) then
    alter table public.tests add column builder_snapshot jsonb;
  end if;
end $$;

-- ============================================
-- 6. ENROLLMENTS : Ajouter user_id (alias de learner_id)
-- ============================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enrollments' and column_name = 'user_id'
  ) then
    -- Ajouter user_id
    alter table public.enrollments add column user_id uuid;
    
    -- Synchroniser avec learner_id
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'enrollments' and column_name = 'learner_id'
    ) then
      update public.enrollments set user_id = learner_id where user_id is null;
    end if;
  end if;
  
  -- Ajouter role si nécessaire
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enrollments' and column_name = 'role'
  ) then
    alter table public.enrollments add column role text not null default 'student';
  end if;
end $$;

-- ============================================
-- 7. Créer les tables de liaison manquantes si nécessaire
-- ============================================

-- path_courses
create table if not exists public.path_courses (
  path_id uuid not null references public.paths(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, course_id)
);

-- path_resources
create table if not exists public.path_resources (
  path_id uuid not null references public.paths(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, resource_id)
);

-- path_tests
create table if not exists public.path_tests (
  path_id uuid not null references public.paths(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete cascade,
  "order" integer not null default 0,
  primary key (path_id, test_id)
);

-- ============================================
-- 8. Autres tables nécessaires
-- ============================================

-- instructors (si nécessaire)
create table if not exists public.instructors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  created_at timestamptz not null default now()
);

-- path_progress (si nécessaire)
create table if not exists public.path_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.paths(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  last_accessed_at timestamptz default now(),
  primary key (user_id, path_id)
);

-- resource_views (si nécessaire)
create table if not exists public.resource_views (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  primary key (user_id, resource_id)
);

-- test_attempts (si nécessaire - vous avez peut-être test_submissions déjà)
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

-- login_events (vous avez student_logins - on peut créer login_events comme alias)
create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  ua text,
  ip inet
);

-- user_badges (vous avez learner_badges - on peut créer user_badges comme alias)
create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ============================================
-- 9. Créer la fonction de synchronisation creator_id / owner_id
-- ============================================
-- Fonction pour synchroniser creator_id avec owner_id
create or replace function sync_courses_creator_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is not null then
    new.creator_id := new.owner_id;
  end if;
  return new;
end;
$$;

-- Créer le trigger si creator_id existe
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' 
    and column_name in ('creator_id', 'owner_id')
  ) then
    drop trigger if exists sync_courses_creator on public.courses;
    execute 'create trigger sync_courses_creator
      before insert or update of owner_id on public.courses
      for each row
      execute function sync_courses_creator_owner()';
  end if;
end $$;

-- Migration terminée avec succès !

