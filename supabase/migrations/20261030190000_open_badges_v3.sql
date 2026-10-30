-- Open Badges 3.0 — schéma uniquement.
-- À valider avant exécution. Ne reprend pas learnerAwards.
-- care_expert_badges continue de lire learnerAwards jusqu'à la reprise.

begin;

create table if not exists public.badge_issuers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  url text not null,
  email text not null,
  description text,
  image_url text,
  public_jwks jsonb not null default '{"keys":[]}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.badge_issuers (slug, name, url, email, description)
values (
  'byound',
  'Byound',
  'https://www.byound.fr',
  'contact@byound.fr',
  'Byound délivre des Open Badges qui attestent des compétences, sans publier les résultats des tests.'
)
on conflict (slug) do nothing;

-- issuer_id existe déjà et référence public.users. On ne le réutilise pas.
alter table public.open_badges
  add column if not exists achievement_type text not null default 'Competency',
  add column if not exists criteria_narrative text,
  add column if not exists alignments jsonb not null default '[]'::jsonb,
  add column if not exists level integer,
  add column if not exists expires_after_days integer,
  add column if not exists badge_issuer_id uuid references public.badge_issuers (id);

-- criteria existe déjà (texte). Le tableau {label, description} reste dans evaluation_config
-- tant que la colonne jsonb n'est pas là. On ajoute criteria_items pour ne pas écraser le texte.
alter table public.open_badges
  add column if not exists criteria_items jsonb not null default '[]'::jsonb;

comment on column public.open_badges.criteria_items is
  'Liste {label, description}. Le texte narratif est criteria_narrative (ou la colonne criteria historique).';

comment on column public.open_badges.alignments is
  'Alignements {targetName, targetUrl, targetFramework, targetCode}. targetFramework : ESCO, ROME ou RNCP.';

comment on column public.open_badges.expires_after_days is
  'Null = le badge n''expire pas.';

update public.open_badges ob
set badge_issuer_id = i.id
from public.badge_issuers i
where i.slug = 'byound'
  and ob.badge_issuer_id is null;

update public.open_badges
set criteria_items = case
  when jsonb_typeof(evaluation_config -> 'criteria') = 'array' then evaluation_config -> 'criteria'
  else criteria_items
end
where evaluation_config is not null;

-- level existe déjà (souvent vide). On ne le recopie que si la colonne est numérique.
do $$
declare
  level_type text;
begin
  select c.data_type into level_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'open_badges'
    and c.column_name = 'level';

  if level_type in ('smallint', 'integer', 'bigint', 'numeric') then
    update public.open_badges
    set level = nullif(evaluation_config ->> 'level', '')::integer
    where level is null
      and coalesce(evaluation_config ->> 'level', '') ~ '^[0-9]+$';
  end if;
end $$;

