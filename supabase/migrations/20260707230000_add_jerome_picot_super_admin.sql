-- Ajoute jerome.picot@edgebs.fr aux super-admins LMS (accès /super).
-- Aligné avec src/lib/auth/super-admin-email-allowlist.ts.

-- 1. RPC catalogue galaxies : ajouter l'e-mail à l'allowlist embarquée.
create or replace function public.list_organizations_catalogue_for_lms_admin()
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.name, o.slug
  from public.organizations o
  where (
    exists (
      select 1
      from public.super_admins sa
      where sa.user_id = auth.uid()
        and coalesce(sa.is_active, true) = true
    )
    or lower(trim(coalesce(
      (select u.email::text from auth.users u where u.id = auth.uid() limit 1),
      (select p.email::text from public.profiles p where p.id = auth.uid() limit 1),
      ''
    ))) = any (array['timmydarcy44@gmail.com', 'jerome.picot@edgebs.fr']::text[])
  )
  order by o.name asc
  limit 500;
$$;

revoke all on function public.list_organizations_catalogue_for_lms_admin() from public;
grant execute on function public.list_organizations_catalogue_for_lms_admin() to authenticated;

-- 2. Table super_admins : inscrire le collaborateur s'il possède déjà un profil.
--    (super_admins.user_id référence public.profiles(id).)
insert into public.super_admins (user_id, is_active)
select p.id, true
from public.profiles p
where lower(p.email) = 'jerome.picot@edgebs.fr'
on conflict (user_id) do update set is_active = true, updated_at = now();
