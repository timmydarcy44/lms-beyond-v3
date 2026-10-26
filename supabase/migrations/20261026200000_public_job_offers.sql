-- Offres publiques anonymes sur byound.fr.
-- À coller dans l'éditeur SQL Supabase. Rejouable.

begin;

alter table public.job_offers
  add column if not exists public_listing boolean not null default true,
  add column if not exists public_slug text,
  add column if not exists public_status text,
  add column if not exists anonymity_flags jsonb not null default '[]'::jsonb,
  add column if not exists soft_skill_ids jsonb not null default '[]'::jsonb;

alter table public.job_offers drop constraint if exists job_offers_public_status_check;
alter table public.job_offers
  add constraint job_offers_public_status_check
  check (public_status is null or public_status in ('pending_review', 'published', 'blocked'));

create unique index if not exists job_offers_public_slug_key
  on public.job_offers (public_slug)
  where public_slug is not null;

create table if not exists public.naf_sector_groups (
  division_from int not null,
  division_to int not null,
  label text not null,
  primary key (division_from, division_to)
);

insert into public.naf_sector_groups (division_from, division_to, label) values
  (1, 3, 'Agriculture'),
  (10, 33, 'Industrie'),
  (41, 43, 'Bâtiment'),
  (45, 45, 'Commerce et réparation automobile'),
  (46, 46, 'Commerce de gros'),
  (47, 47, 'Commerce de détail'),
  (49, 53, 'Transport et logistique'),
  (55, 56, 'Hôtellerie et restauration'),
  (58, 63, 'Numérique et information'),
  (64, 66, 'Banque et assurance'),
  (68, 68, 'Immobilier'),
  (69, 75, 'Conseil et services aux entreprises'),
  (85, 85, 'Enseignement'),
  (86, 88, 'Santé et action sociale'),
  (90, 93, 'Culture, sport et loisirs')
on conflict (division_from, division_to) do update set label = excluded.label;

create or replace function public.public_sector_label(naf text)
returns text
language sql
stable
as $$
  select coalesce(
    (
      select g.label
      from public.naf_sector_groups g
      where nullif(substring(coalesce(naf, '') from '([0-9]{2})'), '')::int between g.division_from and g.division_to
      order by (g.division_to - g.division_from), g.division_from
      limit 1
    ),
    case when nullif(btrim(coalesce(naf, '')), '') is null then 'Secteur non précisé' else 'Autre activité' end
  );
$$;

create or replace function public.public_size_label(raw text)
returns text
language sql
immutable
as $$
  select case
    when nullif(btrim(coalesce(raw, '')), '') is null then 'Taille non précisée'
    when raw ~* '0 salarié|1 ou 2|3 à 5|6 à 9|1-10|1 à 9' then 'TPE · ' || btrim(raw)
    when raw ~* '10 à 19|20 à 49|10 à 49|11-50|11 à 50' then 'PME · ' || btrim(raw)
    when raw ~* '50 à 99|100 à 199|51-200|50 à 249' then 'ETI · ' || btrim(raw)
    when raw ~* '200 à|250 à|500 à|1 000|1000|201-500|500\+' then 'Grande entreprise · ' || btrim(raw)
    else btrim(raw)
  end;
$$;

create or replace view public.public_job_offers
with (security_invoker = false) as
select
  o.public_slug as slug,
  o.title,
  public.public_sector_label(coalesce(c.naf_code, '')) as sector,
  public.public_size_label(coalesce(nullif(btrim(c.headcount_range), ''), nullif(btrim(org.company_size_band), ''))) as size_label,
  case
    when o.city ~* '(rue|avenue|boulevard|impasse|allée|allee|chemin)\s' then null
    else nullif(btrim(o.city), '')
  end as city,
  o.contract_type,
  o.contract_duration,
  o.start_label,
  o.work_mode,
  o.hours_per_week,
  case
    when lower(coalesce(o.contract_type, '')) ~ 'alternance|apprentissage'
      then 'Selon l''âge et l''année du contrat'
    else nullif(btrim(o.salary_range), '')
  end as pay_label,
  o.benefits,
  o.description,
  o.diploma_prepared,
  o.recruitment_steps,
  o.soft_skill_ids,
  o.created_at as published_at,
  coalesce((
    select jsonb_agg(i.label order by s.position)
    from public.offer_skills s
    join public.offer_skill_items i on i.id = s.skill_id
    where s.offer_id = o.id
  ), '[]'::jsonb) as skills
from public.job_offers o
join public.organizations org on org.id = o.school_id
left join lateral (
  select naf_code, headcount_range
  from public.cfa_companies
  where organization_id = o.school_id
  limit 1
) c on true
where o.status = 'active'
  and coalesce(o.public_listing, true)
  and o.public_status = 'published'
  and o.public_slug is not null;

revoke all on public.public_job_offers from public;
grant select on public.public_job_offers to anon, authenticated;

revoke select on table public.job_offers from anon;

commit;
