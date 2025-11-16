-- Fix RLS pour courses et sections
-- Ce script corrige les Row Level Security policies pour permettre aux instructors
-- de créer et modifier leurs formations et sections associées

-- ============================================
-- 1. Vérifier et corriger les RLS policies pour courses
-- ============================================
do $$
begin
  -- Supprimer les anciennes policies si elles existent
  drop policy if exists courses_instructor_all on public.courses;
  drop policy if exists courses_public_read on public.courses;
  drop policy if exists courses_owner_or_admin on public.courses;
  
  -- Policy pour permettre aux instructors de créer/modifier leurs formations
  -- Cette policy vérifie creator_id OU owner_id (pour compatibilité)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'creator_id'
  ) then
    -- Utiliser creator_id
    create policy courses_instructor_all on public.courses
      for all
      using (
        creator_id = auth.uid()
        or owner_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'instructor')
        )
      )
      with check (
        creator_id = auth.uid()
        or owner_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'instructor')
        )
      );
  else
    -- Fallback : utiliser owner_id seulement
    create policy courses_instructor_all on public.courses
      for all
      using (
        owner_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'instructor')
        )
      )
      with check (
        owner_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'instructor')
        )
      );
  end if;
  
  -- Policy pour permettre la lecture publique des formations publiées
  create policy courses_public_read on public.courses
    for select
    using (status = 'published');
    
  raise notice 'RLS policies créées pour la table courses';
end $$;

-- ============================================
-- 2. Vérifier et corriger les RLS policies pour sections (si la table existe)
-- ============================================
do $$
begin
  -- Vérifier si la table sections existe
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'sections'
  ) then
    -- Activer RLS sur sections
    alter table public.sections enable row level security;
    
    -- Supprimer les anciennes policies
    drop policy if exists sections_instructor_all on public.sections;
    drop policy if exists sections_public_read on public.sections;
    
    -- Policy pour permettre aux instructors de tout faire sur leurs sections
    -- La policy vérifie que la section appartient à un course dont l'utilisateur est propriétaire
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'sections' and column_name = 'course_id'
    ) then
      create policy sections_instructor_all on public.sections
        for all
        using (
          exists (
            select 1 from public.courses c
            where c.id = sections.course_id
              and (
                (c.creator_id = auth.uid() or c.creator_id is null)
                or (c.owner_id = auth.uid() or c.owner_id is null)
                or exists (
                  select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('admin', 'instructor')
                )
              )
          )
        )
        with check (
          exists (
            select 1 from public.courses c
            where c.id = sections.course_id
              and (
                (c.creator_id = auth.uid() or c.creator_id is null)
                or (c.owner_id = auth.uid() or c.owner_id is null)
                or exists (
                  select 1 from public.profiles p
                  where p.id = auth.uid()
                    and p.role in ('admin', 'instructor')
                )
              )
          )
        );
      
      -- Policy pour permettre la lecture publique des sections de formations publiées
      create policy sections_public_read on public.sections
        for select
        using (
          exists (
            select 1 from public.courses c
            where c.id = sections.course_id
              and c.status = 'published'
          )
        );
    else
      -- Si sections n'a pas de course_id, permettre aux instructors d'accéder
      create policy sections_instructor_all on public.sections
        for all
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'instructor')
          )
        )
        with check (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'instructor')
          )
        );
    end if;
    
    raise notice 'RLS policies créées pour la table sections';
  else
    raise notice 'La table sections n''existe pas. Rien à faire.';
  end if;
end $$;

-- ============================================
-- 3. Alternative : Désactiver temporairement RLS sur sections si nécessaire
-- ============================================
-- Si vous voulez désactiver RLS sur sections temporairement (NON RECOMMANDÉ en production) :
-- alter table public.sections disable row level security;

-- Mais la meilleure solution est de garder RLS activé et d'utiliser les policies ci-dessus




