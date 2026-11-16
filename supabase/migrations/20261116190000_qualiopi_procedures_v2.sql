-- Qualiopi — Procédures qualité v2 (remplace l’UX « Documents process »)
-- Ne pas confondre validation avec l’ancien status ready/attested.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.crm_qualiopi_procedures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legacy_kind text unique,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'validated', 'archived')),
  current_version text not null default '0.1',
  indicators int[] not null default '{}',
  legal_obligation boolean not null default false,
  owner_id uuid references auth.users (id) on delete set null,
  owner_name text,
  validated_by uuid references auth.users (id) on delete set null,
  validated_by_name text,
  validated_at timestamptz,
  effective_date date,
  next_review_at date,
  audiences text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_qualiopi_procedure_sections (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.crm_qualiopi_procedures (id) on delete cascade,
  key text not null check (
    key in (
      'objet',
      'champ_application',
      'responsabilites',
      'deroulement',
      'suivi_preuves',
      'indicateurs_suivi',
      'revision'
    )
  ),
  position int not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (procedure_id, key)
);

create index if not exists crm_qualiopi_procedure_sections_proc_idx
  on public.crm_qualiopi_procedure_sections (procedure_id, position);

create table if not exists public.crm_qualiopi_procedure_versions (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.crm_qualiopi_procedures (id) on delete cascade,
  version text not null,
  pdf_path text,
  content_snapshot jsonb not null default '{}'::jsonb,
  validated_by uuid references auth.users (id) on delete set null,
  validated_by_name text,
  validated_at timestamptz not null default now(),
  effective_date date,
  next_review_at date,
  audiences text[] not null default '{}',
  unique (procedure_id, version)
);

create table if not exists public.crm_qualiopi_procedure_reads (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.crm_qualiopi_procedures (id) on delete cascade,
  version text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  unique (procedure_id, version, user_id)
);

create index if not exists crm_qualiopi_procedure_reads_user_idx
  on public.crm_qualiopi_procedure_reads (user_id, read_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_procedures enable row level security;
alter table public.crm_qualiopi_procedure_sections enable row level security;
alter table public.crm_qualiopi_procedure_versions enable row level security;
alter table public.crm_qualiopi_procedure_reads enable row level security;

drop policy if exists crm_qualiopi_procedures_super on public.crm_qualiopi_procedures;
create policy crm_qualiopi_procedures_super on public.crm_qualiopi_procedures
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_procedure_sections_super on public.crm_qualiopi_procedure_sections;
create policy crm_qualiopi_procedure_sections_super on public.crm_qualiopi_procedure_sections
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_procedure_versions_super on public.crm_qualiopi_procedure_versions;
create policy crm_qualiopi_procedure_versions_super on public.crm_qualiopi_procedure_versions
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_procedure_reads_own on public.crm_qualiopi_procedure_reads;
create policy crm_qualiopi_procedure_reads_own on public.crm_qualiopi_procedure_reads
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

drop policy if exists crm_qualiopi_procedure_reads_update_own on public.crm_qualiopi_procedure_reads;
create policy crm_qualiopi_procedure_reads_update_own on public.crm_qualiopi_procedure_reads
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists crm_qualiopi_procedure_reads_super_all on public.crm_qualiopi_procedure_reads;
create policy crm_qualiopi_procedure_reads_super_all on public.crm_qualiopi_procedure_reads
  for all using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid() and sa.is_active = true)
  );

-- ---------------------------------------------------------------------------
-- Seed depuis découpage validé (idempotent via slug)
-- ---------------------------------------------------------------------------
insert into public.crm_qualiopi_procedures (
  slug, legacy_kind, title, status, current_version, indicators, legal_obligation, owner_name
)
values
  (
    'formateurs',
    'formateurs',
    'Plan de développement des compétences des formateurs',
    'draft',
    '0.1',
    array[21, 22]::int[],
    false,
    'Timmy Darcy'
  ),
  (
    'handicap',
    'handicap',
    'Accueil des personnes en situation de handicap',
    'draft',
    '0.1',
    array[26]::int[],
    false,
    'Timmy Darcy'
  ),
  (
    'moyens',
    'moyens',
    'Moyens matériels et locaux',
    'draft',
    '0.1',
    array[17]::int[],
    false,
    'Timmy Darcy'
  ),
  (
    'paq',
    'paq',
    'Comité qualité et plan d’amélioration',
    'draft',
    '0.1',
    array[32]::int[],
    false,
    'Timmy Darcy'
  ),
  (
    'reclamations',
    'reclamations',
    'Traitement des réclamations',
    'draft',
    '0.1',
    array[31]::int[],
    false,
    'Timmy Darcy'
  ),
  (
    'signalements',
    'signalements',
    'Signalements (violences, harcèlement, discriminations)',
    'draft',
    '0.1',
    '{}'::int[],
    true,
    'Timmy Darcy'
  )