create table if not exists public.badge_status_lists (
  id uuid primary key default gen_random_uuid(),
  purpose text not null default 'revocation' check (purpose = 'revocation'),
  encoded_list text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.badge_status_lists (purpose, encoded_list)
select 'revocation', ''
where not exists (
  select 1 from public.badge_status_lists where purpose = 'revocation'
);

create table if not exists public.badge_assertions (
  id uuid primary key default gen_random_uuid(),
  badge_class_id uuid not null references public.open_badges (id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles (id) on delete cascade,
  recipient_name text not null,
  recipient_identity_hash text not null,
  recipient_salt text not null,
  issued_at timestamptz not null default now(),
  valid_until timestamptz,
  evidence jsonb not null default '[]'::jsonb,
  credential_jwt text,
  kid text,
  status_index integer,
  revoked_at timestamptz,
  revocation_reason text,
  is_public boolean not null default false,
  public_since timestamptz,
  created_at timestamptz not null default now(),
  constraint badge_assertions_recipient_unique unique (badge_class_id, recipient_profile_id),
  constraint badge_assertions_status_index_unique unique (status_index),
  constraint badge_assertions_revocation_reason check (
    revoked_at is null or nullif(btrim(revocation_reason), '') is not null
  )
);

create index if not exists badge_assertions_recipient_idx
  on public.badge_assertions (recipient_profile_id, issued_at desc);

create index if not exists badge_assertions_public_idx
  on public.badge_assertions (is_public, revoked_at)
  where is_public;

comment on column public.badge_assertions.evidence is
  'Tableau {id, name, description, genre, narrative, url, validated_by, date, public}. public=false par défaut.';

create or replace function public.badge_can_issue()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
  or exists (
    select 1
    from public.experts e
    where e.id = auth.uid()
      and coalesce(e.is_active, true)
  );
$$;

revoke all on function public.badge_can_issue() from public, anon;
grant execute on function public.badge_can_issue() to authenticated;

create or replace function public.badge_assertions_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Le service role n'a pas d'auth.uid() et doit pouvoir signer le credential.
  if auth.uid() is null then
    return new;
  end if;

  if public.badge_can_issue() then
    return new;
  end if;

  if auth.uid() is distinct from old.recipient_profile_id then
    raise exception 'badge_assertions: modification refusée' using errcode = '42501';
  end if;

  if new.id is distinct from old.id
    or new.badge_class_id is distinct from old.badge_class_id
    or new.recipient_profile_id is distinct from old.recipient_profile_id
    or new.recipient_name is distinct from old.recipient_name
    or new.recipient_identity_hash is distinct from old.recipient_identity_hash
    or new.recipient_salt is distinct from old.recipient_salt
    or new.issued_at is distinct from old.issued_at
    or new.valid_until is distinct from old.valid_until
    or new.evidence is distinct from old.evidence
    or new.credential_jwt is distinct from old.credential_jwt
    or new.kid is distinct from old.kid
    or new.status_index is distinct from old.status_index
    or new.revoked_at is distinct from old.revoked_at
    or new.revocation_reason is distinct from old.revocation_reason
    or new.created_at is distinct from old.created_at
  then
    raise exception 'badge_assertions: le titulaire ne peut modifier que is_public'
      using errcode = '42501';
  end if;

  if new.is_public and old.is_public is not true then
    new.public_since := now();
  elsif new.is_public is not true then
    new.public_since := null;
  end if;

  return new;
end;
$$;

drop trigger if exists badge_assertions_guard_update on public.badge_assertions;
create trigger badge_assertions_guard_update
  before update on public.badge_assertions
  for each row execute function public.badge_assertions_guard_update();

alter table public.badge_issuers enable row level security;
alter table public.badge_assertions enable row level security;
alter table public.badge_status_lists enable row level security;

drop policy if exists badge_issuers_public_read on public.badge_issuers;
create policy badge_issuers_public_read
  on public.badge_issuers
  for select
  to anon, authenticated
  using (true);

drop policy if exists badge_assertions_holder_read on public.badge_assertions;
create policy badge_assertions_holder_read
  on public.badge_assertions
  for select
  to authenticated
  using (recipient_profile_id = auth.uid() or public.badge_can_issue());

drop policy if exists badge_assertions_holder_publish on public.badge_assertions;
create policy badge_assertions_holder_publish
  on public.badge_assertions
  for update
  to authenticated
  using (recipient_profile_id = auth.uid() or public.badge_can_issue())
  with check (recipient_profile_id = auth.uid() or public.badge_can_issue());

drop policy if exists badge_assertions_issue on public.badge_assertions;
create policy badge_assertions_issue
  on public.badge_assertions
  for insert
  to authenticated
  with check (public.badge_can_issue());

drop policy if exists badge_status_lists_admin on public.badge_status_lists;
create policy badge_status_lists_admin
  on public.badge_status_lists
  for all
  to authenticated
  using (public.badge_can_issue())
  with check (public.badge_can_issue());

-- Champs publics seulement. Les badges révoqués n'y figurent pas.
create or replace view public.badge_assertions_public
with (security_invoker = false) as
select
  a.id,
  a.badge_class_id,
  a.recipient_name,
  a.issued_at,
  a.valid_until,
  a.credential_jwt,
  a.kid,
  a.public_since,
  coalesce((
    select jsonb_agg(item)
    from jsonb_array_elements(coalesce(a.evidence, '[]'::jsonb)) as item
    where coalesce(item ->> 'public', 'false') = 'true'
  ), '[]'::jsonb) as evidence
from public.badge_assertions a
where a.is_public
  and a.revoked_at is null;

revoke all on public.badge_assertions_public from public;
grant select on public.badge_assertions_public to anon, authenticated;

revoke all on public.badge_assertions from anon;
grant select, update on public.badge_assertions to authenticated;
grant insert on public.badge_assertions to authenticated;

revoke all on public.badge_status_lists from anon, public;
grant select, insert, update on public.badge_status_lists to authenticated;

grant select on public.badge_issuers to anon, authenticated;

commit;
