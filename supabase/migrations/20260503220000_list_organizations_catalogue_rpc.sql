-- Liste catalogue organisations pour super-admins LMS sans dépendre de la clé service côté Next.
-- Aligné avec src/lib/auth/super-admin-email-allowlist.ts (emails built-in + table super_admins).

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
    ))) = any (array['timmydarcy44@gmail.com']::text[])
  )
  order by o.name asc
  limit 500;
$$;

revoke all on function public.list_organizations_catalogue_for_lms_admin() from public;
grant execute on function public.list_organizations_catalogue_for_lms_admin() to authenticated;

comment on function public.list_organizations_catalogue_for_lms_admin() is
  'Retourne toutes les organisations (galaxies) si l’utilisateur est super_admin actif ou e-mail allowlist LMS (voir super-admin-email-allowlist.ts).';
