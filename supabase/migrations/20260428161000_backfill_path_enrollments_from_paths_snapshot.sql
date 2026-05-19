-- Backfill path_enrollments from paths.path_snapshot.assignment.learnerIds
-- Utile quand la table path_enrollments a été ajoutée après des assignations existantes.

begin;

-- Sécurité: ne rien faire si la table n'existe pas
do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'path_enrollments'
  ) then
    raise notice 'public.path_enrollments does not exist, skip backfill.';
    return;
  end if;
end $$;

insert into public.path_enrollments (user_id, path_id)
select distinct
  (jsonb_array_elements_text(coalesce(p.path_snapshot->'assignment'->'learnerIds', '[]'::jsonb)))::uuid as user_id,
  p.id as path_id
from public.paths p
where p.path_snapshot is not null
on conflict (user_id, path_id) do nothing;

commit;

