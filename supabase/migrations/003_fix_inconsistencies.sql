-- 003_fix_inconsistencies.sql
-- Correction des incohérences entre le code frontend et la base de données
-- À exécuter après 002_lms_tutor_builder_activity.sql
-- psql "$DATABASE_URL" -f supabase/migrations/003_fix_inconsistencies.sql

begin;

-----------------------------------------------
-- 0. Création de la fonction user_has_role si elle n'existe pas
-----------------------------------------------

create or replace function public.user_has_role(
  user_id uuid,
  roles text[]
) returns boolean
language plpgsql
security definer
stable
as $$
declare
  user_role text;
begin
  select p.role into user_role
  from public.profiles p
  where p.id = user_id;
  
  if user_role is null then
    return false;
  end if;
  
  return user_role = any(roles);
exception
  when others then
    return false;
end;
$$;

-----------------------------------------------
-- 1. Ajout des colonnes manquantes à profiles
-----------------------------------------------

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists avatar_url text;

-- Mise à jour de email depuis auth.users si possible
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'users' and table_schema = 'auth') then
    update public.profiles p
    set email = au.email
    from auth.users au
    where p.id = au.id and p.email is null;
  end if;
end $$;

-- Mise à jour de full_name depuis display_name si display_name existe et full_name est null
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'display_name'
  ) then
    update public.profiles
    set full_name = display_name
    where full_name is null and display_name is not null;
  end if;
end $$;

-----------------------------------------------
-- 2. Ajout des colonnes manquantes à courses
-----------------------------------------------

alter table public.courses
  add column if not exists cover_image text,
  add column if not exists modules_count integer default 0,
  add column if not exists duration_minutes integer,
  add column if not exists duration_label text,
  add column if not exists category text;

-----------------------------------------------
-- 3. Création des tables organizations et org_memberships
-----------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations (slug);

create table if not exists public.org_memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'learner' check (role in ('learner','instructor','admin','tutor')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_memberships_user_idx on public.org_memberships (user_id);
create index if not exists org_memberships_org_idx on public.org_memberships (org_id);

-----------------------------------------------
-- 4. Création des tables groups et group_members
-----------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  org_id uuid references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_org_idx on public.groups (org_id);
create index if not exists groups_owner_idx on public.groups (owner_id);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_group_idx on public.group_members (group_id);

-----------------------------------------------
-- 5. Création des tables Drive (si elles n'existent pas)
-----------------------------------------------

-- Enum pour assignment_target
do $$
begin
  if not exists (select 1 from pg_type where typname = 'assignment_target') then
    create type assignment_target as enum ('group', 'learner');
  end if;
end $$;

create table if not exists public.drive_consigne (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  instructions text,
  expectations text,
  due_at timestamptz,
  folder_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drive_consigne_created_by_idx on public.drive_consigne (created_by);
create index if not exists drive_consigne_org_idx on public.drive_consigne (org_id);

create table if not exists public.drive_consigne_targets (
  consigne_id uuid not null references public.drive_consigne(id) on delete cascade,
  target_type assignment_target not null,
  target_id uuid not null,
  primary key (consigne_id, target_type, target_id)
);

create index if not exists drive_consigne_targets_consigne_idx on public.drive_consigne_targets (consigne_id);

create table if not exists public.drive_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  consigne_id uuid references public.drive_consigne(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ajout de due_at si la table existe déjà
alter table public.drive_folders
  add column if not exists due_at timestamptz;

create index if not exists drive_folders_owner_idx on public.drive_folders (owner_id);
create index if not exists drive_folders_consigne_idx on public.drive_folders (consigne_id);

-- Création de drive_documents avec toutes les colonnes nécessaires
create table if not exists public.drive_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  summary text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  folder_id uuid references public.drive_folders(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','shared')),
  shared_with uuid references public.profiles(id) on delete set null,
  ai_usage_score numeric(5,2) default 0,
  ai_usage_level numeric(3,2) default 0, -- Alias pour compatibilité
  word_count integer default 0,
  file_url text,
  due_at timestamptz,
  deposited_at timestamptz,
  submitted_at timestamptz,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajout des colonnes manquantes si la table existe déjà (avec vérification)
do $$
begin
  -- Ajout de summary
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'summary'
  ) then
    alter table public.drive_documents add column summary text;
  end if;

  -- Ajout de folder_id (remplace folder_name si elle existe)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'folder_id'
  ) then
    alter table public.drive_documents add column folder_id uuid references public.drive_folders(id) on delete set null;
  end if;

  -- Note: folder_name (si elle existe) sera ignorée, on utilise folder_id

  -- Ajout de ai_usage_score
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'ai_usage_score'
  ) then
    alter table public.drive_documents add column ai_usage_score numeric(5,2) default 0;
  end if;

  -- Ajout de file_url
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'file_url'
  ) then
    alter table public.drive_documents add column file_url text;
  end if;

  -- Ajout de submitted_at
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'submitted_at'
  ) then
    alter table public.drive_documents add column submitted_at timestamptz;
  end if;

  -- Ajout de shared_with si elle n'existe pas
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'shared_with'
  ) then
    alter table public.drive_documents add column shared_with uuid references public.profiles(id) on delete set null;
  end if;
