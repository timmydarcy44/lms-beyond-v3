-- Fiche formation : champs absents, suppression logique, historique.
-- Les chapitres et sous-chapitres restent dans courses.builder_snapshot
-- (clé deleted_at sur chaque nœud). Il n'existe pas de table chapters.
-- Collez ce script dans Supabase.

alter table public.courses add column if not exists delivery_format text;
alter table public.courses add column if not exists competencies text[] not null default '{}';
alter table public.courses add column if not exists audiences text[] not null default '{}';
alter table public.courses add column if not exists evaluation_modalities text;
alter table public.courses add column if not exists accessibility text;
alter table public.courses add column if not exists access_delay text;
alter table public.courses add column if not exists cover_alt text;

alter table public.modules add column if not exists deleted_at timestamptz;
alter table public.lessons add column if not exists deleted_at timestamptz;

create index if not exists modules_not_deleted_idx on public.modules (course_id) where deleted_at is null;
create index if not exists lessons_not_deleted_idx on public.lessons (module_id) where deleted_at is null;

create table if not exists public.formation_versions (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.courses (id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists formation_versions_formation_idx
  on public.formation_versions (formation_id, created_at desc);

alter table public.formation_versions enable row level security;

drop policy if exists formation_versions_rw on public.formation_versions;
create policy formation_versions_rw on public.formation_versions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.courses c
      where c.id = formation_versions.formation_id
        and (
          c.creator_id = auth.uid()
          or c.owner_id = auth.uid()
          or c.org_id in (
            select m.org_id from public.org_memberships m where m.user_id = auth.uid()
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.id = formation_versions.formation_id
        and (
          c.creator_id = auth.uid()
          or c.owner_id = auth.uid()
          or c.org_id in (
            select m.org_id from public.org_memberships m where m.user_id = auth.uid()
          )
        )
    )
  );
