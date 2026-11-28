-- Origine CFA + Futurs candidats (prospects) — une seule table personnes : cfa_applications.
-- Demandes entrantes Business (formation_dossiers) inchangées.

alter table public.cfa_applications
  drop constraint if exists cfa_applications_status_check;

alter table public.cfa_applications
  add constraint cfa_applications_status_check check (
    status in (
      'prospect',
      'brochure',
      'profile',
      'challenge',
      'dossier',
      'interview',
      'review',
      'administrative',
      'admitted',
      'contract',
      'rejected'
    )
  );

alter table public.cfa_applications
  add column if not exists prospect_status text,
  add column if not exists source_family text,
  add column if not exists source_channel text,
  add column if not exists source_detail text,
  add column if not exists prescriber_type text,
  add column if not exists prescriber_org text,
  add column if not exists prescriber_contact text,
  add column if not exists brochure_id text,
  add column if not exists formation_id text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer text,
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists contact_consent boolean not null default false,
  add column if not exists contact_consent_at timestamptz,
  add column if not exists first_touch text,
  add column if not exists last_touch text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists is_test boolean not null default false;

alter table public.cfa_applications
  drop constraint if exists cfa_applications_prospect_status_check;
alter table public.cfa_applications
  add constraint cfa_applications_prospect_status_check check (
    prospect_status is null
    or prospect_status in ('new', 'to_call', 'called', 'not_interested')
  );

alter table public.cfa_applications
  drop constraint if exists cfa_applications_source_family_check;
alter table public.cfa_applications
  add constraint cfa_applications_source_family_check check (
    source_family is null or source_family in ('web', 'human')
  );

alter table public.cfa_applications
  drop constraint if exists cfa_applications_source_channel_check;
alter table public.cfa_applications
  add constraint cfa_applications_source_channel_check check (
    source_channel is null
    or source_channel in (
      'web_preregistration',
      'web_brochure',
      'phone',
      'jpo',
      'direct_meeting',
      'prescriber'
    )
  );

alter table public.cfa_applications
  drop constraint if exists cfa_applications_prescriber_type_check;
alter table public.cfa_applications
  add constraint cfa_applications_prescriber_type_check check (
    prescriber_type is null
    or prescriber_type in ('mission_locale', 'france_travail', 'cio', 'autre')
  );

comment on column public.cfa_applications.source_channel is
  'Canal d’origine CFA. NULL = Origine inconnue (jamais inventé à la migration).';
comment on column public.cfa_applications.first_touch is
  'Premier canal, jamais écrasé.';

create index if not exists cfa_applications_prospect_status_idx
  on public.cfa_applications (prospect_status)
  where status = 'prospect';

create index if not exists cfa_applications_source_channel_idx
  on public.cfa_applications (source_channel);

create table if not exists public.cfa_person_touches (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.cfa_applications (id) on delete cascade,
  type text not null,
  detail text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cfa_person_touches_type_check check (
    type in (
      'brochure_download',
      'preregistration',
      'email_sent',
      'email_opened',
      'call',
      'meeting',
      'stage_change',
      'created',
      'follow_up'
    )
  )
);

create index if not exists cfa_person_touches_person_idx
  on public.cfa_person_touches (person_id, created_at desc);

alter table public.cfa_person_touches enable row level security;
grant all on public.cfa_person_touches to service_role;

create table if not exists public.cfa_jpo_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  held_on date,
  created_at timestamptz not null default now()
);

alter table public.cfa_jpo_events enable row level security;
grant all on public.cfa_jpo_events to service_role;

insert into public.cfa_jpo_events (name, held_on)
select 'JPO 22 novembre', date '2025-11-22'
where not exists (select 1 from public.cfa_jpo_events where name = 'JPO 22 novembre');

insert into public.cfa_jpo_events (name, held_on)
select 'JPO décembre', date '2025-12-13'
where not exists (select 1 from public.cfa_jpo_events where name = 'JPO décembre');

-- Téléchargements de plaquette jusqu’ici : cfa_program_downloads (historique)
-- puis insert cfa_applications status=brochure via /api/ecole/program-brochure.
-- On les bascule en prospects (pas des candidats).
update public.cfa_applications
set
  status = 'prospect',
  prospect_status = coalesce(prospect_status, 'new'),
  source_family = coalesce(source_family, 'web'),
  source_channel = coalesce(source_channel, 'web_brochure'),
  first_touch = coalesce(first_touch, 'web_brochure'),
  last_touch = coalesce(last_touch, 'web_brochure'),
  brochure_id = coalesce(brochure_id, specialization),
  formation_id = coalesce(formation_id, specialization),
  follow_up_at = coalesce(follow_up_at, created_at + interval '48 hours'),
  is_test = is_test
    or email ilike '%+test%'
    or email ilike '%+demo%'
    or email ilike '%@example.com'
    or email ilike '%@byound.test'
where status = 'brochure';

insert into public.cfa_person_touches (person_id, type, detail, created_at)
select a.id, 'brochure_download', 'Migration plaquette', a.created_at
from public.cfa_applications a
where a.source_channel = 'web_brochure'
  and not exists (
    select 1 from public.cfa_person_touches t
    where t.person_id = a.id and t.type = 'brochure_download'
  );

-- Candidats déjà en pipeline : source_channel reste NULL → « Origine inconnue ».
update public.cfa_applications
set
  is_test = is_test
    or email ilike '%+test%'
    or email ilike '%+demo%'
    or email ilike '%@example.com'
    or email ilike '%@byound.test',
  formation_id = coalesce(formation_id, specialization)
where status <> 'prospect';

drop policy if exists cfa_applications_staff_select on public.cfa_applications;
create policy cfa_applications_staff_select
  on public.cfa_applications
  for select
  using (public.user_has_role(auth.uid(), array['super_admin', 'admin']));

drop policy if exists cfa_applications_staff_write on public.cfa_applications;
create policy cfa_applications_staff_write
  on public.cfa_applications
  for all
  using (public.user_has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.user_has_role(auth.uid(), array['super_admin', 'admin']));

drop policy if exists cfa_person_touches_staff on public.cfa_person_touches;
create policy cfa_person_touches_staff
  on public.cfa_person_touches
  for all
  using (public.user_has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.user_has_role(auth.uid(), array['super_admin', 'admin']));

drop policy if exists cfa_jpo_events_staff on public.cfa_jpo_events;
create policy cfa_jpo_events_staff
  on public.cfa_jpo_events
  for all
  using (public.user_has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.user_has_role(auth.uid(), array['super_admin', 'admin']));