end $$;

-- Pour compatibilité: si ai_usage_level n'existe pas mais ai_usage_score oui, utiliser ai_usage_score
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'ai_usage_level'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'ai_usage_score'
  ) then
    alter table public.drive_documents add column ai_usage_level numeric(3,2) default 0;
    update public.drive_documents set ai_usage_level = ai_usage_score where ai_usage_level = 0;
  end if;
end $$;

-- Pour compatibilité: si submitted_at n'existe pas, utiliser deposited_at ou updated_at
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'deposited_at'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'submitted_at'
  ) then
    update public.drive_documents 
    set submitted_at = deposited_at 
    where submitted_at is null and deposited_at is not null;
  end if;
end $$;

-- Création des index avec vérification d'existence des colonnes
do $$
begin
  -- Index author_id
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'author_id'
  ) then
    create index if not exists drive_documents_author_idx on public.drive_documents (author_id);
  end if;

  -- Index folder_id
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'folder_id'
  ) then
    create index if not exists drive_documents_folder_idx on public.drive_documents (folder_id);
  end if;

  -- Index shared_with
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'shared_with'
  ) then
    create index if not exists drive_documents_shared_idx on public.drive_documents (shared_with);
  end if;

  -- Index status
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'drive_documents' and column_name = 'status'
  ) then
    create index if not exists drive_documents_status_idx on public.drive_documents (status);
  end if;
end $$;

-----------------------------------------------
-- 6. Vérification/Création de la table flashcards
-----------------------------------------------

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid, -- Peut être null si lié à un cours via autre mécanisme
  course_id uuid references public.courses(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flashcards_chapter_idx on public.flashcards (chapter_id);
create index if not exists flashcards_course_idx on public.flashcards (course_id);

-----------------------------------------------
-- 7. RLS Policies pour les nouvelles tables
-----------------------------------------------

alter table public.organizations enable row level security;
alter table public.org_memberships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.drive_consigne enable row level security;
alter table public.drive_consigne_targets enable row level security;
alter table public.drive_folders enable row level security;
alter table public.drive_documents enable row level security;
alter table public.flashcards enable row level security;

-- Organizations
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_read'
  ) then
    create policy organizations_read on public.organizations
      for select using (
        exists (
          select 1 from public.org_memberships om
          where om.org_id = organizations.id
            and om.user_id = auth.uid()
        )
        or public.user_has_role(auth.uid(), array['admin'])
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_admin'
  ) then
    create policy organizations_admin on public.organizations
      for all using (
        public.user_has_role(auth.uid(), array['admin'])
      ) with check (
        public.user_has_role(auth.uid(), array['admin'])
      );
  end if;
