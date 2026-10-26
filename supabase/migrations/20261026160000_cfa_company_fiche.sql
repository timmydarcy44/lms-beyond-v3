-- Fiche entreprise CFA. Les colonnes historiques de cfa_companies restent en place.
-- Rejouable : les ajouts sont conditionnels. Pas de copie nationale SIRO.
begin;

alter table public.cfa_companies
  add column if not exists trade_name text,
  add column if not exists address_line text,
  add column if not exists postal_code text,
  add column if not exists naf_code text,
  add column if not exists naf_label text,
  add column if not exists headcount_range text,
  add column if not exists idcc text,
  add column if not exists idcc_label text,
  add column if not exists opco text,
  add column if not exists opco_source text,
  add column if not exists opco_checked_at timestamptz,
  add column if not exists structure_type text,
  add column if not exists registry_synced_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists lost_at timestamptz;

alter table public.cfa_companies drop constraint if exists cfa_companies_structure_type_check;
alter table public.cfa_companies
  add constraint cfa_companies_structure_type_check check (
    structure_type is null or structure_type in ('independent', 'franchise', 'group', 'association', 'public')
  );

update public.cfa_companies
set structure_type = case lower(trim(contact_role))
  when 'indépendant' then 'independent'
  when 'independant' then 'independent'
  when 'franchisé' then 'franchise'
  when 'franchise' then 'franchise'
  when 'groupe / réseau' then 'group'
  when 'groupe / reseau' then 'group'
  when 'groupe' then 'group'
  when 'association' then 'association'
  when 'employeur public' then 'public'
  else structure_type
end
where structure_type is null and contact_role is not null;

update public.cfa_companies
set
  postal_code = substring(company_address from '([0-9]{5})'),
  address_line = nullif(btrim(regexp_replace(company_address, '[0-9]{5}.*$', '')), ''),
  city = coalesce(
    nullif(btrim(city), ''),
    nullif(btrim(substring(company_address from '[0-9]{5}[[:space:]]+(.+)$')), '')
  )
where address_line is null
  and company_address ~ '[0-9]{5}';

create table if not exists public.cfa_company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cfa_companies (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  job_title text,
  email text,
  phone text,
  roles text[] not null default array['other']::text[],
  created_at timestamptz not null default now(),
  constraint cfa_company_contacts_roles_check check (
    roles <@ array['main', 'signatory', 'hr', 'other']::text[] and cardinality(roles) > 0
  )
);

create unique index if not exists cfa_company_contacts_one_main
  on public.cfa_company_contacts (company_id)
  where 'main' = any (roles);

create unique index if not exists cfa_company_contacts_one_signatory
  on public.cfa_company_contacts (company_id)
  where 'signatory' = any (roles);

insert into public.cfa_company_contacts (company_id, first_name, last_name, job_title, email, phone, roles)
select
  c.id,
  coalesce(nullif(btrim(c.contact_first_name), ''), nullif(split_part(btrim(coalesce(c.contact_name, '')), ' ', 1), ''), 'Contact'),
  coalesce(
    nullif(btrim(c.contact_last_name), ''),
    nullif(btrim(regexp_replace(btrim(coalesce(c.contact_name, '')), '^\S+[[:space:]]*', '')), ''),
    coalesce(nullif(btrim(c.contact_first_name), ''), nullif(split_part(btrim(coalesce(c.contact_name, '')), ' ', 1), ''), 'Contact')
  ),
  nullif(btrim(c.contact_role), ''),
  nullif(btrim(c.email), ''),
  nullif(btrim(c.phone), ''),
  array['main']::text[]
from public.cfa_companies c
where not exists (select 1 from public.cfa_company_contacts k where k.company_id = c.id)
  and (
    coalesce(btrim(c.contact_first_name), '') <> ''
    or coalesce(btrim(c.contact_last_name), '') <> ''
    or coalesce(btrim(c.contact_name), '') <> ''
    or coalesce(btrim(c.email), '') <> ''
    or coalesce(btrim(c.phone), '') <> ''
  );

create table if not exists public.cfa_company_needs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cfa_companies (id) on delete cascade,
  title text not null,
  cursus_id text,
  quantity integer not null default 1 check (quantity between 1 and 30),
  start_date text,
  location text,
  soft_skill_ids text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  created_at timestamptz not null default now(),
  constraint cfa_company_needs_skills_max check (cardinality(soft_skill_ids) <= 5)
);

insert into public.cfa_company_needs (company_id, title, cursus_id, quantity, location, soft_skill_ids, status)
select
  c.id,
  coalesce(labels.label, c.apprentice_track_1),
  c.apprentice_track_1,
  coalesce(c.apprentices_wanted, 1),
  nullif(btrim(c.city), ''),
  coalesce((
    select array_agg(skill.id order by skill.id)
    from (
      select map.id
      from unnest(string_to_array(coalesce(c.soft_skills, ''), '·')) as raw(label)
      join (
        values
          ('1', 'Communication interpersonnelle'),
          ('2', 'Écoute active'),
          ('3', 'Empathie'),
          ('4', 'Gestion des conflits'),
          ('5', 'Leadership'),
          ('6', 'Collaboration et travail en équipe'),
          ('7', 'Adaptabilité'),
          ('8', 'Gestion du stress'),
          ('9', 'Intelligence émotionnelle'),
          ('10', 'Confiance en soi'),
          ('11', 'Résolution des problèmes'),
          ('12', 'Prise de décision'),
          ('13', 'Gestion du temps'),
          ('14', 'Persévérance'),
          ('15', 'Esprit critique'),
          ('16', 'Créativité'),
          ('17', 'Proactivité'),
          ('18', 'Sens de l''organisation'),
          ('19', 'Ouverture d''esprit'),
          ('20', 'Sens des responsabilités')
      ) as map(id, label) on lower(btrim(map.label)) = lower(btrim(raw.label))
      limit 5
    ) skill
  ), '{}'),
  'open'
