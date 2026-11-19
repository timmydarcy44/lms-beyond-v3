-- Admission Byound School v2 : banque de questions versionnée, réponses médias,
-- parcours structuré, accessibilité hors table candidature.

-- ---------------------------------------------------------------------------
-- Colonnes additionnelles sur cfa_applications (non destructives)
-- ---------------------------------------------------------------------------
alter table public.cfa_applications
  add column if not exists parcours jsonb not null default '{}'::jsonb;

alter table public.cfa_applications
  add column if not exists challenge_v2 jsonb not null default '{}'::jsonb;

alter table public.cfa_applications
  add column if not exists prerequisites_flag text;

alter table public.cfa_applications
  add column if not exists jury_scores jsonb;

comment on column public.cfa_applications.parcours is
  'Parcours v2 : diplôme, année, établissement, situation, expériences, entreprise, etc.';
comment on column public.cfa_applications.challenge_v2 is
  'Réponses challenge v2 (ids question/version + format + texte/média). Ancien challenge_answers conservé.';
comment on column public.cfa_applications.prerequisites_flag is
  'ex. to_verify — prérequis filière non remplis, à vérifier BO.';
comment on column public.cfa_applications.jury_scores is
  'Grille jury : curiosité/logique/communication/motivation 1–4 + commentaire.';

-- ---------------------------------------------------------------------------
-- Banque de questions (versionnée)
-- ---------------------------------------------------------------------------
create table if not exists public.admission_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  specialization text not null default 'common', -- 'common' | slug filière | '_fallback'
  slug text not null,
  label text not null,
  prompt text not null,
  starter_hint text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (specialization, slug)
);

create table if not exists public.admission_challenge_question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.admission_challenge_questions(id) on delete cascade,
  version integer not null,
  label text not null,
  prompt text not null,
  starter_hint text,
  created_at timestamptz not null default now(),
  unique (question_id, version)
);

create index if not exists admission_challenge_questions_spec_idx
  on public.admission_challenge_questions (specialization, active, sort_order);

-- Prérequis filière (diplôme minimum déclaré)
create table if not exists public.admission_track_prerequisites (
  specialization text primary key,
  required_diploma text not null,
  label text not null,
  updated_at timestamptz not null default now()
);

-- Accessibilité / RQTH — hors cfa_applications, hors exports jury
create table if not exists public.admission_accessibility (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.cfa_applications(id) on delete cascade,
  needs_accommodation boolean,
  needs_detail text,
  rqth text check (rqth is null or rqth in ('yes', 'no', 'prefer_not')),
  disability_case_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create index if not exists admission_accessibility_app_idx
  on public.admission_accessibility (application_id);

alter table public.admission_challenge_questions enable row level security;
alter table public.admission_challenge_question_versions enable row level security;
alter table public.admission_track_prerequisites enable row level security;
alter table public.admission_accessibility enable row level security;

-- Lecture publique des questions actives (candidature anonyme via service role aussi)
drop policy if exists admission_questions_public_read on public.admission_challenge_questions;
create policy admission_questions_public_read on public.admission_challenge_questions
  for select using (active = true);

drop policy if exists admission_question_versions_public_read on public.admission_challenge_question_versions;
create policy admission_question_versions_public_read on public.admission_challenge_question_versions
  for select using (
    exists (
      select 1 from public.admission_challenge_questions q
      where q.id = question_id and q.active = true
    )
  );

drop policy if exists admission_prereq_public_read on public.admission_track_prerequisites;
create policy admission_prereq_public_read on public.admission_track_prerequisites
  for select using (true);

-- Accessibilité : uniquement référente handicap / super admin (via user_has_role)
drop policy if exists admission_accessibility_referent_select on public.admission_accessibility;
create policy admission_accessibility_referent_select on public.admission_accessibility
  for select using (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap')
        )
    )
  );

drop policy if exists admission_accessibility_referent_write on public.admission_accessibility;
create policy admission_accessibility_referent_write on public.admission_accessibility
  for all using (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap')
        )
    )
  ) with check (
    public.user_has_role(auth.uid(), array['super_admin', 'admin'])
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role, '')) in ('super_admin', 'handicap_referent', 'referent_handicap')
          or lower(coalesce(p.role_type, '')) in ('handicap_referent', 'referent_handicap')
        )
    )
  );

-- Bucket médias privés (50 Mo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'admission-media',
  'admission-media',
  false,
  52428800,
  array[
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav',
    'video/webm', 'video/mp4', 'video/quicktime',
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Seed questions (idempotent via slug)
insert into public.admission_challenge_questions (specialization, slug, label, prompt, starter_hint, sort_order)
values
  ('common', 'common_reasoning', 'Raisonnement',
   'Un produit plaît beaucoup mais se vend peu. Quelles seraient les trois premières choses que tu chercherais à comprendre ?',
   'Je commencerais par…', 0),
  ('ai_business', 'ai_projection', 'Projection',
   'Si tu avais une IA comme collègue commercial pendant une journée, que lui demanderais-tu de faire ?',
   'Je lui demanderais de…', 1),
  ('ai_business', 'ai_conviction', 'Conviction',
   'Une PME hésite à utiliser l''IA par peur de mal faire. Comment la convaincrais-tu d''essayer ?',
   'Je lui dirais que…', 2),
  ('sport_business', 'sport_curiosity', 'Curiosité business',
   'Un club de foot amateur veut trouver 5 nouveaux partenaires locaux. Par où commencerais-tu ?',
   'Je commencerais par…', 1),
  ('sport_business', 'sport_client', 'Compréhension client',
   'Qu''est-ce qu''un sponsor attend vraiment d''un club, à ton avis ?',
   'À mon avis…', 2),
  ('retail_experience', 'retail_observation', 'Observation',
   'Un client entre dans une boutique, fait le tour et ressort sans rien acheter. Qu''est-ce qui a pu se passer ?',
   'Il a peut-être…', 1),
  ('retail_experience', 'retail_fidelisation', 'Fidélisation',
   'Comment donnerais-tu envie à un client de revenir ?',
   'Je ferais…', 2),
  -- Secours pour filières sans questions propres
  ('_fallback', 'fallback_curiosity', 'Curiosité business',
   'Une entreprise fictive lance un nouveau produit demain. Comment trouverais-tu ses 10 premiers clients ?',
   'Je chercherais d''abord…', 1),
  ('_fallback', 'fallback_projection', 'Projection',
   'Si tu avais une journée pour aider une entreprise à mieux vendre, que ferais-tu en premier ?',
   'En premier, je…', 2)
on conflict (specialization, slug) do update set
  label = excluded.label,
  prompt = excluded.prompt,
  starter_hint = excluded.starter_hint,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Versions v1 pour chaque question (si absente)
insert into public.admission_challenge_question_versions (question_id, version, label, prompt, starter_hint)
select q.id, 1, q.label, q.prompt, q.starter_hint
from public.admission_challenge_questions q
where not exists (
  select 1 from public.admission_challenge_question_versions v
  where v.question_id = q.id and v.version = 1
);

insert into public.admission_track_prerequisites (specialization, required_diploma, label)
values
  ('ai_business', 'bac', 'Bac (général, technologique ou pro)'),
  ('sport_business', 'bac', 'Bac (général, technologique ou pro)'),
  ('real_estate', 'bac', 'Bac (général, technologique ou pro)'),
  ('retail_experience', 'bac', 'Bac (général, technologique ou pro)')
on conflict (specialization) do update set
  required_diploma = excluded.required_diploma,
  label = excluded.label,
  updated_at = now();