end $$;

-- Org memberships
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'org_memberships' and policyname = 'org_memberships_self'
  ) then
    create policy org_memberships_self on public.org_memberships
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'org_memberships' and policyname = 'org_memberships_admin'
  ) then
    create policy org_memberships_admin on public.org_memberships
      for all using (
        public.user_has_role(auth.uid(), array['admin'])
      ) with check (
        public.user_has_role(auth.uid(), array['admin'])
      );
  end if;
end $$;

-- Groups
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'groups' and policyname = 'groups_read'
  ) then
    create policy groups_read on public.groups
      for select using (
        exists (
          select 1 from public.group_members gm
          where gm.group_id = groups.id
            and gm.user_id = auth.uid()
        )
        or owner_id = auth.uid()
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'groups' and policyname = 'groups_write'
  ) then
    create policy groups_write on public.groups
      for all using (
        owner_id = auth.uid()
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      ) with check (
        owner_id = auth.uid()
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;
end $$;

-- Group members
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'group_members' and policyname = 'group_members_read'
  ) then
    create policy group_members_read on public.group_members
      for select using (
        exists (
          select 1 from public.groups g
          where g.id = group_members.group_id
            and (
              g.owner_id = auth.uid()
              or exists (
                select 1 from public.group_members gm2
                where gm2.group_id = g.id
                  and gm2.user_id = auth.uid()
              )
            )
        )
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'group_members' and policyname = 'group_members_write'
  ) then
    create policy group_members_write on public.group_members
      for all using (
        exists (
          select 1 from public.groups g
          where g.id = group_members.group_id
            and g.owner_id = auth.uid()
        )
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      ) with check (
        exists (
          select 1 from public.groups g
          where g.id = group_members.group_id
            and g.owner_id = auth.uid()
        )
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;
end $$;

-- Drive consigne
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'drive_consigne' and policyname = 'drive_consigne_creator'
  ) then
    create policy drive_consigne_creator on public.drive_consigne
      for all using (created_by = auth.uid())
      with check (created_by = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'drive_consigne' and policyname = 'drive_consigne_instructor'
  ) then
    create policy drive_consigne_instructor on public.drive_consigne
      for select using (
        public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;
end $$;

-- Drive documents
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'drive_documents' and policyname = 'drive_documents_author'
  ) then
    create policy drive_documents_author on public.drive_documents
      for all using (author_id = auth.uid())
      with check (author_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'drive_documents' and policyname = 'drive_documents_instructor'
  ) then
    create policy drive_documents_instructor on public.drive_documents
      for select using (
        exists (
          select 1 from public.drive_documents d
          where d.id = drive_documents.id
            and d.shared_with = auth.uid()
        )
        or public.user_has_role(auth.uid(), array['admin','instructor'])
      );
  end if;
end $$;

-- Flashcards
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_read'
  ) then
    create policy flashcards_read on public.flashcards
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_write'
  ) then
    -- Vérifier si creator_id existe dans courses avant de créer la policy
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
    ) then
      create policy flashcards_write on public.flashcards
        for all using (
          exists (
            select 1 from public.courses c
            where c.id = flashcards.course_id
              and (
                c.creator_id = auth.uid()
                or public.user_has_role(auth.uid(), array['admin','instructor'])
              )
          )
        ) with check (
          exists (
            select 1 from public.courses c
            where c.id = flashcards.course_id
              and (
                c.creator_id = auth.uid()
                or public.user_has_role(auth.uid(), array['admin','instructor'])
              )
          )
        );
    else
      -- Fallback si creator_id n'existe pas : juste vérifier le rôle
      create policy flashcards_write on public.flashcards
        for all using (
          public.user_has_role(auth.uid(), array['admin','instructor'])
        ) with check (
          public.user_has_role(auth.uid(), array['admin','instructor'])
        );
    end if;
  end if;
end $$;

commit;

