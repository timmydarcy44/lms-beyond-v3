-- Complément 2. Script idempotent, non appliqué.
-- Ne réécrit pas les credentials déjà émis.
-- Les badges de Jessica et Timmy sont exclus de toute mise à jour.
-- Les séries ne sont pas créées ici : les regroupements doivent être validés avant insertion.

create table if not exists public.badge_domains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#6E5BFF',
  icon text not null default 'brain',
  archived_at timestamptz
);

create table if not exists public.badge_series (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain_id uuid references public.badge_domains (id),
  created_by uuid
);

create table if not exists public.competencies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  definition text not null default '',
  domain_id uuid references public.badge_domains (id),
  status text not null default 'draft' check (status in ('draft', 'validated')),
  validated_by text,
  validated_at timestamptz,
  archived_at timestamptz
);

create table if not exists public.badge_competencies (
  badge_id uuid not null references public.open_badges (id) on delete cascade,
  competency_id uuid not null references public.competencies (id),
  primary key (badge_id, competency_id)
);

alter table public.open_badges
  add column if not exists domain_id uuid references public.badge_domains (id),
  add column if not exists series_id uuid references public.badge_series (id),
  add column if not exists level_label text,
  add column if not exists linked_course_id uuid,
  add column if not exists course_required_before_exam boolean not null default false,
  add column if not exists fallback_course_id uuid;

alter table public.badge_domains enable row level security;
alter table public.badge_series enable row level security;
alter table public.competencies enable row level security;
alter table public.badge_competencies enable row level security;

-- Domaines texte déjà saisis dans le formulaire.
insert into public.badge_domains (name, slug, color, icon)
select distinct
  trim(domain_name),
  trim(both '-' from regexp_replace(lower(trim(domain_name)), '[^a-z0-9]+', '-', 'g')),
  '#6E5BFF',
  'brain'
from (
  select evaluation_config -> 'builder' ->> 'domain' as domain_name
  from public.open_badges
  where id not in (
    'c541654e-858f-47c3-b84c-30466fc4dcf4',
    'a1000001-0000-4000-8000-000000000001'
  )
) domains
where coalesce(trim(domain_name), '') <> ''
on conflict (slug) do nothing;

update public.open_badges as badge
set domain_id = domain.id
from public.badge_domains as domain
where badge.id not in (
  'c541654e-858f-47c3-b84c-30466fc4dcf4',
  'a1000001-0000-4000-8000-000000000001'
)
  and badge.domain_id is null
  and domain.slug = trim(both '-' from regexp_replace(lower(trim(badge.evaluation_config -> 'builder' ->> 'domain')), '[^a-z0-9]+', '-', 'g'));

-- Formations liées. course_id reste la clé unique du badge studio et n'est pas réécrit.
update public.open_badges
set
  linked_course_id = coalesce(required_course_id, course_id),
  course_required_before_exam = required_course_id is not null,
  fallback_course_id = coalesce(required_course_id, course_id)
where id not in (
  'c541654e-858f-47c3-b84c-30466fc4dcf4',
  'a1000001-0000-4000-8000-000000000001'
)
  and linked_course_id is null
  and coalesce(required_course_id, course_id) is not null;

-- Compétences reprises des skills, validées par l'admin Byound à la date de migration.
insert into public.competencies (slug, name, definition, status, validated_by, validated_at)
select distinct
  trim(both '-' from regexp_replace(lower(trim(skill)), '[^a-z0-9]+', '-', 'g')),
  trim(skill),
  'Compétence reprise lors de la migration vers le référentiel Byound.',
  'validated',
  'Admin Byound',
  now()
from public.open_badges as badge
cross join lateral jsonb_array_elements_text(coalesce(badge.evaluation_config -> 'builder' -> 'skills', '[]'::jsonb)) as skill
where badge.id not in (
  'c541654e-858f-47c3-b84c-30466fc4dcf4',
  'a1000001-0000-4000-8000-000000000001'
)
  and coalesce(trim(skill), '') <> ''
on conflict (slug) do nothing;

insert into public.badge_competencies (badge_id, competency_id)
select badge.id, competency.id
from public.open_badges as badge
cross join lateral jsonb_array_elements_text(coalesce(badge.evaluation_config -> 'builder' -> 'skills', '[]'::jsonb)) as skill
join public.competencies as competency
  on competency.slug = trim(both '-' from regexp_replace(lower(trim(skill)), '[^a-z0-9]+', '-', 'g'))
where badge.id not in (
  'c541654e-858f-47c3-b84c-30466fc4dcf4',
  'a1000001-0000-4000-8000-000000000001'
)
on conflict do nothing;

-- Séries : ne pas insérer tant que les regroupements proposés ne sont pas validés.
-- select id, coalesce(name, title) as name, coalesce(level, nullif(evaluation_config ->> 'level', '')::int) as level
-- from public.open_badges
-- order by name, level;