from public.cfa_companies c
left join (
  values
    ('ai_business', 'AI Business'),
    ('sport_business', 'Business Sport'),
    ('real_estate', 'Real Estate'),
    ('retail_experience', 'Retail Experience'),
    ('merchandising', 'Merchandising'),
    ('luxury_premium', 'Luxury & Premium'),
    ('ai_management', 'AI Management'),
    ('business_performance', 'Business Performance'),
    ('transition_innovation', 'Transition & Innovation'),
    ('growth_acquisition', 'Growth & Acquisition'),
    ('entrepreneurship', 'Entrepreneurship'),
    ('international_business', 'International Business'),
    ('strategic_partnerships', 'Strategic Partnerships')
) as labels(code, label) on labels.code = c.apprentice_track_1
where nullif(btrim(c.apprentice_track_1), '') is not null
  and not exists (
    select 1 from public.cfa_company_needs n
    where n.company_id = c.id and n.cursus_id = c.apprentice_track_1
  );

insert into public.cfa_company_needs (company_id, title, cursus_id, quantity, location, status)
select
  c.id,
  coalesce(labels.label, c.apprentice_track_2),
  c.apprentice_track_2,
  1,
  nullif(btrim(c.city), ''),
  'open'
from public.cfa_companies c
left join (
  values
    ('ai_business', 'AI Business'),
    ('sport_business', 'Business Sport'),
    ('real_estate', 'Real Estate'),
    ('retail_experience', 'Retail Experience'),
    ('merchandising', 'Merchandising'),
    ('luxury_premium', 'Luxury & Premium'),
    ('ai_management', 'AI Management'),
    ('business_performance', 'Business Performance'),
    ('transition_innovation', 'Transition & Innovation'),
    ('growth_acquisition', 'Growth & Acquisition'),
    ('entrepreneurship', 'Entrepreneurship'),
    ('international_business', 'International Business'),
    ('strategic_partnerships', 'Strategic Partnerships')
) as labels(code, label) on labels.code = c.apprentice_track_2
where nullif(btrim(c.apprentice_track_2), '') is not null
  and c.apprentice_track_2 is distinct from c.apprentice_track_1
  and not exists (
    select 1 from public.cfa_company_needs n
    where n.company_id = c.id and n.cursus_id = c.apprentice_track_2
  );

create table if not exists public.cfa_company_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cfa_companies (id) on delete cascade,
  type text not null,
  body text,
  actor_id uuid,
  next_action text,
  next_action_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists cfa_company_activities_one_open_action
  on public.cfa_company_activities (company_id)
  where done_at is null and next_action_at is not null;

create index if not exists cfa_company_activities_company_idx
  on public.cfa_company_activities (company_id, created_at desc);

create table if not exists public.cfa_profile_sends (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cfa_companies (id) on delete cascade,
  application_id uuid not null references public.cfa_applications (id) on delete cascade,
  need_id uuid references public.cfa_company_needs (id) on delete set null,
  job_offer_id uuid,
  sent_by uuid,
  sent_to_email text,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  response text check (response is null or response in ('interested', 'declined')),
  token text not null unique,
  expires_at timestamptz not null,
  constraint cfa_profile_sends_target_check check (need_id is not null or job_offer_id is not null)
);

create index if not exists cfa_profile_sends_company_idx on public.cfa_profile_sends (company_id, sent_at desc);

alter table public.cfa_applications
  add column if not exists share_with_companies boolean not null default false,
  add column if not exists share_with_companies_at timestamptz;

alter table public.cfa_audit_events alter column application_id drop not null;
alter table public.cfa_audit_events
  add column if not exists company_id uuid references public.cfa_companies (id) on delete cascade;

alter table public.cfa_audit_events drop constraint if exists cfa_audit_events_target_check;
alter table public.cfa_audit_events
  add constraint cfa_audit_events_target_check check (application_id is not null or company_id is not null);

create index if not exists cfa_audit_events_company_idx
  on public.cfa_audit_events (company_id, created_at desc);

create table if not exists public.cursus_aliases (
  alias text primary key,
  cursus_id text not null,
  created_at timestamptz not null default now()
);

alter table public.organizations
  add column if not exists siret text;

alter table public.organizations drop constraint if exists organizations_siret_digits;
alter table public.organizations
  add constraint organizations_siret_digits check (siret is null or siret ~ '^[0-9]{14}$');

create unique index if not exists organizations_siret_unique
  on public.organizations (siret)
  where siret is not null;

alter table public.cfa_company_contacts enable row level security;
alter table public.cfa_company_needs enable row level security;
alter table public.cfa_company_activities enable row level security;
alter table public.cfa_profile_sends enable row level security;
alter table public.cursus_aliases enable row level security;

alter table public.cfa_companies drop constraint if exists cfa_companies_opco_source_check;
alter table public.cfa_companies
  add constraint cfa_companies_opco_source_check check (
    opco_source is null or opco_source in ('cfadock', 'idcc', 'naf', 'manual')
  );

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'cfa_company_activities'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%profile_sent%'
  loop
    execute format('alter table public.cfa_company_activities drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.cfa_company_activities drop constraint if exists cfa_company_activities_type_check;
alter table public.cfa_company_activities
  add constraint cfa_company_activities_type_check check (
    type in ('note', 'call', 'email', 'meeting', 'status_change', 'profile_sent', 'placement', 'opco_lookup')
  );

drop table if exists public.cfa_siret_opco;
drop table if exists public.cfa_siret_opco_imports;

commit;
