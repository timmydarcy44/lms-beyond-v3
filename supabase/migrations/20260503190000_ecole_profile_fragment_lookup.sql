-- Recherche profil par fragment d'UUID (ex. suffixe affiché APP-XXXXXXXX), réservée au service_role (API serveur).

create or replace function public.ecole_admin_find_profile_fragment(p_school_id uuid, p_fragment text)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p_school_id is not null
    and length(btrim(p_fragment)) >= 6
    and lower(replace(p.id::text, '-', '')) like '%' || lower(btrim(p_fragment)) || '%'
    and (
      p.school_id = p_school_id
      or p.school_id is null
      or exists (
        select 1
        from public.school_students ss
        where ss.student_id = p.id
          and ss.school_id = p_school_id
      )
    )
  limit 5;
$$;

revoke all on function public.ecole_admin_find_profile_fragment(uuid, text) from public;
grant execute on function public.ecole_admin_find_profile_fragment(uuid, text) to service_role;