on conflict (slug) do nothing;

-- Sections : 7 clés × 6 procédures
with procs as (
  select id, slug from public.crm_qualiopi_procedures
  where slug in ('formateurs', 'handicap', 'moyens', 'paq', 'reclamations', 'signalements')
),
keys as (
  select * from (values
    ('objet', 1),
    ('champ_application', 2),
    ('responsabilites', 3),
    ('deroulement', 4),
    ('suivi_preuves', 5),
    ('indicateurs_suivi', 6),
    ('revision', 7)
  ) as t(key, position)
)
insert into public.crm_qualiopi_procedure_sections (procedure_id, key, position, content)
select p.id, k.key, k.position, ''
from procs p
cross join keys k
on conflict (procedure_id, key) do nothing;

-- Contenu découpé (update)
update public.crm_qualiopi_procedure_sections s
set content = v.content, updated_at = now()
from (
  select p.id as procedure_id, x.key, x.content
  from public.crm_qualiopi_procedures p
  join (
    values
      -- formateurs
      ('formateurs', 'objet', 'Maintenir et développer les compétences pédagogiques et métier des experts / formateurs.'),
      ('formateurs', 'deroulement', E'## Diagnostic\nGrille compétences par expert (technique, pédagogique, digital, Qualiopi).\n\n## Actions types\n- Observation croisée / co-animation\n- Formation courte (outil, pédagogie, IA)\n- Retour d’expérience session'),
      ('formateurs', 'suivi_preuves', E'Chaque action : date, objectif, preuve (attest. / capture), statut.\nModule experts + synthèse annuelle.'),
      -- handicap
      ('handicap', 'responsabilites', E'## Référent handicap\nContact : referent-handicap@byound.fr'),
      ('handicap', 'deroulement', E'## Modalités\n- Étude personnalisée de chaque situation\n- Adaptation pédagogique / technique possible selon le parcours\n- Information sur les fiches formation publiques\n\n## Partenariats\nÀ lister (Agefiph, Cap emploi, MDPH, partenaires locaux…).\n\n> Note migration : sections hors titres standard regroupées ici.'),
      ('handicap', 'suivi_preuves', 'Note + échanges datés + partenariats.'),
      -- moyens
      ('moyens', 'champ_application', E'## Périmètre\nFormations distancielles / hybrides via plateforme Byound + moyens éventuels en présentiel.'),
      ('moyens', 'deroulement', E'## Plateforme\nLMS Byound (accès, supports, émargement, satisfaction).\n\n## Présentiel (si applicable)\nLocaux partenaires / client — capacité, accessibilité, matériel.'),
      ('moyens', 'suivi_preuves', 'Cette note + captures / contrats locaux si présentiel.'),
      -- paq
      ('paq', 'objet', 'Assurer l’amélioration continue à partir des retours, réclamations et veilles.'),
      ('paq', 'deroulement', E'## Fréquence\nRevue mensuelle (1 h) + revue annuelle.\n\n## Entrées\n- Satisfactions sessions\n- Réclamations\n- Veille (highlights traités)\n- Feedback formateurs / experts\n\n## Sorties\n- Plan d’actions : cause → action → responsable → échéance → statut\n- Compte rendu daté'),
      ('paq', 'suivi_preuves', 'Module /super/crm/qualiopi/qualite (actions) + export PDF.'),
      -- reclamations
      ('reclamations', 'objet', 'Décrire comment toute réclamation relative à une action de formation est recueillie, traitée et clôturée.'),
      ('reclamations', 'champ_application', E'## Destinataires\nApprenants, entreprises clientes, financeurs, partenaires.'),
      ('reclamations', 'deroulement', E'## Canaux\n- Formulaire / e-mail qualité : qualite@byound.fr (à confirmer)\n- Module Qualité dans /super/crm/qualiopi/qualite\n- Remontée via questionnaire de satisfaction (note basse)\n\n## Délais\n- Accusé de réception sous 2 jours ouvrés\n- Réponse écrite sous 10 jours ouvrés (sauf complexité signalée)\n\n## Étapes\n1. Enregistrement dans le registre des réclamations\n2. Analyse des faits et pièces\n3. Proposition de réponse / action corrective\n4. Clôture et information du demandeur\n5. Lien éventuel vers le plan d’actions qualité (ind. 32)'),
      ('reclamations', 'suivi_preuves', E'## Conservation\nRegistre conservé 3 ans minimum.'),
      -- signalements (placeholder live)
      ('signalements', 'deroulement', E'À rédiger — procédure écrite de recueil et traitement des signalements sensibles (anonymat possible, délais, référent dédié).\n\n> Note migration : contenu non structuré regroupé ici.')
  ) as x(slug, key, content) on p.slug = x.slug
) v
where s.procedure_id = v.procedure_id and s.key = v.key and coalesce(trim(s.content), '') = '';
