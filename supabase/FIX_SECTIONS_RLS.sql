-- Fix RLS pour la table sections
-- Cette migration corrige les Row Level Security policies pour permettre aux instructors
-- de créer et modifier des sections associées à leurs formations

-- 1. Vérifier si la table sections existe et activer RLS si nécessaire
do $$
begin
  -- Vérifier si la table sections existe
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'sections'
  ) then
    -- Activer RLS sur sections
    alter table public.sections enable row level security;
    
    -- Supprimer les anciennes policies s'il en existe
    drop policy if exists sections_instructor_all on public.sections;
    drop policy if exists sections_public_read on public.sections;
    
    -- Policy pour permettre aux instructors de tout faire sur leurs sections
    create policy sections_instructor_all on public.sections
      for all
      using (
        exists (
          select 1 from public.courses c
          where c.id = sections.course_id
            and (
              c.creator_id = auth.uid()
              or c.owner_id = auth.uid()
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
              c.creator_id = auth.uid()
              or c.owner_id = auth.uid()
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
    
    raise notice 'RLS policies créées pour la table sections';
  else
    raise notice 'La table sections n''existe pas. Rien à faire.';
  end if;
end $$;

-- 2. Si sections n'existe pas mais qu'elle est référencée, on peut créer une vue ou ignorer
-- Pour l'instant, on laisse comme ça et on verra si le problème persiste




