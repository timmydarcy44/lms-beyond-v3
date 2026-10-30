-- Demandes d'inscription entreprise. Accès service role uniquement.
-- À coller dans le SQL editor Supabase.

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  company text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified_at timestamptz,
  locked_until timestamptz,
  last_sent_at timestamptz,
  sent_at timestamptz[] not null default '{}',
  otp_type text not null default 'magiclink',
  mode text not null default 'signup' check (mode in ('signup', 'login')),
  user_id uuid
);

create index if not exists signup_requests_email_open_idx
  on public.signup_requests (email, created_at desc)
  where verified_at is null;

alter table public.signup_requests enable row level security;

revoke all on table public.signup_requests from anon, authenticated;
grant select, insert, update, delete on table public.signup_requests to service_role;

create or replace function public.purge_signup_requests()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.signup_requests
  where verified_at is null
    and created_at < now() - interval '7 days';
$$;

create or replace function public.entreprise_login_hint(p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  pwd text;
begin
  select encrypted_password into pwd
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if not found then
    return 'unknown';
  end if;
  if pwd is null or pwd = '' then
    return 'otp';
  end if;
  return 'password';
end;
$$;

create or replace function public.complete_entreprise_signup(
  p_request_id uuid,
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_company text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_mode text;
  v_verified timestamptz;
  v_full text;
begin
  select mode, verified_at into v_mode, v_verified
  from public.signup_requests
  where id = p_request_id
  for update;

  if v_verified is not null then
    select company_id into v_org from public.profiles where id = p_user_id;
    return v_org;
  end if;

  select company_id into v_org from public.profiles where id = p_user_id;
  if v_mode = 'login' or v_org is not null then
    update public.signup_requests set verified_at = now() where id = p_request_id;
    return v_org;
  end if;

  v_full := trim(both from concat_ws(' ', nullif(trim(p_first_name), ''), nullif(trim(p_last_name), '')));

  insert into public.organizations (name, slug, onboarding_step)
  values (coalesce(nullif(trim(p_company), ''), 'Mon entreprise'), p_slug, 'account_activated')
  returning id into v_org;

  insert into public.profiles (id, email, first_name, last_name, full_name, role, role_type, company_id)
  values (p_user_id, lower(trim(p_email)), trim(p_first_name), trim(p_last_name), v_full, 'entreprise', 'entreprise', v_org)
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    role = 'entreprise',
    role_type = 'entreprise',
    company_id = coalesce(public.profiles.company_id, excluded.company_id);

  insert into public.org_memberships (org_id, user_id, role)
  select v_org, p_user_id, 'admin'
  where not exists (
    select 1 from public.org_memberships
    where org_id = v_org and user_id = p_user_id
  );

  update public.organizations set edge_profile_completed = false where id = v_org;
  update public.signup_requests set verified_at = now() where id = p_request_id;
  return v_org;
end;
$$;

revoke all on function public.purge_signup_requests() from public, anon, authenticated;
revoke all on function public.entreprise_login_hint(text) from public, anon, authenticated;
revoke all on function public.complete_entreprise_signup(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;

grant execute on function public.purge_signup_requests() to service_role;
grant execute on function public.entreprise_login_hint(text) to service_role;
grant execute on function public.complete_entreprise_signup(uuid, uuid, text, text, text, text, text) to service_role;
